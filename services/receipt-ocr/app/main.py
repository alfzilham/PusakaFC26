import base64
import io
import json
import logging
import os
import re
import urllib.error
import urllib.request

import imagehash
import pytesseract
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("receipt-ocr")

app = FastAPI(title="PusakaFC26 Receipt OCR")

# Keywords broadened to cover both bank transfer receipts AND e-wallet
# (DANA/OVO/GoPay/ShopeePay/QRIS) receipts, which use different terms.
RECEIPT_TERMS = (
    # bank transfer terms
    "transfer", "berhasil", "successful", "bank", "rekening",
    "nominal", "amount", "saldo", "tanggal",
    # e-wallet / general payment terms
    "sukses", "success", "transaksi", "pembayaran", "payment",
    "dana", "ovo", "gopay", "shopeepay", "qris",
    "jumlah", "total", "bayar", "pengirim", "penerima",
)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB, matches frontend limit


def local_structure_check(image: Image.Image) -> bool:
    """Conservative local check; Gemini handles non-standard/manual receipts."""
    try:
        text = pytesseract.image_to_string(image).lower()
    except Exception:
        logger.exception("Local OCR (pytesseract) raised an exception")
        return False
    hits = [term for term in RECEIPT_TERMS if term in text]
    logger.info("Local OCR matched %d keyword(s): %s", len(hits), hits)
    return len(hits) >= 2


def gemini_structure_check(image_bytes: bytes, mime_type: str) -> bool:
    """
    Calls Gemini to judge whether the image looks like a valid payment receipt
    (digital bank transfer OR a handwritten/manual receipt for cash payments).

    IMPORTANT: every failure path below is logged with a distinct reason.
    A previous version of this function caught all exceptions silently and
    always returned False, which made it impossible to tell whether a
    rejection was due to a missing/invalid API key, a network issue, a
    safety-filter block, or an actually-invalid receipt. If every receipt is
    being rejected, check these logs first.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        logger.warning(
            "GEMINI_API_KEY is not set — Gemini fallback is disabled and will "
            "always reject. Set GEMINI_API_KEY in the environment to enable it."
        )
        return False

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    payload = {
        "contents": [{"parts": [
            {"text": (
                "Apakah gambar ini memiliki struktur bukti transfer bank, "
                "bukti pembayaran e-wallet (DANA/OVO/GoPay/ShopeePay/QRIS), "
                "atau kuitansi pembayaran manual tulisan tangan yang dapat "
                "dibaca? Jawab hanya VALID atau INVALID."
            )},
            {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode("ascii")}},
        ]}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 8},
    }
    request = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        # Gemini returned a non-2xx status (e.g. 400 invalid key, 403 quota,
        # 429 rate limited, 500 server error). Log the actual body so the
        # real reason is visible instead of a generic failure.
        error_body = e.read().decode("utf-8", errors="replace")
        logger.error(
            "Gemini API returned HTTP %s: %s", e.code, error_body[:500]
        )
        return False
    except urllib.error.URLError as e:
        logger.error("Gemini API request failed (network/DNS/timeout): %s", e.reason)
        return False
    except TimeoutError:
        logger.error("Gemini API request timed out after 30s")
        return False

    try:
        body = json.loads(raw_body)
    except json.JSONDecodeError:
        logger.error("Gemini API returned non-JSON response: %s", raw_body[:500])
        return False

    # A request can succeed at the HTTP level but still carry no candidates,
    # most commonly because Gemini's safety filters blocked the image.
    if "candidates" not in body or not body["candidates"]:
        block_reason = body.get("promptFeedback", {}).get("blockReason", "unknown")
        logger.warning(
            "Gemini returned no candidates (likely safety-blocked). "
            "blockReason=%s, full response=%s", block_reason, body
        )
        return False

    try:
        text = body["candidates"][0]["content"]["parts"][0]["text"].upper()
    except (KeyError, IndexError, AttributeError):
        logger.error("Unexpected Gemini response shape: %s", body)
        return False

    is_valid = re.search(r"\bVALID\b", text) is not None
    logger.info("Gemini verdict: %r -> valid=%s", text.strip(), is_valid)
    return is_valid


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        logger.warning("Received empty file upload")
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        logger.warning("File too large: %d bytes", len(image_bytes))
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        # verify() leaves the file object unusable for further operations,
        # so we must reopen it before actually reading pixel data.
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except UnidentifiedImageError:
        logger.warning("Uploaded file is not a readable image")
        return {"status": "failed", "receiptHash": "", "reason": "not_an_image"}
    except Exception:
        logger.exception("Unexpected error while opening uploaded image")
        return {"status": "failed", "receiptHash": "", "reason": "image_open_error"}

    # Normalize color mode before hashing/OCR — RGBA/P/CMYK images are common
    # from screenshots and some phone cameras, and can behave inconsistently
    # across PIL/tesseract/imagehash if left unconverted.
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    try:
        receipt_hash = str(imagehash.phash(image))
    except Exception:
        logger.exception("Failed to compute perceptual hash")
        receipt_hash = ""

    valid = local_structure_check(image)
    scan_method = "ocr"
    if not valid:
        logger.info("Local OCR check failed, falling back to Gemini")
        valid = gemini_structure_check(image_bytes, file.content_type or "image/jpeg")
        scan_method = "gemini" if valid else "none"

    logger.info(
        "Scan result: valid=%s method=%s hash=%s filename=%s",
        valid, scan_method, receipt_hash, file.filename,
    )

    return {
        "status": "success" if valid else "failed",
        "receiptHash": receipt_hash,
        "scanMethod": scan_method,
    }

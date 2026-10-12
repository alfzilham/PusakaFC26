import base64
import io
import os
import re

import imagehash
import pytesseract
from fastapi import FastAPI, File, UploadFile
from PIL import Image

app = FastAPI(title="PusakaFC26 Receipt OCR")

RECEIPT_TERMS = ("transfer", "berhasil", "successful", "bank", "rekening", "nominal", "amount", "saldo", "tanggal")


def local_structure_check(image: Image.Image) -> bool:
    """Conservative local check; Gemini handles non-standard/manual receipts."""
    try:
        text = pytesseract.image_to_string(image).lower()
    except Exception:
        return False
    hits = sum(term in text for term in RECEIPT_TERMS)
    return hits >= 2


def gemini_structure_check(image_bytes: bytes, mime_type: str) -> bool:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return False
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    import urllib.request
    import json

    payload = {
        "contents": [{"parts": [
            {"text": "Apakah gambar ini memiliki struktur bukti transfer bank atau kuitansi pembayaran manual yang dapat dibaca? Jawab hanya VALID atau INVALID."},
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
            body = json.loads(response.read().decode("utf-8"))
        text = body["candidates"][0]["content"]["parts"][0]["text"].upper()
        return re.search(r"\bVALID\b", text) is not None
    except Exception:
        return False


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    image_bytes = await file.read()
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        image = Image.open(io.BytesIO(image_bytes))
    except Exception:
        return {"status": "failed", "receiptHash": ""}

    receipt_hash = str(imagehash.phash(image))
    valid = local_structure_check(image)
    if not valid:
        valid = gemini_structure_check(image_bytes, file.content_type or "image/jpeg")
    return {"status": "success" if valid else "failed", "receiptHash": receipt_hash}

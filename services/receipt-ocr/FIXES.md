# Fixes Applied to `receipt-ocr` Service

## Root Cause (most likely explanation for the "Struk tidak terbaca" error in your screenshot)

**`gemini_structure_check` was silently swallowing all errors and always returning `False` with no logging.** If `GEMINI_API_KEY` is missing, invalid, expired, rate-limited, or the response is safety-blocked — the function just returns `False` with zero indication of why. Combined with a local OCR keyword list that only recognizes *bank transfer* terms (not e-wallet terms), many legitimate receipts would always fail both checks and show "Struk tidak terbaca."

**→ Action for you**: check whether `GEMINI_API_KEY` is actually set correctly on the Railway service for this OCR microservice. The fixed version now logs a clear warning if it's missing, so redeploying with this fix will immediately tell you if that's the issue.

## Bugs Fixed

1. **Silent Gemini failures (critical)** — every failure path (missing key, HTTP error, network error, timeout, safety-blocked response, unexpected response shape) is now caught separately and logged with the actual reason, instead of one bare `except Exception: return False`.

2. **Keyword list too narrow for e-wallet receipts** — `RECEIPT_TERMS` only included bank-transfer terms (`transfer`, `berhasil`, `bank`, `rekening`, ...). Receipts from DANA/OVO/GoPay/ShopeePay/QRIS typically say `sukses`, `transaksi`, `pembayaran`, etc. and don't mention "bank" or "rekening" at all — these were always failing local OCR and falling through to Gemini unnecessarily. Added e-wallet and general payment terms to the list.

3. **No logging anywhere** — there was no way to tell, from logs alone, whether OCR matched any keywords, which path (OCR vs Gemini) produced the result, or why a scan failed. Added structured logging at each decision point.

4. **No file size / empty file validation** — an empty or oversized upload would proceed straight into PIL without any guard, risking unclear errors. Added explicit checks (`400` for empty, `413` for over the 10 MB frontend limit).

5. **Unhandled image mode edge cases** — RGBA/palette/CMYK images (common from screenshots or certain phone cameras) were passed directly into `pytesseract` and `imagehash` without normalization, which can cause inconsistent behavior across different image types. Now normalized to `RGB` before processing.

6. **Corrupt file handling** — `image.verify()` followed by reusing the same `Image` object without reopening is a known PIL pitfall (`verify()` invalidates the file pointer for further reads). Fixed to properly reopen and `.load()` the image after verification, and to return a clear `{"status": "failed", "reason": "not_an_image"}` instead of an unhandled exception for genuinely corrupt uploads.

## What Did NOT Change

- Overall endpoint contract (`POST /scan`) — still returns `status: "success" | "failed"` and `receiptHash`. Added an extra `scanMethod` field (`"ocr" | "gemini" | "none"`) which is additive and won't break existing frontend code that only reads `status`/`receiptHash`.
- Dockerfile, requirements.txt — unchanged, no new dependencies needed.
- Overall OCR → Gemini fallback flow — unchanged in structure, only made observable via logging and fixed the keyword gap.

## Recommended Next Step

After redeploying this fixed version to Railway, re-test with the exact receipt image from your screenshot and check the service logs. The logs will now tell you precisely:
- How many/which keywords matched locally
- Whether it fell back to Gemini
- If Gemini was called, whether it succeeded, and if not, the exact reason (missing key / HTTP error / safety block / etc.)

This will tell us definitively whether the remaining issue (if any) is a missing `GEMINI_API_KEY`, an actual unreadable receipt, or something else entirely.

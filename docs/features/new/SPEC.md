# SPEC.md — Struk Scanner Feature

> **Current implementation note (14 Oktober 2026):** The implemented service topology is Vercel + Supabase. WAHA validation and WAHA notification calls described below are obsolete; phone normalization is local and rejection uses manual click-to-chat.

## Entry Point (All Documents Start Here)

```
[User Input Full Name (dropdown)] + [User Input Phone/WA Number] + [User Input Receipt Image] → Submit
```

## 1. Database Schema (Prisma)

One receipt record per registrant, overwritten on resubmission. Assumes an existing `Registrant` model (or equivalent) already used by the jersey registration form.

```prisma
model PaymentReceipt {
  id            String    @id @default(cuid())
  registrantId  String    @unique      // 1 record per registrant; enforces "overwrite on resubmit"
  registrant    Registrant @relation(fields: [registrantId], references: [id])

  phoneNumber   String                 // used only for rejection notifications
  phoneVerified Boolean   @default(false) // retained for compatibility; no WAHA check is performed

  imageUrl      String                 // Supabase storage URL, .webp format
  receiptHash   String                 // perceptual hash (pHash), stored as hex string

  status        PaymentStatus @default(PENDING_VERIFICATION)
  // Note: "NOT_SUBMITTED" (white row) is represented by the ABSENCE of a
  // PaymentReceipt record for a registrant, not as an enum value.

  reviewedBy    String?                // Bendahara or Super Admin identifier
  reviewedAt    DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum PaymentStatus {
  PENDING_VERIFICATION  // yellow — passed automated scan, awaiting Bendahara
  VERIFIED              // green  — approved by Bendahara
  REJECTED              // red    — rejected by Bendahara
}
```

**Important**: Auto-rejected submissions (failed scan, or duplicate detected) never reach this table — they are rejected in the API route before any `PaymentReceipt` row is created or updated.

## 2. Service Architecture Overview

See ARCHITECTURE.md for the full diagram. Summary of responsibilities:

| Service | Responsibility |
|---|---|
| Next.js API Routes | Orchestration: receives form submission, calls OCR service, writes to PostgreSQL via Prisma, uploads to Supabase |
| FastAPI OCR Service (Python, separate Vercel project) | Receipt structure check, Gemini AI fallback, pHash computation |
| WhatsApp click-to-chat | Manual rejection message opened by the reviewer; no server-side WhatsApp service |
| Supabase | Receipt image storage (`.webp`) |
| PostgreSQL (existing) | `PaymentReceipt` and registrant data, via Prisma |

## 3. API Endpoints (Next.js)

### `POST /api/receipts/submit`

Request (multipart/form-data):
```
registrantId: string
phoneNumber: string
receiptImage: file
```

Processing steps:
1. Normalize the national/international Indonesian phone number.
2. Forward `receiptImage` to FastAPI OCR service `POST /scan` (see section 4).
3. If OCR service returns `status: "failed"` → return `422`, do not create/update any `PaymentReceipt` row.
4. If the pHash matches an existing receipt within the similarity threshold → return `409`, do not create/update any row.
5. Otherwise: convert image to `.webp`, upload to Supabase, upsert `PaymentReceipt` for `registrantId` with `status: PENDING_VERIFICATION`.

Response:
```json
{ "status": "pending_verification" }
```
or an error body with the relevant `4xx` code above.

### `GET /api/receipts/pending`

Returns all `PaymentReceipt` rows with `status: PENDING_VERIFICATION`, joined with registrant full name, for the Bendahara review page. Access restricted to Bendahara/Super Admin session.

### `POST /api/receipts/:id/approve`

Sets `status: VERIFIED`, `reviewedBy`, `reviewedAt`. No notification sent. Restricted to Bendahara/Super Admin.

### `POST /api/receipts/:id/reject`

Deletes the pending `PaymentReceipt` row and its Supabase Storage image, then returns `phoneNumber` so the client can open a generic WhatsApp click-to-chat link. Restricted to Bendahara/Super Admin.

### `POST /api/receipts/:id/replace` (Super Admin only)

Accepts a new `receiptImage` for an existing `registrantId`. Re-runs the same scan + pHash pipeline as `/submit`, overwrites `imageUrl` and `receiptHash`, resets `status: PENDING_VERIFICATION`. Bendahara performs final approval/rejection as normal afterward.

## 4. FastAPI OCR Service Contract

Deployed as an independent Vercel project.

### `POST /scan`

Request:
```
multipart/form-data
file: image
```

Processing:
1. Attempt structure check against standard digital receipt layout (Python/OCR).
2. If structure check fails → fallback to Gemini AI (handles non-standard formats, including handwritten manual receipts for cash payments).
3. Compute perceptual hash (pHash) of the image, via `imagehash` or equivalent.

Response:
```json
{
  "status": "success" | "failed",
  "receiptHash": "a1b2c3d4e5f6..."  // present even if status is "failed", for logging/debug
}
```

- `status: "success"` — either OCR or Gemini confirmed a valid receipt structure.
- `status: "failed"` — neither OCR nor Gemini could read the image. Caller (Next.js) treats this as an auto-reject; the record is never saved.

Duplicate detection is **not** performed inside this endpoint — the OCR service only returns the hash. Comparison against stored hashes happens in the Next.js API route (section 3), since that is where the database is accessible.

## 5. Duplicate Detection Logic (pHash)

- Algorithm: perceptual hash (pHash), not exact hash (MD5/SHA256) — chosen because exact hashes fail to detect visually-identical images that have been re-compressed (e.g., by WhatsApp's automatic compression on forward/resend).
- Comparison metric: Hamming distance between the new image's hash and every stored `receiptHash`.
- Suggested starting threshold: Hamming distance ≤ 10 (to be tuned; false positives are expected to be rare at this scale of ~250 users).
- On replace (`/api/receipts/:id/replace`), the new hash overwrites the old one, so the record does not later flag as a duplicate of itself.

## 6. WhatsApp rejection flow

- No WAHA endpoint is called.
- The reject response includes the normalized phone number.
- The client opens a `wa.me` click-to-chat URL with a generic rejection message.
- The reviewer must press Send manually; approval sends no notification.

## 7. Image Storage Pipeline

```
Receipt uploaded → OCR/Gemini scan completes → convert to .webp → upload to Supabase → store returned URL in imageUrl
```

- Conversion to `.webp` happens **after** the scan step (the scan operates on the original uploaded format).
- Rejected receipt images are deleted from Supabase Storage together with their database row. Approved images remain stored with the registrant record.

## 8. Status Transition Summary

```
(no record)
  → [submit, scan success, no duplicate] → PENDING_VERIFICATION
  → [submit, scan fails OR duplicate]    → (no record created — auto-reject)

PENDING_VERIFICATION
  → [Bendahara approves] → VERIFIED
  → [Bendahara rejects]  → REJECTED (+ WA notification sent)

REJECTED
  → [user resubmits, scan success, no duplicate] → PENDING_VERIFICATION (same row, overwritten)
  → [Super Admin replaces receipt] → PENDING_VERIFICATION (same row, overwritten)
```

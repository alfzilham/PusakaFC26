# PRD.md — Struk Scanner Feature

> **Current implementation note (14 Oktober 2026):** Current role access is resolved: Admin has no receipt-review control; Bendahara and Super Admin do. WAHA was removed and rejection now uses manual WhatsApp click-to-chat.

## Entry Point (All Documents Start Here)

```
[User Input Full Name (dropdown)] + [User Input Phone/WA Number] + [User Input Receipt Image] → Submit
```

## 1. Goal

Let a registered user submit proof of payment directly inside PusakaFC26, replacing the manual WhatsApp-chat submission process, with a clear verification status visible to the treasurer and a guided rejection contact flow.

## 2. Roles

| Role | Count | Access |
|---|---|---|
| User | ~250 | Submits name, phone number, and receipt via the public-facing form |
| Bendahara (Treasurer) | 1 (Raisya Zumara) | Reviews and approves/rejects receipts |
| Super Admin | existing role | Same review access as Bendahara (shares the same password/access for this feature), plus ability to replace a stored receipt |
| Admin | existing role | No receipt-review control; read-only registration data access |

> Note: Bendahara and Super Admin use the protected reviewer flow. Super Admin additionally has replace access.

## 3. User Story

> As a registrant, I want to submit my payment receipt directly in the app, so that I don't have to message the treasurer manually and can see that my payment is being processed.

> As the treasurer, I want a queue of submitted receipts with the registrant's name, phone number, and receipt image, so that I can verify payments without cross-referencing a WhatsApp chat.

## 4. Functional Requirements

### 4.1 Submission Form ("Submit Bukti Transfer")

New sidebar menu item, alongside "Form Pendaftaran Jersey" and "Nomor Punggung Terpakai".

- **Full Name**: dropdown, synced live with existing registrant data (same source as the jersey registration form). If the user is not in the dropdown, they are directed to complete the jersey registration form first.
- **Phone/WA Number**: text input with a `+62` UI prefix. National and international Indonesian formats are normalized and used as the rejection contact — not matched to any order.
- **Receipt Image**: image upload.
- All three fields are submitted together as one form.

### 4.2 Automated Receipt Processing (on submit)

1. Image is sent to the OCR service.
2. OCR checks whether the image's **structure** matches a standard digital bank transfer receipt (it does not read amount, account, or other field values).
3. If OCR fails to confirm the structure (including manual handwritten receipts issued by the treasurer for cash payments), the image is sent to Gemini AI as a fallback, which is more flexible in reading non-standard formats.
4. If **both** OCR and Gemini fail to produce a successful read → the submission is **auto-rejected by the system**. It is not saved to the database. The user is shown a message asking them to re-upload a clearer photo.
5. In parallel, the image's perceptual hash (pHash) is computed and compared against all previously stored receipt hashes.
   - If a near-duplicate is found (Hamming distance below threshold) → auto-rejected, not saved to the database. The user is directed to contact an Admin/Super Admin directly (outside the app) to resolve it.
6. If the scan succeeds and no duplicate is found → the registrant's row status becomes **Pending Verification** (yellow) and a record is saved to the database.

### 4.3 Verification Status (row color, not a separate column)

| Status | Color | Meaning |
|---|---|---|
| Not Submitted | White | No receipt submitted yet |
| Pending Verification | Yellow | Receipt passed automated scan, awaiting Bendahara review |
| Verified | Green | Bendahara approved |
| Rejected | Red | Bendahara rejected |

This status is reflected only as the row's background color in the existing "Data Pendaftar" table — no new visible column is added.

### 4.4 Bendahara Review Page

New page, accessible to Bendahara and Super Admin only, showing a queue of Pending Verification (yellow) submissions with:
- Full Name
- Phone/WA Number
- Receipt image preview

Actions: **Approve** or **Reject**.

- **Approve** → status becomes Verified (green). No notification is sent on approval (current decision).
- **Reject** → the stored receipt row and image are deleted, then the reviewer can open a generic WhatsApp click-to-chat message. The message must be sent manually.

### 4.5 Resubmission After Rejection

- If status is Rejected (red), the user can submit a new receipt through the same form.
- This **updates the existing record in place** (overwrites the old image and resets status to Pending Verification / yellow). No history of the prior rejection is kept.

### 4.6 Duplicate / Fraud Handling

- Detected automatically via perceptual hash (pHash) comparison against all stored receipts, at submission time (before the record is saved).
- A detected duplicate is auto-rejected and never saved to the database.
- The user is instructed to contact an Admin/Super Admin outside the app.
- Super Admin can open the Bendahara review interface and **replace** a stored receipt (for a specific registrant) with a new image. The replacement is re-scanned and re-hashed through the same pipeline. Final approval/rejection remains the Bendahara's responsibility even after a Super Admin replacement.

### 4.7 Data Model (behavioral requirements, not schema — see SPEC.md)

- **One record per registrant** — not history-based. Resubmission overwrites the existing record.
- A submission that is auto-rejected by the system (failed scan or duplicate) **never creates or updates a database record**.
- A submission rejected by the Bendahara **does** create/keep a database record (it had already passed the automated scan), and that same record is later overwritten on resubmission.

## 5. Non-Functional Requirements

- Receipt images are converted to `.webp` format after the scan step completes, before being stored in Supabase (to reduce size without perceptible quality loss).
- No WAHA or always-on WhatsApp service is required. Rejection uses a manually sent click-to-chat link.
- OCR processing should not block or degrade the main Next.js application (see ARCHITECTURE.md for the isolation rationale).

## 6. Out of Scope

- Automatic payment amount verification.
- Automated approval or rejection notifications; approval is silent and rejection requires manual sending.
- Receipt retention/deletion policy.
- Real-time (as-you-type) phone number validation.
- Linking phone number to a specific order/registration.

## 7. Resolved implementation notes

- The existing **Admin** role is excluded from receipt review; only Bendahara and Super Admin have review control.
- The pHash comparison is performed in the Next.js service before persistence.

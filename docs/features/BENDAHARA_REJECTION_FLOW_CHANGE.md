# Change Note — Treasurer Rejection Notification Flow

**Scope**: This document describes a single, focused change to the Struk Scanner feature's treasurer (Bendahara) review flow. It supersedes any prior spec/architecture content describing WAHA as an automated, server-side WhatsApp notification sender for the rejection case.

## What Changed

The original design used **WAHA** (a self-hosted WhatsApp HTTP API) to automatically send a WhatsApp message to the user when the treasurer rejected their receipt. This required WAHA to run as an always-on service (24/7) on Railway.

**This has been replaced** with a **WhatsApp click-to-chat link**, removing the need for WAHA, any server-side WhatsApp automation, or an always-on third-party service entirely.

## New Flow

```
[ Menunggu verifikasi Bendahara ]
          │
          │  jika ditolak (treasurer clicks "Reject")
          ▼
[ System reads the user's phone/WA number from the submission ]
          │
          ▼
[ Modal is shown to the treasurer, containing a button ]
          │
          │  treasurer clicks the button
          ▼
[ Opens a WhatsApp click-to-chat link, pre-filled with the
  rejection message, addressed to the user's number ]
          │
          ▼
[ Treasurer manually presses Send inside WhatsApp ]
```

Key point: **no message is sent automatically by the backend.** The system only prepares the link; the treasurer still performs the final send action inside their own WhatsApp (Web or mobile app).

## Why This Change

- Removes the need to deploy and keep WAHA running 24/7 on Railway (cost and maintenance overhead for a solo developer)
- No third-party WhatsApp automation service, no session management, no risk of WhatsApp session disconnects
- Still fully solves the original requirement: the user receives a WhatsApp notification when their receipt is rejected

## Implementation Notes

### 1. Trigger point

When the treasurer clicks **Reject** on a pending submission (in the existing `POST /api/receipt/:registrantId/decision` flow, or equivalent), the backend:
- Updates `ReceiptSubmission.status` to `REJECTED` (unchanged from prior spec)
- Does **not** call any WAHA endpoint
- Returns the registrant's `phoneNumber` to the frontend (or the frontend already has it from the review queue list) so the modal can be built

### 2. Modal

After a successful "Reject" action, show a modal to the treasurer with:
- Confirmation that the rejection was recorded
- A single button, e.g. **"Send WhatsApp Notification"**

### 3. Click-to-chat link format

```
https://wa.me/<phoneNumber>?text=<urlEncodedMessage>
```

- `<phoneNumber>` — must be in international format without `+` or leading zeros (e.g. Indonesian `0812xxxxxxx` → `62812xxxxxxx`). Normalize the stored phone number before building the link.
- `<urlEncodedMessage>` — a generic, pre-written rejection message (no per-submission custom reason field is required per existing PRD scope), URL-encoded.

Example:
```
https://wa.me/6281234567890?text=Halo%2C%20bukti%20transfer%20Anda%20untuk%20pendaftaran%20jersey%20belum%20dapat%20diverifikasi.%20Mohon%20upload%20ulang%20struk%20yang%20jelas%20melalui%20halaman%20Submit%20Bukti%20Transfer.
```

### 4. Button behavior

- `<a href="{link}" target="_blank" rel="noopener noreferrer">Send WhatsApp Notification</a>` (or equivalent `window.open` call)
- Opens in a new tab — works with WhatsApp Web (desktop) or the native WhatsApp app (if treasurer reviews from mobile)
- No loading state, no API call needed for this step — it's a plain link, not a network request to any backend or third party

### 5. What to remove from the existing codebase/spec (if already scaffolded)

- Any `POST /api/notify/reject` endpoint or equivalent that called WAHA's `sendText` API
- Any WAHA client/service wrapper used specifically for the rejection notification
- WAHA deployment config and environment variables. WAHA is not used by this project.

## Not Affected by This Change

- Phone numbers are validated locally by format and normalized to digits beginning with `62`; WhatsApp registration is not checked automatically.
- The current flow has no OCR, Gemini fallback, or automatic duplicate detection. File validation, WebP conversion, Supabase storage, and status color-coding remain active.

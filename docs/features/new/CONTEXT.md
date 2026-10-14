# CONTEXT.md — Struk Scanner Feature

> **Current implementation note (14 Oktober 2026):** This planning document has been superseded where it mentions WAHA, Railway, or automatic WhatsApp messages. The live system uses Vercel for Next.js and OCR, Supabase for PostgreSQL/Storage, and a manual WhatsApp click-to-chat link after rejection.

## Entry Point (All Documents Start Here)

```
[User Input Full Name (dropdown)] + [User Input Phone/WA Number] + [User Input Receipt Image] → Submit
```

All three inputs are collected together in a single form and submitted at once — not as separate sequential steps.

## 1. Background

PusakaFC26 is a web application for managing jersey pre-orders for a single batch (~250 students, Teknik Komputer, Universitas Syiah Kuala). The app currently handles **registration data only**: a public form where users submit their full name, jersey back name/number, size, and sleeve type, plus an admin panel to view/export/edit that data (read-only for Admin, full CRUD for Super Admin).

There is currently **no payment verification mechanism** inside the app. Today's manual process is:

1. User registers via the jersey form.
2. User transfers payment to the treasurer's bank account.
3. User sends a screenshot of the transfer receipt to the treasurer directly via WhatsApp chat.
4. The treasurer manually cross-checks the chat screenshot against the registration list.

This manual process does not scale well even at ~250 users: receipts live in a WhatsApp chat (not auditable, not searchable, easy to lose track of), there is no visible payment status anywhere in the app, and matching a chat message to the correct registrant is done entirely from memory/manual lookup.

## 2. Problem Statement

The treasurer (Bendahara) has no structured way to:
- See who has submitted proof of payment.
- Verify a receipt against the correct registrant.
- Track which payments are pending, verified, or rejected.
- Notify a user automatically when a receipt is rejected (currently requires manually messaging them).

## 3. Proposed Solution

Move proof-of-payment submission from WhatsApp chat into the PusakaFC26 app itself, as a new feature: **Struk Scanner** ("Submit Bukti Transfer").

Users submit their name (matched against existing registrants), a phone number, and a photo of their transfer receipt. The receipt is scanned by the separate OCR service, then queued for manual review by the treasurer. The treasurer approves or rejects; rejection opens a prefilled WhatsApp click-to-chat link that the reviewer sends manually.

This keeps the **final decision with a human** (the treasurer) — OCR/AI only pre-screens the receipt and filters out obviously invalid or illegible submissions. It does not read or verify payment amounts automatically.

## 4. Existing System Context

| Aspect | Detail |
|---|---|
| Stack | Next.js, Prisma, PostgreSQL |
| Hosting | Vercel (Next.js and OCR) |
| Scale | ~250 registrants expected; 39 registered at time of writing |
| Usage pattern | Seasonal — active only during the jersey pre-order window, then idle |
| Existing sidebar menu | "Form Pendaftaran Jersey", "Nomor Punggung Terpakai", "Lihat Detail Data" |
| Existing admin roles | Admin (read-only), Super Admin (full CRUD) |
| Developer | Solo student developer |

## 5. Why This Feature Fits

- Reuses the existing registrant data instead of creating a separate identity system.
- Existing admin panel can be extended with a new review view rather than rebuilt.
- Uses a separate OCR deployment so image processing remains isolated from the main Next.js request path.
- Scope is intentionally narrow: this is a pre-screening + manual-approval workflow, not an automated payment-matching system — appropriate for the project's small scale and solo-developer constraints.

## 6. Out of Scope (for this feature, as decided during brainstorming)

- Automatic reading/validation of payment amount against jersey price.
- Linking the submitted phone number to a specific order (it is used only as a notification contact).
- Automated approval notifications and server-side WhatsApp delivery.
- Retention/deletion policy for stored receipt images (none defined; stored indefinitely alongside the registrant record).
- WAHA integration; WAHA has been removed from the project.

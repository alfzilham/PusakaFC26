import { NextResponse } from "next/server";
import { processReceiptSubmission, ReceiptServiceError } from "@/lib/receipt-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const registrantId = String(form.get("registrantId") || "").trim();
    const phoneNumber = String(form.get("phoneNumber") || "").trim();
    const receiptImage = form.get("receiptImage");
    if (!registrantId || !phoneNumber || !(receiptImage instanceof File)) {
      return NextResponse.json({ error: "Nama, nomor WhatsApp, dan gambar struk wajib diisi." }, { status: 400 });
    }
    await processReceiptSubmission({ registrantId, phoneNumber, file: receiptImage });
    return NextResponse.json({ status: "pending_verification" }, { status: 201 });
  } catch (error) {
    if (error instanceof ReceiptServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[receipts submit]", error);
    return NextResponse.json({ error: "Gagal memproses bukti transfer." }, { status: 500 });
  }
}

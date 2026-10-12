import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSuperAdminAuthenticated } from "@/lib/auth";
import { processReceiptSubmission, ReceiptServiceError } from "@/lib/receipt-service";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdminAuthenticated())) {
    return NextResponse.json({ error: "Akses Super Admin diperlukan." }, { status: 403 });
  }
  try {
    const { id } = await params;
    const existing = await db.paymentReceipt.findUnique({ where: { id }, select: { registrantId: true } });
    if (!existing) return NextResponse.json({ error: "Struk tidak ditemukan." }, { status: 404 });
    const form = await req.formData();
    const receiptImage = form.get("receiptImage");
    const phoneNumber = String(form.get("phoneNumber") || "").trim();
    if (!(receiptImage instanceof File) || !phoneNumber) {
      return NextResponse.json({ error: "Nomor WhatsApp dan gambar struk wajib diisi." }, { status: 400 });
    }
    await processReceiptSubmission({ registrantId: existing.registrantId, phoneNumber, file: receiptImage, replace: true });
    return NextResponse.json({ status: "pending_verification" });
  } catch (error) {
    if (error instanceof ReceiptServiceError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    console.error("[receipt replace]", error);
    return NextResponse.json({ error: "Gagal mengganti bukti transfer." }, { status: 500 });
  }
}

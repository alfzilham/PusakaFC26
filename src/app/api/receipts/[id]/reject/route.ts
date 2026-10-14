import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireReceiptReviewer } from "@/lib/receipt-auth";
import { deleteReceiptStorageObject, ReceiptServiceError } from "@/lib/receipt-service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReceiptReviewer();
  if (auth) return auth;
  const { id } = await params;
  const receipt = await db.paymentReceipt.findFirst({ where: { id, status: "PENDING_VERIFICATION" } });
  if (!receipt) return NextResponse.json({ error: "Struk tidak ditemukan atau sudah diproses." }, { status: 404 });

  try {
    await deleteReceiptStorageObject(receipt.imageUrl);
    await db.paymentReceipt.delete({ where: { id: receipt.id } });
  } catch (error) {
    if (error instanceof ReceiptServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[receipt reject]", error);
    return NextResponse.json({ error: "Bukti transfer gagal dihapus." }, { status: 502 });
  }

  return NextResponse.json({ status: "rejected", phoneNumber: receipt.phoneNumber });
}

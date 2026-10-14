import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireReceiptReviewer } from "@/lib/receipt-auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReceiptReviewer();
  if (auth) return auth;
  const { id } = await params;
  const receipt = await db.paymentReceipt.findFirst({ where: { id, status: "PENDING_VERIFICATION" } });
  if (!receipt) return NextResponse.json({ error: "Struk tidak ditemukan atau sudah diproses." }, { status: 404 });
  await db.paymentReceipt.update({
    where: { id },
    data: { status: "REJECTED", reviewedBy: "Super Admin / Bendahara", reviewedAt: new Date() },
  });
  return NextResponse.json({ status: "rejected", phoneNumber: receipt.phoneNumber });
}

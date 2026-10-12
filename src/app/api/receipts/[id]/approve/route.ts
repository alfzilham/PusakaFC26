import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireReceiptReviewer } from "@/lib/receipt-auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReceiptReviewer();
  if (auth) return auth;
  const { id } = await params;
  const result = await db.paymentReceipt.updateMany({
    where: { id, status: "PENDING_VERIFICATION" },
    data: { status: "VERIFIED", reviewedBy: "Super Admin / Bendahara", reviewedAt: new Date() },
  });
  if (!result.count) return NextResponse.json({ error: "Struk tidak ditemukan atau sudah diproses." }, { status: 404 });
  return NextResponse.json({ status: "verified" });
}

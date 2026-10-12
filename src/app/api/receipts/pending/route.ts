import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireReceiptReviewer } from "@/lib/receipt-auth";

export async function GET() {
  const auth = await requireReceiptReviewer();
  if (auth) return auth;
  const rows = await db.paymentReceipt.findMany({
    where: { status: "PENDING_VERIFICATION" },
    orderBy: { createdAt: "asc" },
    include: { registrant: { select: { id: true, fullName: true, backNumber: true } } },
  });
  return NextResponse.json({ data: rows });
}

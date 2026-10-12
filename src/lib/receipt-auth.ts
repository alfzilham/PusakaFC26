import { NextResponse } from "next/server";
import { isSuperAdminAuthenticated } from "@/lib/auth";

export async function requireReceiptReviewer() {
  if (!(await isSuperAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Akses hanya untuk Bendahara atau Super Admin.", code: "RECEIPT_REVIEWER_REQUIRED" },
      { status: 403 }
    );
  }
  return null;
}

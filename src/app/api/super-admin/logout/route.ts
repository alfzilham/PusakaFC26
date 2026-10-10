import { NextResponse } from "next/server";
import { clearPublicSuperAdminSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearPublicSuperAdminSessionCookie();
  return NextResponse.json({ ok: true });
}

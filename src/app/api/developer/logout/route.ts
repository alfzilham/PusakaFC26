import { NextResponse } from "next/server";
import { clearPublicDeveloperSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearPublicDeveloperSessionCookie();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getSuperAdminFailureState } from "@/lib/auth";

export async function GET() {
  const state = await getSuperAdminFailureState();
  const retryAfter = Math.max(0, state.lockedUntil - Date.now());
  return NextResponse.json({
    locked: retryAfter > 0,
    retryAfter,
  });
}

import { NextResponse } from "next/server";
import { getDeveloperFailureState } from "@/lib/auth";

export async function GET() {
  const state = await getDeveloperFailureState();
  const retryAfter = Math.max(0, state.lockedUntil - Date.now());
  return NextResponse.json({
    locked: retryAfter > 0,
    retryAfter,
  });
}

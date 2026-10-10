import { NextResponse } from "next/server";
import {
  createSuperAdminSessionToken,
  clearSuperAdminFailureState,
  getSuperAdminFailureState,
  getSuperAdminPassword,
  secretsMatch,
  setPublicSuperAdminSessionCookie,
  setSuperAdminFailureState,
} from "@/lib/auth";
import { SUPER_ADMIN_LOCK_MAX_AGE } from "@/lib/constants";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const expected = getSuperAdminPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "Password super admin belum dikonfigurasi." },
      { status: 503 }
    );
  }
  const failureState = await getSuperAdminFailureState();
  const now = Date.now();
  if (failureState.lockedUntil > now) {
    return NextResponse.json(
      {
        error: "Super Admin Mode sedang diblokir.",
        code: "SUPER_ADMIN_LOCKED",
        retryAfter: failureState.lockedUntil - now,
      },
      { status: 429 }
    );
  }
  if (!secretsMatch(body.password || "", expected)) {
    const attempts = failureState.attempts + 1;
    const lockedUntil = attempts >= 2 ? now + SUPER_ADMIN_LOCK_MAX_AGE * 1000 : 0;
    await setSuperAdminFailureState({ attempts, lockedUntil });
    return NextResponse.json(
      {
        error: "Password super admin salah.",
        code: lockedUntil ? "SUPER_ADMIN_LOCKED" : "SUPER_ADMIN_INVALID",
        retryAfter: lockedUntil ? lockedUntil - now : 0,
      },
      { status: lockedUntil ? 429 : 401 }
    );
  }

  await clearSuperAdminFailureState();
  await setPublicSuperAdminSessionCookie(createSuperAdminSessionToken());
  return NextResponse.json({ ok: true });
}

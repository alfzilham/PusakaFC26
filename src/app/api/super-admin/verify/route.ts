import { NextResponse } from "next/server";
import {
  createDeveloperSessionToken,
  clearDeveloperFailureState,
  getDeveloperFailureState,
  getDeveloperPassword,
  secretsMatch,
  setPublicDeveloperSessionCookie,
  setDeveloperFailureState,
} from "@/lib/auth";
import { DEVELOPER_LOCK_MAX_AGE } from "@/lib/constants";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const expected = getDeveloperPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "Password developer belum dikonfigurasi." },
      { status: 503 }
    );
  }
  const failureState = await getDeveloperFailureState();
  const now = Date.now();
  if (failureState.lockedUntil > now) {
    return NextResponse.json(
      {
        error: "Developer Mode sedang diblokir.",
        code: "DEVELOPER_LOCKED",
        retryAfter: failureState.lockedUntil - now,
      },
      { status: 429 }
    );
  }
  if (!secretsMatch(body.password || "", expected)) {
    const attempts = failureState.attempts + 1;
    const lockedUntil = attempts >= 2 ? now + DEVELOPER_LOCK_MAX_AGE * 1000 : 0;
    await setDeveloperFailureState({ attempts, lockedUntil });
    return NextResponse.json(
      {
        error: "Password developer salah.",
        code: lockedUntil ? "DEVELOPER_LOCKED" : "DEVELOPER_INVALID",
        retryAfter: lockedUntil ? lockedUntil - now : 0,
      },
      { status: lockedUntil ? 429 : 401 }
    );
  }

  await clearDeveloperFailureState();
  await setPublicDeveloperSessionCookie(createDeveloperSessionToken());
  return NextResponse.json({ ok: true });
}

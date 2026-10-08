import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  recordLoginAttempt,
  getAdminPassword,
  createSessionToken,
  setSessionCookie,
  getClientIP,
} from "@/lib/auth";
import { LOGIN_LOCK_MINUTES, LOGIN_MAX_ATTEMPTS } from "@/lib/constants";

export async function POST(req: Request) {
  const ip = getClientIP(req);

  const rl = await checkRateLimit(ip);
  if (rl.locked) {
    const minutes = Math.ceil(rl.retryAfterMs / 60000);
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${minutes} menit.`,
        locked: true,
        retryAfterMs: rl.retryAfterMs,
      },
      { status: 429 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const password = (body.password || "").trim();
  if (!password) {
    return NextResponse.json(
      { error: "Password wajib diisi." },
      { status: 422 }
    );
  }

  const ok = password === getAdminPassword();
  await recordLoginAttempt(ip, ok);

  if (!ok) {
    const rl2 = await checkRateLimit(ip);
    const remaining = rl2.remainingAttempts;
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `Password salah. Sisa percobaan: ${remaining}/${LOGIN_MAX_ATTEMPTS}.`
            : `Password salah. Akun terkunci ${LOGIN_LOCK_MINUTES} menit.`,
        remainingAttempts: Math.max(remaining, 0),
      },
      { status: 401 }
    );
  }

  const token = createSessionToken();
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}

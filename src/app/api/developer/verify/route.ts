import { NextResponse } from "next/server";
import {
  createDeveloperSessionToken,
  getDeveloperPassword,
  secretsMatch,
  setDeveloperSessionCookie,
} from "@/lib/auth";

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
  if (!secretsMatch(body.password || "", expected)) {
    return NextResponse.json({ error: "Password developer salah." }, { status: 401 });
  }

  await setDeveloperSessionCookie(createDeveloperSessionToken());
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import {
  createDeveloperSessionToken,
  getDeveloperPassword,
  isAdminAuthenticated,
  secretsMatch,
  setDeveloperSessionCookie,
} from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const password = body.password || "";
  if (!getDeveloperPassword()) {
    return NextResponse.json(
      { error: "Password developer belum dikonfigurasi." },
      { status: 503 }
    );
  }

  if (!secretsMatch(password, getDeveloperPassword())) {
    return NextResponse.json({ error: "Password developer salah." }, { status: 401 });
  }

  await setDeveloperSessionCookie(createDeveloperSessionToken());
  return NextResponse.json({ ok: true });
}

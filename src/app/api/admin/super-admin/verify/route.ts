import { NextResponse } from "next/server";
import {
  createSuperAdminSessionToken,
  getSuperAdminPassword,
  isAdminAuthenticated,
  secretsMatch,
  setSuperAdminSessionCookie,
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
  if (!getSuperAdminPassword()) {
    return NextResponse.json(
      { error: "Password super admin belum dikonfigurasi." },
      { status: 503 }
    );
  }

  if (!secretsMatch(password, getSuperAdminPassword())) {
    return NextResponse.json({ error: "Password super admin salah." }, { status: 401 });
  }

  await setSuperAdminSessionCookie(createSuperAdminSessionToken());
  return NextResponse.json({ ok: true });
}

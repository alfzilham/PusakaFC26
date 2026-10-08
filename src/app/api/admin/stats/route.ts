import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi." },
      { status: 401 }
    );
  }
  const [total, pria, wanita] = await Promise.all([
    db.jerseyOrder.count(),
    db.jerseyOrder.count({ where: { gender: "PRIA" } }),
    db.jerseyOrder.count({ where: { gender: "WANITA" } }),
  ]);
  return NextResponse.json({ total, pria, wanita });
}

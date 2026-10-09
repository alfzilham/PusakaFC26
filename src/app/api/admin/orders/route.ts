import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated, isDeveloperAuthenticated } from "@/lib/auth";
import {
  updateOrderSchema,
  isGender,
  isSize,
  isSleeve,
  GENDER_VALUES,
  type OrderRow,
} from "@/lib/validations";

async function ensureAdminAuth() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Tidak terautentikasi." },
      { status: 401 }
    );
  }
  return null;
}

async function ensureDeveloperAuth() {
  if (!(await isDeveloperAuthenticated())) {
    return NextResponse.json(
      { error: "Verifikasi developer diperlukan.", code: "DEVELOPER_REQUIRED" },
      { status: 403 }
    );
  }
  return null;
}

function toRow(r: {
  id: string;
  gender: string;
  fullName: string;
  backName: string;
  backNumber: number;
  size: string;
  sleeve: string;
  createdAt: Date;
  updatedAt: Date;
}): OrderRow {
  return {
    id: r.id,
    gender: isGender(r.gender) ? r.gender : "PRIA",
    fullName: r.fullName,
    backName: r.backName,
    backNumber: r.backNumber,
    size: isSize(r.size) ? r.size : "M",
    sleeve: isSleeve(r.sleeve) ? r.sleeve : "PENDEK",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// GET /api/admin/orders — search + filter + pagination
export async function GET(req: Request) {
  const auth = await ensureAdminAuth();
  if (auth) return auth;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const gender = url.searchParams.get("gender") || ""; // "" | PRIA | WANITA
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = 20;

  const where: {
    OR?: { fullName?: { contains: string }; backName?: { contains: string }; backNumber?: number }[];
    gender?: string;
  } = {};

  if (q) {
    const asNum = parseInt(q, 10);
    const or: {
      fullName?: { contains: string };
      backName?: { contains: string };
      backNumber?: number;
    }[] = [
      { fullName: { contains: q } },
      { backName: { contains: q } },
    ];
    if (!Number.isNaN(asNum)) {
      or.push({ backNumber: asNum });
    }
    where.OR = or;
  }
  if (gender && (GENDER_VALUES as readonly string[]).includes(gender)) {
    where.gender = gender;
  }

  const [total, rows] = await Promise.all([
    db.jerseyOrder.count({ where }),
    db.jerseyOrder.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: rows.map(toRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// PUT /api/admin/orders?id=... — update inline (no extra confirmation)
export async function PUT(req: Request) {
  const auth = await ensureDeveloperAuth();
  if (auth) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validasi gagal." },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const existing = await db.jerseyOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }

  // Build update payload + duplicate checks
  const update: Record<string, unknown> = {};
  if (data.gender) update.gender = data.gender;
  if (data.fullName) update.fullName = data.fullName.trim();
  if (data.sleeve) update.sleeve = data.sleeve;
  if (data.size) update.size = data.size;

  if (data.backName) {
    const normalized = data.backName.trim().replace(/\s+/g, " ");
    const clash = await db.jerseyOrder.findFirst({
      where: { backName: { equals: normalized }, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: `Nama belakang "${normalized}" sudah dipakai.`, field: "backName" },
        { status: 409 }
      );
    }
    update.backName = normalized;
  }
  if (typeof data.backNumber === "number" && !(await isDeveloperAuthenticated())) {
    const clash = await db.jerseyOrder.findFirst({
      where: { backNumber: data.backNumber, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: `Nomor ${data.backNumber} sudah dipakai.`, field: "backNumber" },
        { status: 409 }
      );
    }
    update.backNumber = data.backNumber;
  }

  try {
    const updated = await db.jerseyOrder.update({ where: { id }, data: update });
    return NextResponse.json({ data: toRow(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Unique constraint")) {
      const onName = message.includes("backName");
      return NextResponse.json(
        {
          error: onName ? "Nama belakang sudah dipakai." : "Nomor belakang sudah dipakai.",
          field: onName ? "backName" : "backNumber",
        },
        { status: 409 }
      );
    }
    console.error("[admin orders PUT] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui data." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders?id=...
export async function DELETE(req: Request) {
  const auth = await ensureDeveloperAuth();
  if (auth) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  }

  try {
    await db.jerseyOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("does not exist") || message.includes("P2025")) {
      return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    }
    console.error("[admin orders DELETE] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus data." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminAuthenticated, isSuperAdminAuthenticated } from "@/lib/auth";
import { deleteReceiptStorageObject } from "@/lib/receipt-service";
import {
  updateOrderSchema,
  isGender,
  isSize,
  isSleeve,
  GENDER_VALUES,
  normalizeBackName,
  normalizeFullName,
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

async function ensureSuperAdminAuth() {
  if (!(await isSuperAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Verifikasi super admin diperlukan.", code: "SUPER_ADMIN_REQUIRED" },
      { status: 403 }
    );
  }
  return null;
}

function toRow(r: {
  id: string;
  sequenceNumber?: number;
  gender: string;
  fullName: string;
  backName: string;
  backNumber: string;
  size: string;
  sleeve: string;
  createdAt: Date;
  updatedAt: Date;
  paymentReceipt?: { status: string } | null;
}): OrderRow {
  return {
    id: r.id,
    sequenceNumber: r.sequenceNumber,
    gender: isGender(r.gender) ? r.gender : "PRIA",
    fullName: r.fullName,
    paymentStatus: r.paymentReceipt?.status as OrderRow["paymentStatus"],
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
    OR?: { fullName?: { contains: string }; backName?: { contains: string }; backNumber?: { contains: string } }[];
    gender?: string;
  } = {};

  if (q) {
    const or: {
      fullName?: { contains: string };
      backName?: { contains: string };
      backNumber?: { contains: string };
    }[] = [
      { fullName: { contains: q } },
      { backName: { contains: q } },
    ];
    or.push({ backNumber: { contains: q } });
    where.OR = or;
  }
  if (gender && (GENDER_VALUES as readonly string[]).includes(gender)) {
    where.gender = gender;
  }

  const [total, rows, sequenceRows] = await Promise.all([
    db.jerseyOrder.count({ where }),
    db.jerseyOrder.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { paymentReceipt: { select: { status: true } } },
    }),
    db.jerseyOrder.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    }),
  ]);

  const sequenceById = new Map(
    sequenceRows.map((row, index) => [row.id, index + 1])
  );

  return NextResponse.json({
    data: rows.map((row) =>
      toRow({ ...row, sequenceNumber: sequenceById.get(row.id) })
    ),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// PUT /api/admin/orders?id=... — update inline (no extra confirmation)
export async function PUT(req: Request) {
  const auth = await ensureSuperAdminAuth();
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
  if (data.fullName) update.fullName = normalizeFullName(data.fullName);
  if (data.sleeve) update.sleeve = data.sleeve;
  if (data.size) update.size = data.size;

  if (data.backName) {
    const normalized = normalizeBackName(data.backName);
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
  if (typeof data.backNumber === "string") {
    const superAdminAuthenticated = await isSuperAdminAuthenticated();
    if (!superAdminAuthenticated) {
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
  const auth = await ensureSuperAdminAuth();
  if (auth) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  }

  try {
    const order = await db.jerseyOrder.findUnique({
      where: { id },
      select: {
        paymentReceipt: { select: { imageUrl: true } },
        treasurerReceipts: { select: { imageUrl: true } },
      },
    });
    if (!order) return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });

    await db.jerseyOrder.delete({ where: { id } });

    const imageUrls = [
      order.paymentReceipt?.imageUrl,
      ...order.treasurerReceipts.map((receipt) => receipt.imageUrl),
    ].filter((url): url is string => Boolean(url));
    const cleanup = await Promise.allSettled(
      [...new Set(imageUrls)].map((imageUrl) => deleteReceiptStorageObject(imageUrl))
    );
    const cleanupFailed = cleanup.some((result) => result.status === "rejected");
    if (cleanupFailed) {
      console.error("[admin orders DELETE] some receipt files could not be removed", cleanup);
    }
    return NextResponse.json({ ok: true, storageCleanup: cleanupFailed ? "partial" : "complete" });
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

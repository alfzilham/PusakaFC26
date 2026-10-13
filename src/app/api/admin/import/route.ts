import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isSuperAdminAuthenticated } from "@/lib/auth";
import {
  GENDER_VALUES,
  SIZE_VALUES,
  SLEEVE_VALUES,
  normalizeBackName,
  normalizeFullName,
} from "@/lib/validations";

const backupRowSchema = z.object({
  id: z.string().min(1).max(100),
  gender: z.enum(GENDER_VALUES),
  fullName: z.string().min(1).max(80),
  backName: z.string().min(1).max(20),
  backNumber: z.number().int().min(1).max(999),
  size: z.enum(SIZE_VALUES),
  sleeve: z.enum(SLEEVE_VALUES),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const backupSchema = z.object({
  data: z.array(z.unknown()).min(1),
});

/**
 * Import a JerseyOrder JSON backup without deleting or overwriting existing data.
 * This is intentionally restricted to Super Admin because it writes historical data.
 */
export async function POST(req: Request) {
  if (!(await isSuperAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Verifikasi super admin diperlukan." },
      { status: 403 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File JSON wajib dipilih." }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 2 MB." }, { status: 413 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(await file.text());
  } catch {
    return NextResponse.json({ error: "Isi file bukan JSON yang valid." }, { status: 422 });
  }

  const parsedBackup = backupSchema.safeParse(parsedJson);
  if (!parsedBackup.success) {
    return NextResponse.json(
      { error: "Format backup tidak valid. Field data wajib berupa array." },
      { status: 422 }
    );
  }

  const existing = await db.jerseyOrder.findMany({
    select: { id: true, backName: true },
  });
  const existingIds = new Set(existing.map((row) => row.id));
  const existingBackNames = new Set(existing.map((row) => row.backName));
  const seenIds = new Set<string>();
  const seenBackNames = new Set<string>();
  const rows: {
    id: string;
    gender: (typeof GENDER_VALUES)[number];
    fullName: string;
    backName: string;
    backNumber: number;
    size: (typeof SIZE_VALUES)[number];
    sleeve: (typeof SLEEVE_VALUES)[number];
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  let invalid = 0;
  let skipped = 0;

  for (const rawRow of parsedBackup.data.data) {
    const parsedRow = backupRowSchema.safeParse(rawRow);
    if (!parsedRow.success) {
      invalid += 1;
      continue;
    }

    const row = parsedRow.data;
    const backName = normalizeBackName(row.backName);
    if (
      existingIds.has(row.id) ||
      existingBackNames.has(backName) ||
      seenIds.has(row.id) ||
      seenBackNames.has(backName)
    ) {
      skipped += 1;
      continue;
    }

    seenIds.add(row.id);
    seenBackNames.add(backName);
    rows.push({
      id: row.id,
      gender: row.gender,
      fullName: normalizeFullName(row.fullName),
      backName,
      backNumber: row.backNumber,
      size: row.size,
      sleeve: row.sleeve,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  if (rows.length > 0) {
    await db.jerseyOrder.createMany({ data: rows, skipDuplicates: true });
  }

  return NextResponse.json({
    imported: rows.length,
    skipped,
    invalid,
    total: parsedBackup.data.data.length,
    message: `${rows.length} data berhasil diimpor. Data yang sudah ada tidak diubah.`,
  });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { databaseUnavailableResponse } from "@/lib/database-error";
import { createOrderSchema, isGender, normalizeFullName } from "@/lib/validations";

// GET /api/orders — public: returns used entries (for Page 2 + client cache)
export async function GET() {
  try {
    const rows = await db.jerseyOrder.findMany({
      orderBy: [{ backNumber: "asc" }],
      select: { id: true, gender: true, backName: true, backNumber: true },
    });

    const data = rows.map((r) => ({
      ...r,
      gender: isGender(r.gender) ? r.gender : "PRIA",
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return databaseUnavailableResponse("orders GET", error);
  }
}

// POST /api/orders — public: create a new jersey order
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid." },
      { status: 400 }
    );
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Validasi gagal.", field: first?.path[0] },
      { status: 422 }
    );
  }
  const { gender, fullName, backName, backNumber, size, sleeve } = parsed.data;
  const normalizedFullName = normalizeFullName(fullName);

  // Normalize backName for uniqueness (trim + collapse spaces)
  const normalizedBackName = backName.trim().replace(/\s+/g, " ");

  // Explicit duplicate checks (race-condition aware) before relying on
  // the Prisma unique constraints below.
  let byName;
  let byNumber;
  try {
    [byName, byNumber] = await Promise.all([
      db.jerseyOrder.findFirst({
        where: { backName: { equals: normalizedBackName } },
        select: { id: true },
      }),
      db.jerseyOrder.findFirst({
        where: { backNumber },
        select: { id: true },
      }),
    ]);
  } catch (error) {
    return databaseUnavailableResponse("orders duplicate check", error);
  }

  if (byName) {
    return NextResponse.json(
      {
        error: `Nama belakang "${normalizedBackName}" sudah dipakai. Silakan pilih nama lain.`,
        field: "backName",
      },
      { status: 409 }
    );
  }
  if (byNumber) {
    return NextResponse.json(
      {
        error: `Nomor ${backNumber} sudah dipakai. Silakan pilih nomor lain.`,
        field: "backNumber",
      },
      { status: 409 }
    );
  }

  try {
    const created = await db.jerseyOrder.create({
      data: {
        gender,
        fullName: normalizedFullName,
        backName: normalizedBackName,
        backNumber,
        size,
        sleeve,
      },
    });
    return NextResponse.json({ data: { id: created.id } }, { status: 201 });
  } catch (err) {
    // Prisma unique-constraint violation (race condition safety net)
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Unique constraint")) {
      const onName = message.includes("backName");
      return NextResponse.json(
        {
          error: onName
            ? "Nama belakang sudah dipakai. Silakan coba nama lain."
            : "Nomor belakang sudah dipakai. Silakan coba nomor lain.",
          field: onName ? "backName" : "backNumber",
        },
        { status: 409 }
      );
    }
    console.error("[orders POST] create error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan data." },
      { status: 500 }
    );
  }
}

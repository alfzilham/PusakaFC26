import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { isDeveloperAuthenticated } from "@/lib/auth";
import {
  GENDER_LABEL,
  SLEEVE_LABEL,
  SIZE_LABEL,
  isGender,
  isSize,
  isSleeve,
  type Gender,
  type OrderRow,
} from "@/lib/validations";

export const dynamic = "force-dynamic";

async function ensureAuth() {
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

function rowToSheetObject(r: OrderRow) {
  return {
    "Nama Lengkap": r.fullName,
    "Nama Belakang": r.backName,
    "Nomor Punggung": r.backNumber,
    "Gender": GENDER_LABEL[r.gender as Gender],
    "Ukuran": SIZE_LABEL[r.size],
    "Lengan": SLEEVE_LABEL[r.sleeve],
    "Dibuat": new Date(r.createdAt).toLocaleString("id-ID"),
  };
}

export async function GET(req: Request) {
  const auth = await ensureAuth();
  if (auth) return auth;

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "xlsx").toLowerCase();

  const rows = await db.jerseyOrder.findMany({
    orderBy: [{ backNumber: "asc" }],
  });
  const data = rows.map(toRow);

  if (format === "json") {
    const json = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        event: "PusakaFC26",
        total: data.length,
        data,
      },
      null,
      2
    );
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pusakafc26-${Date.now()}.json"`,
      },
    });
  }

  // xlsx — 2 sheets: "Pria" and "Wanita"
  const pria = data
    .filter((r) => r.gender === "PRIA")
    .map(rowToSheetObject);
  const wanita = data
    .filter((r) => r.gender === "WANITA")
    .map(rowToSheetObject);

  const wb = XLSX.utils.book_new();
  const wsPria = XLSX.utils.json_to_sheet(
    pria.length ? pria : [{ "Nama Lengkap": "—", "Nama Belakang": "—", "Nomor Punggung": "—", Gender: "—", Ukuran: "—", Lengan: "—", Dibuat: "—" }]
  );
  const wsWanita = XLSX.utils.json_to_sheet(
    wanita.length ? wanita : [{ "Nama Lengkap": "—", "Nama Belakang": "—", "Nomor Punggung": "—", Gender: "—", Ukuran: "—", Lengan: "—", Dibuat: "—" }]
  );

  // Column widths
  const widths = [{ wch: 26 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 22 }];
  wsPria["!cols"] = widths;
  wsWanita["!cols"] = widths;

  XLSX.utils.book_append_sheet(wb, wsPria, "Pria");
  XLSX.utils.book_append_sheet(wb, wsWanita, "Wanita");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pusakafc26-${Date.now()}.xlsx"`,
    },
  });
}

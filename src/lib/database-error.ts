import { NextResponse } from "next/server";

export function databaseUnavailableResponse(scope: string, error: unknown) {
  console.error(`[${scope}] database unavailable:`, error);
  return NextResponse.json(
    {
      error:
        "Database belum terhubung. Periksa DATABASE_URL pada konfigurasi deployment.",
      code: "DATABASE_UNAVAILABLE",
    },
    { status: 503 }
  );
}

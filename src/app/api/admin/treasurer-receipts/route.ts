import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { normalizePhone } from "@/lib/validations";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} belum dikonfigurasi.`);
  return value;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Login admin diperlukan." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const fullName = String(form.get("fullName") || "").trim();
    const phoneNumber = normalizePhone(String(form.get("phoneNumber") || ""));
    const amount = Number(String(form.get("amount") || ""));
    const noteValue = String(form.get("note") || "").trim();
    const image = form.get("image");

    if (!fullName || phoneNumber.length < 10 || phoneNumber.length > 15 || !Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Lengkapi nama, nomor WhatsApp, dan nominal dengan benar." }, { status: 422 });
    }
    if (!(image instanceof File) || !ALLOWED_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Gambar struk maksimal 10 MB dengan format JPG, PNG, atau WEBP." }, { status: 422 });
    }

    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    const bucket = requiredEnv("SUPABASE_STORAGE_BUCKET");
    const webp = await sharp(new Uint8Array(await image.arrayBuffer())).webp({ quality: 88 }).toBuffer();
    const path = `treasurer-receipts/${Date.now()}-${crypto.randomUUID()}.webp`;
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "image/webp", "x-upsert": "true" },
      body: new Uint8Array(webp),
    });
    if (!upload.ok) throw new Error("Gagal menyimpan gambar struk.");

    const row = await db.treasurerReceipt.create({
      data: {
        fullName,
        phoneNumber,
        amount,
        note: noteValue || null,
        imageUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`,
        createdBy: "Bendahara",
      },
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    console.error("[treasurer receipt]", error);
    return NextResponse.json({ error: "Gagal menyimpan struk. Pastikan migration database sudah dijalankan." }, { status: 500 });
  }
}

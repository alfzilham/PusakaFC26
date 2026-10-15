import { NextResponse } from "next/server";
import crypto from "crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

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
    const registrantId = String(form.get("registrantId") || "").trim();
    const fullName = String(form.get("fullName") || "").trim();
    const amount = Number(String(form.get("amount") || ""));
    const noteValue = String(form.get("note") || "").trim();
    const image = form.get("image");

    if (!registrantId || !fullName || !Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Lengkapi nama dan nominal dengan benar." }, { status: 422 });
    }
    if (!(image instanceof File) || !ALLOWED_TYPES.has(image.type) || image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Gambar struk maksimal 10 MB dengan format JPG, PNG, atau WEBP." }, { status: 422 });
    }

    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    const bucket = requiredEnv("SUPABASE_STORAGE_BUCKET");
    const webp = await sharp(new Uint8Array(await image.arrayBuffer())).webp({ quality: 88 }).toBuffer();
    const receiptHash = crypto.createHash("sha256").update(webp).digest("hex");
    const path = `treasurer-receipts/${Date.now()}-${crypto.randomUUID()}.webp`;
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "image/webp", "x-upsert": "true" },
      body: new Uint8Array(webp),
    });
    if (!upload.ok) throw new Error("Gagal menyimpan gambar struk.");

    const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    // Manual cash receipts do not require a WhatsApp number. The legacy
    // schema keeps this field required, so use an explicit non-contact marker.
    const phoneNumber = "MANUAL_CASH";
    const row = await db.$transaction(async (tx) => {
      const registrant = await tx.jerseyOrder.findUnique({ where: { id: registrantId }, select: { id: true } });
      if (!registrant) throw new Error("Pendaftar tidak ditemukan.");
      const existingReceipt = await tx.paymentReceipt.findUnique({ where: { registrantId }, select: { status: true } });
      if (existingReceipt && existingReceipt.status !== "REJECTED") {
        const error = new Error("Pendaftar ini sudah memiliki bukti transfer aktif.");
        error.name = "ACTIVE_RECEIPT_EXISTS";
        throw error;
      }

      const created = await tx.treasurerReceipt.create({
        data: { registrantId, fullName, phoneNumber, amount, note: noteValue || null, imageUrl, createdBy: "Bendahara" },
      });

      // Cash/manual receipts are already verified by the Treasurer. Keep the
      // canonical payment status in PaymentReceipt so public rows turn green.
      await tx.paymentReceipt.upsert({
        where: { registrantId },
        create: { registrantId, phoneNumber, phoneVerified: true, imageUrl, receiptHash, status: "VERIFIED", reviewedBy: "Bendahara", reviewedAt: new Date() },
        update: { phoneNumber, phoneVerified: true, imageUrl, receiptHash, status: "VERIFIED", reviewedBy: "Bendahara", reviewedAt: new Date() },
      });
      return created;
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    console.error("[treasurer receipt]", error);
    if (error instanceof Error && error.name === "ACTIVE_RECEIPT_EXISTS") {
      return NextResponse.json({ error: error.message, code: "RECEIPT_EXISTS" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan struk. Pastikan migration database sudah dijalankan." }, { status: 500 });
  }
}

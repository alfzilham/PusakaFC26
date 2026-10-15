import crypto from "crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/validations";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ReceiptServiceError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}
function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ReceiptServiceError("CONFIGURATION_ERROR", `${name} belum dikonfigurasi.`, 500);
  return value;
}
function validatePhoneNumber(phoneNumber: string) {
  const phone = normalizePhone(phoneNumber);
  if (phone.length < 10 || phone.length > 15) {
    throw new ReceiptServiceError("INVALID_PHONE", "Nomor WhatsApp tidak valid.", 400);
  }
  return phone;
}

function createReceiptFingerprint(bytes: Uint8Array) {
  // Metadata only. It is not compared and never blocks duplicate submissions.
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function uploadWebp(bytes: Uint8Array, registrantId: string) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = requiredEnv("SUPABASE_STORAGE_BUCKET");
  const webp = await sharp(bytes).webp({ quality: 88 }).toBuffer();
  const path = `receipts/${registrantId}-${crypto.randomUUID()}.webp`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "image/webp",
      "x-upsert": "true",
    },
    body: new Uint8Array(webp),
  });
  if (!response.ok) throw new ReceiptServiceError("STORAGE_ERROR", "Gagal menyimpan gambar struk.", 502);
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export async function deleteReceiptStorageObject(imageUrl: string) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = requiredEnv("SUPABASE_STORAGE_BUCKET");
  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;

  if (!imageUrl.startsWith(publicPrefix)) {
    throw new ReceiptServiceError("STORAGE_ERROR", "Lokasi gambar struk tidak valid.", 502);
  }

  const path = imageUrl.slice(publicPrefix.length);
  if (!path) {
    throw new ReceiptServiceError("STORAGE_ERROR", "Lokasi gambar struk tidak valid.", 502);
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      cache: "no-store",
    });
  } catch {
    throw new ReceiptServiceError("STORAGE_ERROR", "Gambar struk gagal dihapus.", 502);
  }

  if (!response.ok) {
    console.error("[receipt storage delete]", {
      status: response.status,
      statusText: response.statusText,
      bucket,
    });
    throw new ReceiptServiceError("STORAGE_ERROR", "Gambar struk gagal dihapus.", 502);
  }
}

export async function processReceiptSubmission({
  registrantId,
  phoneNumber,
  file,
  replace: _replace = false,
}: {
  registrantId: string;
  phoneNumber: string;
  file: File;
  replace?: boolean;
}) {
  if (!file || !ALLOWED_TYPES.has(file.type) || file.size > MAX_RECEIPT_BYTES) {
    throw new ReceiptServiceError("INVALID_IMAGE", "Unggah gambar JPG, PNG, atau WEBP maksimal 10 MB.", 422);
  }
  const registrant = await db.jerseyOrder.findUnique({
    where: { id: registrantId },
    select: { id: true, paymentReceipt: { select: { imageUrl: true } } },
  });
  if (!registrant) throw new ReceiptServiceError("REGISTRANT_NOT_FOUND", "Data pendaftar tidak ditemukan.", 404);

  const normalizedPhone = validatePhoneNumber(phoneNumber);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageUrl = await uploadWebp(bytes, registrantId);
  const receiptHash = createReceiptFingerprint(bytes);

  try {
    await db.paymentReceipt.upsert({
      where: { registrantId },
      create: {
        registrantId,
        phoneNumber: normalizedPhone,
        phoneVerified: true,
        imageUrl,
        receiptHash,
        status: "PENDING_VERIFICATION",
      },
      update: {
        phoneNumber: normalizedPhone,
        phoneVerified: true,
        imageUrl,
        receiptHash,
        status: "PENDING_VERIFICATION",
        reviewedBy: null,
        reviewedAt: null,
      },
    });
  } catch (error) {
    try {
      await deleteReceiptStorageObject(imageUrl);
    } catch (cleanupError) {
      console.error("[receipt submit] failed to clean up new image", cleanupError);
    }
    throw error;
  }

  if (registrant.paymentReceipt?.imageUrl && registrant.paymentReceipt.imageUrl !== imageUrl) {
    try {
      await deleteReceiptStorageObject(registrant.paymentReceipt.imageUrl);
    } catch (cleanupError) {
      console.error("[receipt replace] failed to clean up previous image", cleanupError);
    }
  }
}

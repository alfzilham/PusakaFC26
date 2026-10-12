import crypto from "crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { RECEIPT_PHASH_THRESHOLD } from "@/lib/constants";

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

function normalizePhone(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

async function validateWhatsapp(phoneNumber: string) {
  const baseUrl = requiredEnv("WAHA_BASE_URL").replace(/\/$/, "");
  const phone = normalizePhone(phoneNumber);
  if (phone.length < 10 || phone.length > 15) {
    throw new ReceiptServiceError("INVALID_PHONE", "Nomor WhatsApp tidak valid.", 400);
  }
  const headers: HeadersInit = {};
  if (process.env.WAHA_API_KEY) headers.Authorization = `Bearer ${process.env.WAHA_API_KEY}`;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/contacts/check-exists?phone=${encodeURIComponent(phone)}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ReceiptServiceError("WAHA_UNAVAILABLE", "Validasi WhatsApp sedang tidak tersedia.", 502);
  }
  if (!response.ok) throw new ReceiptServiceError("WAHA_UNAVAILABLE", "Validasi WhatsApp gagal.", 502);
  const body = (await response.json().catch(() => ({}))) as { exists?: boolean; numberExists?: boolean; status?: boolean };
  if (!(body.exists === true || body.numberExists === true || body.status === true)) {
    throw new ReceiptServiceError("PHONE_NOT_REGISTERED", "Nomor tersebut belum terdaftar di WhatsApp.", 400);
  }
  return phone;
}

async function scanReceipt(file: File) {
  const ocrUrl = requiredEnv("OCR_SERVICE_URL").replace(/\/$/, "");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: file.type }), file.name || "receipt-image");
  let response: Response;
  try {
    response = await fetch(`${ocrUrl}/scan`, { method: "POST", body: form, cache: "no-store" });
  } catch {
    throw new ReceiptServiceError("OCR_UNAVAILABLE", "Layanan pemindai struk sedang tidak tersedia.", 502);
  }
  if (!response.ok) throw new ReceiptServiceError("OCR_UNAVAILABLE", "Layanan pemindai struk gagal merespons.", 502);
  const body = (await response.json().catch(() => ({}))) as { status?: string; receiptHash?: string };
  if (!body.receiptHash) throw new ReceiptServiceError("OCR_INVALID_RESPONSE", "Hasil pemindaian struk tidak valid.", 502);
  if (body.status !== "success") {
    throw new ReceiptServiceError("SCAN_FAILED", "Struk tidak terbaca. Silakan unggah foto yang lebih jelas.", 422);
  }
  return { bytes, receiptHash: body.receiptHash };
}

function hammingDistance(left: string, right: string) {
  const a = left.toLowerCase().replace(/^0x/, "").padStart(Math.max(left.length, right.length), "0");
  const b = right.toLowerCase().replace(/^0x/, "").padStart(Math.max(left.length, right.length), "0");
  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    const value = Number.parseInt(a[i], 16) ^ Number.parseInt(b[i], 16);
    distance += value.toString(2).split("1").length - 1;
  }
  return distance;
}

async function ensureNotDuplicate(receiptHash: string, excludeId?: string) {
  const hashes = await db.paymentReceipt.findMany({
    where: excludeId ? { NOT: { registrantId: excludeId } } : undefined,
    select: { receiptHash: true },
  });
  if (hashes.some((row) => hammingDistance(receiptHash, row.receiptHash) <= RECEIPT_PHASH_THRESHOLD)) {
    throw new ReceiptServiceError("DUPLICATE_RECEIPT", "Struk terdeteksi sebagai duplikat. Hubungi Admin atau Super Admin.", 409);
  }
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

export async function processReceiptSubmission({
  registrantId,
  phoneNumber,
  file,
  replace = false,
}: {
  registrantId: string;
  phoneNumber: string;
  file: File;
  replace?: boolean;
}) {
  if (!file || !ALLOWED_TYPES.has(file.type) || file.size > MAX_RECEIPT_BYTES) {
    throw new ReceiptServiceError("INVALID_IMAGE", "Unggah gambar JPG, PNG, atau WEBP maksimal 10 MB.", 422);
  }
  const registrant = await db.jerseyOrder.findUnique({ where: { id: registrantId }, select: { id: true } });
  if (!registrant) throw new ReceiptServiceError("REGISTRANT_NOT_FOUND", "Data pendaftar tidak ditemukan.", 404);

  const normalizedPhone = await validateWhatsapp(phoneNumber);
  const scan = await scanReceipt(file);
  await ensureNotDuplicate(scan.receiptHash, replace ? registrantId : undefined);
  const imageUrl = await uploadWebp(scan.bytes, registrantId);

  await db.paymentReceipt.upsert({
    where: { registrantId },
    create: {
      registrantId,
      phoneNumber: normalizedPhone,
      phoneVerified: true,
      imageUrl,
      receiptHash: scan.receiptHash,
      status: "PENDING_VERIFICATION",
    },
    update: {
      phoneNumber: normalizedPhone,
      phoneVerified: true,
      imageUrl,
      receiptHash: scan.receiptHash,
      status: "PENDING_VERIFICATION",
      reviewedBy: null,
      reviewedAt: null,
    },
  });
}

export async function sendReceiptRejection(phoneNumber: string) {
  const baseUrl = requiredEnv("WAHA_BASE_URL").replace(/\/$/, "");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (process.env.WAHA_API_KEY) headers.Authorization = `Bearer ${process.env.WAHA_API_KEY}`;
  const response = await fetch(`${baseUrl}/api/sendText`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      chatId: `${normalizePhone(phoneNumber)}@c.us`,
      text: "Bukti transfer Anda ditolak. Silakan unggah ulang foto struk yang lebih jelas atau hubungi Bendahara.",
    }),
  });
  if (!response.ok) throw new Error(`WAHA rejection notification failed: ${response.status}`);
}

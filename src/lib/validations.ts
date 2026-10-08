import { z } from "zod";

// ---- Enum-like types (stored as String in DB, validated in app) ----
export const GENDER_VALUES = ["PRIA", "WANITA"] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const SLEEVE_VALUES = ["PANJANG", "PENDEK"] as const;
export type SleeveType = (typeof SLEEVE_VALUES)[number];

export const SIZE_VALUES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type Size = (typeof SIZE_VALUES)[number];

export function isGender(v: string): v is Gender {
  return (GENDER_VALUES as readonly string[]).includes(v);
}
export function isSleeve(v: string): v is SleeveType {
  return (SLEEVE_VALUES as readonly string[]).includes(v);
}
export function isSize(v: string): v is Size {
  return (SIZE_VALUES as readonly string[]).includes(v);
}

// ---- Public-facing labels ----
export const GENDER_LABEL: Record<Gender, string> = {
  PRIA: "Pria",
  WANITA: "Wanita",
};

export const SLEEVE_LABEL: Record<SleeveType, string> = {
  PANJANG: "Panjang",
  PENDEK: "Pendek",
};

export const SIZE_LABEL: Record<Size, string> = {
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
  XXXL: "XXXL",
};

// ---- Zod schemas ----
export const createOrderSchema = z.object({
  gender: z.enum(GENDER_VALUES, { message: "Gender wajib dipilih" }),
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(80, "Nama lengkap maksimal 80 karakter"),
  backName: z
    .string()
    .trim()
    .min(2, "Nama belakang minimal 2 karakter")
    .max(20, "Nama belakang maksimal 20 karakter")
    .regex(
      /^[A-Za-z0-9 ]+$/,
      "Nama belakang hanya boleh huruf, angka, dan spasi"
    ),
  backNumber: z
    .number({ message: "Nomor belakang wajib diisi" })
    .int("Nomor belakang harus berupa bilangan bulat")
    .min(1, "Nomor belakang minimal 1")
    .max(999, "Nomor belakang maksimal 999"),
  size: z.enum(SIZE_VALUES, { message: "Ukuran wajib dipilih" }),
  sleeve: z.enum(SLEEVE_VALUES, { message: "Panjang lengan wajib dipilih" }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  gender: z.enum(GENDER_VALUES).optional(),
  fullName: z.string().trim().min(3).max(80).optional(),
  backName: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[A-Za-z0-9 ]+$/)
    .optional(),
  backNumber: z.number().int().min(1).max(999).optional(),
  size: z.enum(SIZE_VALUES).optional(),
  sleeve: z.enum(SLEEVE_VALUES).optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export type OrderRow = {
  id: string;
  gender: Gender;
  fullName: string;
  backName: string;
  backNumber: number;
  size: Size;
  sleeve: SleeveType;
  createdAt: string;
  updatedAt: string;
};

export type UsedEntry = {
  id: string;
  gender: Gender;
  backName: string;
  backNumber: number;
};

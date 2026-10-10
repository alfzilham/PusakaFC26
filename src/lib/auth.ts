import { cookies } from "next/headers";
import crypto from "crypto";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  DEVELOPER_PASSWORD_ENV,
  DEVELOPER_SESSION_COOKIE,
  DEVELOPER_SESSION_MAX_AGE,
  DEFAULT_ADMIN_PASSWORD,
  ADMIN_PASSWORD_ENV,
} from "@/lib/constants";
import { db } from "@/lib/db";

// Session token = base64(payload).signature(HMAC-SHA256)
// payload: { exp: number }

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "jc26-dev-secret-change-in-production"
  );
}

function sign(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("hex");
}

export function createSessionToken(): string {
  return createToken(ADMIN_SESSION_MAX_AGE);
}

function createToken(maxAge: number): string {
  const exp = Date.now() + maxAge * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = sign(payload);
  // Timing-safe comparison
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof decoded.exp !== "number") return false;
    return decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export function createDeveloperSessionToken(): string {
  return createToken(DEVELOPER_SESSION_MAX_AGE);
}

export async function setDeveloperSessionCookie(token: string) {
  const store = await cookies();
  store.set(DEVELOPER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEVELOPER_SESSION_MAX_AGE,
  });
}

export async function clearDeveloperSessionCookie() {
  const store = await cookies();
  store.delete(DEVELOPER_SESSION_COOKIE);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE)?.value;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getSessionToken();
  return verifySessionToken(token);
}

export async function isDeveloperAuthenticated(): Promise<boolean> {
  if (!(await isAdminAuthenticated())) return false;
  return isDeveloperCookieValid();
}

/** Developer verification used by the public registration Developer Mode. */
export async function isPublicDeveloperAuthenticated(): Promise<boolean> {
  return isDeveloperCookieValid();
}

async function isDeveloperCookieValid(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(DEVELOPER_SESSION_COOKIE)?.value);
}

function normalizeEnvironmentSecret(value: string): string {
  const normalized = value.trim();
  if (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    return normalized.slice(1, -1);
  }
  return normalized;
}

export function getAdminPassword(): string {
  const configured = process.env[ADMIN_PASSWORD_ENV];
  return configured ? normalizeEnvironmentSecret(configured) : DEFAULT_ADMIN_PASSWORD;
}

export function getDeveloperPassword(): string {
  return normalizeEnvironmentSecret(process.env[DEVELOPER_PASSWORD_ENV] || "");
}

export function secretsMatch(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  if (!expectedBuffer.length || inputBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

// ---- Rate limiting (per IP) ----
export type RateLimitResult = {
  locked: boolean;
  remainingAttempts: number;
  retryAfterMs: number;
};

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const recent = await db.adminLoginAttempt.findMany({
    where: {
      ip,
      createdAt: { gte: since },
      success: false,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (recent.length >= 5) {
    const oldest = recent[recent.length - 1];
    const retryAfterMs =
      oldest.createdAt.getTime() + 15 * 60 * 1000 - Date.now();
    return {
      locked: retryAfterMs > 0,
      remainingAttempts: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  return {
    locked: false,
    remainingAttempts: 5 - recent.length,
    retryAfterMs: 0,
  };
}

export async function recordLoginAttempt(ip: string, success: boolean) {
  await db.adminLoginAttempt.create({
    data: { ip, success },
  });
}

// ---- IP extraction ----
export function getClientIP(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") || "unknown";
}

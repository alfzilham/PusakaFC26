import { PrismaClient } from "@prisma/client";

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1017"]);

function isRetryableDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code && RETRYABLE_CODES.has(candidate.code)) return true;
  return Boolean(candidate.message?.includes("Can't reach database server"));
}

function databaseUrlForRuntime() {
  const raw = process.env.DATABASE_URL;
  if (!raw || !raw.startsWith("postgres")) return undefined;

  const url = new URL(raw);
  // Vercel functions are short-lived; keep each Prisma instance small when
  // connecting through Supabase's pooler and allow a little connection wait.
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "10");
  return url.toString();
}

function createPrisma() {
  const runtimeUrl = databaseUrlForRuntime();
  const client = new PrismaClient({
    ...(runtimeUrl ? { datasources: { db: { url: runtimeUrl } } } : {}),
    log: ["error"],
  });

  return client.$extends({
    query: {
      $allOperations: async ({ args, query }) => {
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (!isRetryableDatabaseError(error) || attempt === 2) throw error;
            await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
          }
        }
        throw lastError;
      },
    },
  });
}

type PrismaRuntime = ReturnType<typeof createPrisma>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaRuntime | undefined;
};

export const db = globalForPrisma.prisma ?? createPrisma();

// Reuse the client in warm local and Vercel serverless instances instead of
// opening a new pool on every module evaluation.
globalForPrisma.prisma = db;

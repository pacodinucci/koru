import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function normalizePostgresUrl(connectionString: string): string {
  const aliasModes = new Set(["prefer", "require", "verify-ca"]);

  try {
    const parsed = new URL(connectionString);
    const sslmode = parsed.searchParams.get("sslmode");
    const hasLibpqCompat = parsed.searchParams.has("uselibpqcompat");

    if (sslmode && aliasModes.has(sslmode) && !hasLibpqCompat) {
      parsed.searchParams.set("uselibpqcompat", "true");
      return parsed.toString();
    }

    return connectionString;
  } catch {
    return connectionString;
  }
}

const pool = new Pool({
  connectionString: normalizePostgresUrl(env.DATABASE_URL),
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

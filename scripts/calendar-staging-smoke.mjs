import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CalendarAudienceType, CalendarEventStatus } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { Pool } from "pg";

function normalizePostgresUrl(connectionString) {
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

function readEnvFromDotEnv(key) {
  if (!existsSync(".env")) {
    return undefined;
  }

  const content = readFileSync(".env", "utf8");
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`));

  if (!line) {
    return undefined;
  }

  return line.slice(key.length + 1).trim().replace(/^"|"$/g, "");
}

const connectionString = process.env.DATABASE_URL ?? readEnvFromDotEnv("DATABASE_URL");

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida.");
}

const pool = new Pool({
  connectionString: normalizePostgresUrl(connectionString),
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

function fail(message) {
  throw new Error(`[calendar-smoke] ${message}`);
}

async function main() {
  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  if (admins === 0) {
    fail("No hay usuarios ADMIN. Ejecutá roles:backfill primero.");
  }

  const invalidRanges = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "CalendarEvent" WHERE "endsAt" < "startsAt"`,
  );
  if ((invalidRanges?.[0]?.count ?? 0) > 0) {
    fail("Hay eventos con rango inválido (endsAt < startsAt).");
  }

  const privateWithoutAudience = await prisma.calendarEvent.count({
    where: {
      audienceType: CalendarAudienceType.PRIVATE,
      audiences: { none: {} },
    },
  });
  if (privateWithoutAudience > 0) {
    fail("Hay eventos PRIVATE sin destinatarios.");
  }

  const publishedCount = await prisma.calendarEvent.count({
    where: { status: CalendarEventStatus.PUBLISHED },
  });

  const sampleUsers = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true },
  });

  console.log("✅ Calendar smoke check OK");
  console.log(`- Admins: ${admins}`);
  console.log(`- Published events: ${publishedCount}`);
  console.log(`- Private events without audience: ${privateWithoutAudience}`);
  console.log(`- Checked sample users: ${sampleUsers.length}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

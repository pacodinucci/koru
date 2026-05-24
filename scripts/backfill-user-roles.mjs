import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
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

function parseEmailList(raw) {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function main() {
  const adminEmails = parseEmailList(process.env.ADMIN_EMAILS);
  const teacherEmails = parseEmailList(process.env.TEACHER_EMAILS);

  const totals = {
    [UserRole.ADMIN]: 0,
    [UserRole.TEACHER]: 0,
    [UserRole.PARENT]: 0,
  };

  if (adminEmails.length > 0) {
    const result = await prisma.user.updateMany({
      where: { email: { in: adminEmails } },
      data: { role: UserRole.ADMIN },
    });
    totals.ADMIN = result.count;
  }

  if (teacherEmails.length > 0) {
    const result = await prisma.user.updateMany({
      where: { email: { in: teacherEmails } },
      data: { role: UserRole.TEACHER },
    });
    totals.TEACHER = result.count;
  }

  const explicitEmails = Array.from(
    new Set([...adminEmails, ...teacherEmails]),
  );

  const resultParents = await prisma.user.updateMany({
    where: explicitEmails.length
      ? { email: { notIn: explicitEmails } }
      : {},
    data: { role: UserRole.PARENT },
  });
  totals.PARENT = resultParents.count;

  const grouped = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true },
  });

  console.log("Backfill terminado.");
  console.log("Actualizados por rol objetivo:", totals);
  console.log(
    "Distribución final:",
    grouped.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {}),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { Pool } from "pg";
import { buildRoleBackfillPlan } from "./role-defaults.mjs";

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

  const psychopedagogyTeacherEmails = parseEmailList(process.env.PSYCHOPEDAGOGY_TEACHER_EMAILS);
  const plan = buildRoleBackfillPlan({ adminEmails, teacherEmails, psychopedagogyTeacherEmails });
  const roles = await prisma.role.findMany({
    where: { key: { in: plan.map(({ role }) => role) }, isActive: true },
    select: { id: true, key: true },
  });
  const roleIds = new Map(roles.map(({ key, id }) => [key, id]));
  for (const { role } of plan) {
    if (!roleIds.has(role)) throw new Error(`Falta el rol ${role}. Aplicá las migraciones antes del backfill.`);
  }
  const totals = {};
  await prisma.$transaction(async (tx) => {
    for (const { role, where } of plan) {
      const result = await tx.user.updateMany({
        where,
        data: { role: UserRole[role], accessRoleId: roleIds.get(role) },
      });
      totals[role] = result.count;
    }
    // The specialized role needs authorship profiles, never classroom assignments.
    const specialists = await tx.user.findMany({
      where: { role: UserRole.PSYCHOPEDAGOGY_TEACHER },
      select: { id: true, name: true, email: true },
    });
    for (const user of specialists) {
      await tx.teacherProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, displayName: user.name || user.email, email: user.email, isActive: true },
        update: {},
      });
    }
  });

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

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import pg from "pg";

// Fresh, project-local fixtures only. Never read the configured DATABASE_URL.
const root = resolve(".tmp-admissions-e2e/candidates/infra");
const data = join(root, "pg");
const bin = process.env.PG_BINDIR;
const executable = (name) => bin ? join(bin, `${name}${process.platform === "win32" ? ".exe" : ""}`) : name;
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) throw new Error(`${command}: ${result.error?.message ?? result.stderr ?? result.status}`);
  return result.stdout;
}
if (process.argv.includes("--stop")) {
  if (!existsSync(data)) throw new Error("Disposable cluster does not exist");
  run(executable("pg_ctl"), ["-D", data, "-m", "fast", "-w", "stop"], { stdio: "ignore" });
  console.log("Stopped project-local candidate test cluster; fixture files retained.");
} else {
  if (existsSync(data)) throw new Error("Disposable cluster already exists; refusing to reset or reuse stored data.");
  mkdirSync(root, { recursive: true });
  run(executable("initdb"), ["-D", data, "-U", "candidate_test", "-A", "trust", "--encoding=UTF8", "--locale=C"]);
  // Ignore inherited stdio: PostgreSQL otherwise keeps the launcher pipes open on Windows.
  run(executable("pg_ctl"), ["-D", data, "-l", join(root, "postgres.log"), "-o", "-h 127.0.0.1 -p 55553", "-w", "start"], { stdio: "ignore" });
  const base = "postgresql://candidate_test@127.0.0.1:55553/";
  const admin = new pg.Client({ connectionString: `${base}postgres`, connectionTimeoutMillis: 3000 });
  try {
    await admin.connect();
    for (const name of ["candidate_sql", "candidate_browser"]) await admin.query(`CREATE DATABASE ${name}`);
  } finally { await admin.end(); }
  // Derive the pre-feature schema without depending on a particular branch HEAD.
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const baseline = schema
    .replace(/enum FamilyKind \{[^}]*\}\s*/m, "")
    .replace(/^.*\bkind\s+FamilyKind.*\r?\n/gm, "")
    .replace(/^.*\badmissionInquiryId\s+String\?.*\r?\n/gm, "")
    .replace(/^.*\badmissionInquiry\s+AdmissionInquiry\?.*\r?\n/gm, "")
    .replace(/^\s+family\s+Family\?\s*\r?\n/gm, "");
  const baselinePath = join(root, "baseline.prisma");
  writeFileSync(baselinePath, baseline);
  const sql = run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "diff", "--from-empty", "--to-schema", baselinePath, "--script"], {
    env: { ...process.env, DATABASE_URL: `${base}candidate_sql` }, maxBuffer: 20 * 1024 * 1024,
  });
  const migration = readFileSync("prisma/migrations/20261124120000_family_kind_and_admission_origin/migration.sql", "utf8");
  for (const name of ["candidate_sql", "candidate_browser"]) {
    const client = new pg.Client({ connectionString: base + name, connectionTimeoutMillis: 3000 });
    try {
      await client.connect();
      await client.query(sql);
      if (name === "candidate_browser") await client.query(migration);
    } finally { await client.end(); }
  }
  writeFileSync(join(root, "ready.json"), JSON.stringify({ sql: `${base}candidate_sql`, browser: `${base}candidate_browser`, port: 55553 }, null, 2));
  console.log("Ready: disposable candidate_sql baseline and candidate_browser migrated databases on loopback port 55553.");
}

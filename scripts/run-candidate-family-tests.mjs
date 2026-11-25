import { existsSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

// Focused candidate-family runner: compiles the domain tests once, then runs the
// candidate-family domain test plus the deterministic integration contract tests.
const tempDir = ".tmp-candidate-family-tests";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(tempDir, { recursive: true, force: true });

try {
  run("npx", ["tsc", "-p", "tsconfig.domain-tests.json", "--outDir", tempDir]);
  const compiledDir = join(tempDir, "tests", "domain");
  if (!existsSync(compiledDir)) {
    throw new Error(`No se compilaron las pruebas de dominio en ${compiledDir}.`);
  }
  const domainTests = readdirSync(compiledDir)
    .filter((file) => file.startsWith("candidate-families") && file.endsWith(".test.js"))
    .map((file) => join(compiledDir, file));

  if (!domainTests.length) {
    throw new Error("No se encontraron pruebas de dominio de familias candidatas.");
  }

  run("node", ["--test", ...domainTests, "tests/integration/candidate-families-migration.test.mjs"]);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

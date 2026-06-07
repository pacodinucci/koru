import { readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const tempDir = ".tmp-domain-tests";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(tempDir, { recursive: true, force: true });

try {
  run("npx", ["tsc", "-p", "tsconfig.domain-tests.json"]);
  const testDir = join(tempDir, "tests", "domain");
  const testFiles = readdirSync(testDir)
    .filter((file) => file.endsWith(".test.js"))
    .map((file) => join(testDir, file));

  run("node", ["--test", ...testFiles]);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

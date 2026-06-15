import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const logDir = join(root, "data", "logs");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function ensureLogDir() {
  await mkdir(logDir, { recursive: true });
}

function run(command, args) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const child = spawn(command, args, {
      cwd: root,
      shell: process.platform === "win32" && command === npmCommand,
      env: process.env
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("close", (code) => {
      resolve({
        command: [command, ...args].join(" "),
        startedAt,
        finishedAt: new Date().toISOString(),
        code,
        ok: code === 0,
        stdout,
        stderr
      });
    });
  });
}

async function main() {
  await ensureLogDir();
  const steps = [
    ["node", ["scripts/fetch_public_data.mjs"]],
    ["node", ["scripts/sync_candidates.mjs"]],
    ["node", ["scripts/build_real_data.mjs"]],
    [npmCommand, ["run", "typecheck"]],
    [npmCommand, ["run", "build"]]
  ];

  const results = [];
  for (const [command, args] of steps) {
    const result = await run(command, args);
    results.push(result);
    if (!result.ok) break;
  }

  const summary = {
    ok: results.every((result) => result.ok),
    generatedAt: new Date().toISOString(),
    results
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await writeFile(
    join(logDir, `daily_batch_${stamp}.json`),
    JSON.stringify(summary, null, 2),
    "utf8"
  );
  await writeFile(
    join(logDir, "latest_daily_batch.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  if (!summary.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

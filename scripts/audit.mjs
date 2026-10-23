import { mkdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";

await mkdir("reports", { recursive: true });
const server = await serve(4175);
let failed = false;
try {
  for (const mode of ["mobile", "desktop"]) {
    const output = resolve(`reports/lighthouse-${mode}`);
    const args = [
      "node_modules/lighthouse/cli/index.js",
      "http://127.0.0.1:4175/tibs245/",
      "--quiet",
      "--chrome-flags=--headless --no-sandbox",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      "--output=html",
      `--output-path=${output}`,
    ];
    if (mode === "desktop") args.push("--preset=desktop");
    const code = await new Promise((done, reject) => {
      const child = spawn(process.execPath, args, { stdio: "inherit" });
      child.once("error", reject);
      child.once("exit", done);
    });
    if (code !== 0) throw new Error(`Lighthouse ${mode} exited with ${code}`);
    const report = JSON.parse(await readFile(`${output}.report.json`, "utf8"));
    if (report.runtimeError) throw new Error(report.runtimeError.message);
    console.log(`\n${mode.toUpperCase()}`);
    for (const [id, category] of Object.entries(report.categories)) {
      const minimum = id === "performance" ? 0.95 : 1;
      console.log(`${id}: ${Math.round(category.score * 100)}/100`);
      if (category.score === null || category.score < minimum) failed = true;
    }
    for (const audit of Object.values(report.audits))
      if (
        audit.score !== null &&
        audit.score < 1 &&
        audit.scoreDisplayMode !== "informative"
      )
        console.log(
          `  ${audit.id}: ${audit.title} ${audit.displayValue || ""}`,
        );
  }
} finally {
  await new Promise((done) => server.close(done));
}
if (failed) process.exitCode = 1;

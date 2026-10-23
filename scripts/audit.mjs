import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";

await mkdir("reports", { recursive: true });
const server = await serve(4175);
const summary = {};
let failed = false;
try {
  for (const mode of ["mobile", "desktop"]) {
    const runs = [];
    for (let run = 1; run <= 3; run++) {
      const output = resolve(`reports/lighthouse-${mode}-${run}`);
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
      if (code !== 0)
        throw new Error(`Lighthouse ${mode} run ${run} exited with ${code}`);
      const report = JSON.parse(
        await readFile(`${output}.report.json`, "utf8"),
      );
      if (report.runtimeError) throw new Error(report.runtimeError.message);
      const scores = Object.fromEntries(
        Object.entries(report.categories).map(([id, category]) => [
          id,
          category.score,
        ]),
      );
      if (Object.values(scores).some((score) => score === null))
        throw new Error(`Missing audit score: ${mode} run ${run}`);
      console.log(`${mode} ${run}/3: ${JSON.stringify(scores)}`);
      // Every run must pass the deterministic checks. Only performance uses a median.
      for (const id of ["accessibility", "best-practices", "seo"])
        if (scores[id] !== 1) {
          failed = true;
          for (const { id: auditId, weight } of report.categories[id]
            .auditRefs) {
            const audit = report.audits[auditId];
            if (weight && audit.score !== null && audit.score < 1)
              console.error(`  ${auditId}: ${audit.title}`);
          }
        }
      runs.push({ run, scores });
    }
    const ordered = [...runs].sort(
      (a, b) => a.scores.performance - b.scores.performance,
    );
    summary[mode] = { runs, medianPerformance: ordered[1].scores.performance };
    console.log(
      `${mode} median performance: ${Math.round(summary[mode].medianPerformance * 100)}/100`,
    );
    if (summary[mode].medianPerformance < 0.95) failed = true;
  }
  await writeFile(
    "reports/summary.json",
    JSON.stringify(summary, null, 2) + "\n",
  );
} finally {
  await new Promise((done) => server.close(done));
}
if (failed) process.exitCode = 1;

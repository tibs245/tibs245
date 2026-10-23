import { readFile, stat, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { resolve } from "node:path";

const origin = "https://tibs245.github.io/tibs245/";
const html = await readFile("docs/index.html", "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, "Duplicate HTML IDs");
assert.equal(
  [...html.matchAll(/<h1(?:\s|>)/g)].length,
  1,
  "One primary heading",
);
assert.match(html, /<html lang="fr">/);
assert.match(
  html,
  /<link\s+rel="canonical"\s+href="https:\/\/tibs245.github.io\/tibs245\/"/,
);
assert(!html.includes("chatgpt.site"), "Remove old hosting metadata");
for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (url.startsWith("#"))
    assert(ids.includes(url.slice(1)), `Missing anchor ${url}`);
  else if (!/^[a-z]+:/i.test(url)) await stat(resolve("docs", url));
}
for (const [, json] of html.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
)) {
  const data = JSON.parse(json);
  assert.equal(data["@type"], "ProfilePage");
  assert.equal(data.mainEntity.url, origin);
}
for (const name of ["sitemap.xml", "robots.txt"])
  assert((await readFile(`docs/${name}`, "utf8")).includes(origin));
const css = await readFile("docs/style.css", "utf8");
for (const [, url] of css.matchAll(/url\(['"]?([^'"()]+)['"]?\)/g))
  await stat(resolve("docs", url));
assert(css.includes("prefers-reduced-motion"));
assert(css.includes("focus-visible"));
const assets = await readdir("docs/assets");
const sizes = await Promise.all(
  assets.map((name) => stat(`docs/assets/${name}`)),
);
const bytes =
  Buffer.byteLength(html) +
  Buffer.byteLength(css) +
  (await stat("docs/app.js")).size +
  sizes.reduce((sum, s) => sum + s.size, 0);
assert(bytes < 400_000, `Static payload exceeds 400 kB: ${bytes}`);
console.log(
  `Site checks passed: anchors, assets, SEO, structured data, motion/focus, ${bytes} bytes total (including social image).`,
);

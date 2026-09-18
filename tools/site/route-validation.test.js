import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { DAILY_CHALLENGES } from "../../src/daily/challenges.js";
import { bogotaDateFromInstant, getPublishedChallenges } from "../../src/daily/challenge-model.js";

const root = path.resolve(import.meta.dirname, "..", "..");
const dist = path.join(root, "dist");
const read = (relative) => fs.readFileSync(path.join(dist, relative), "utf8");
assert.equal(fs.existsSync(path.join(dist, "index.html")), true, "Run npm run build before route validation.");

const canonicalDate = bogotaDateFromInstant();
const published = getPublishedChallenges(DAILY_CHALLENGES, canonicalDate);
const htmlFiles = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (entry.name.endsWith(".html")) htmlFiles.push(target);
  }
}
walk(dist);

const resolveLocal = (href) => {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || /^(?:https?:|mailto:|tel:)/.test(clean)) return null;
  if (clean === "/") return path.join(dist, "index.html");
  if (clean.endsWith("/")) return path.join(dist, clean.slice(1), "index.html");
  return path.join(dist, clean.replace(/^\//, ""));
};

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const target = resolveLocal(match[1]);
    if (target) assert.equal(fs.existsSync(target), true, `${path.relative(dist, file)} -> ${match[1]}`);
  }
}
console.log(`PASS: ${htmlFiles.length} built HTML files have resolvable local links and assets`);

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "sitemap URLs must be unique");
assert.equal(sitemapUrls.filter((url) => url === "https://wordcabin.com/daily-word-challenge/").length, 1);
assert.equal(sitemapUrls.some((url) => /daily-word-challenge\/\d{4}-\d{2}-\d{2}/.test(url)), false);
const archive = read("daily-word-challenge/index.html");
assert.match(archive, /meta name="robots" content="index, follow"/);
assert.match(archive, /rel="canonical" href="https:\/\/wordcabin\.com\/daily-word-challenge\/"/);
for (const challenge of published) {
  const page = read(`daily-word-challenge/${challenge.date}/index.html`);
  const head = page.slice(0, page.indexOf("</head>"));
  assert.match(head, /meta name="robots" content="noindex, follow"/);
  assert.match(head, new RegExp(`https://wordcabin\\.com/daily-word-challenge/${challenge.date}/`));
  assert.equal(head.toLowerCase().includes(challenge.answer), false);
}
for (const challenge of DAILY_CHALLENGES.filter((entry) => entry.date > canonicalDate)) {
  assert.equal(fs.existsSync(path.join(dist, "daily-word-challenge", challenge.date)), false);
}
assert.equal(fs.existsSync(path.join(dist, "daily-word-challenge", "2099-01-01")), false);
console.log("PASS: sitemap, canonical, index/noindex, answer-spoiler, future-route, and unknown-route policy");

const manifestPath = path.join(dist, ".vite", "manifest.json");
assert.equal(fs.existsSync(manifestPath), true, "Vite manifest is required for asset-graph verification");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const dailyEntry = Object.values(manifest).find((entry) => entry.src === "src/daily/DailyChallengeApp.jsx");
const solverEntry = Object.values(manifest).find((entry) => entry.src === "src/solver/SolverApp.jsx");
assert.ok(dailyEntry, "daily chunk must be present in Vite manifest");
assert.ok(solverEntry, "solver chunk must be present in Vite manifest");
const dictionaryFile = solverEntry.file;
assert.notEqual(dailyEntry.file, dictionaryFile);
const collectStaticImports = (entry, found = new Set()) => {
  for (const key of entry.imports ?? []) {
    if (found.has(key)) continue;
    found.add(key);
    if (manifest[key]) collectStaticImports(manifest[key], found);
  }
  return found;
};
const dailyStaticImports = collectStaticImports(dailyEntry);
assert.equal(dailyStaticImports.has("src/solver/SolverApp.jsx"), false);
assert.equal(dailyStaticImports.has(solverEntry.file), false);
assert.equal(archive.includes(dictionaryFile), false, "archive HTML must not eagerly reference the solver/dictionary chunk");
const dictionaryChunk = fs.readFileSync(path.join(dist, dictionaryFile), "utf8");
assert.match(dictionaryChunk, /zymurgy/, "solver chunk should contain the production dictionary marker");
assert.doesNotMatch(
  fs.readFileSync(path.join(dist, dailyEntry.file), "utf8"),
  /zymurgy/,
  "daily chunk must not contain the production dictionary marker",
);
const fileForManifestKey = (key) => manifest[key]?.file;
const dailyFiles = new Set([
  manifest["index.html"].file,
  dailyEntry.file,
  ...(dailyEntry.imports ?? []).map(fileForManifestKey).filter(Boolean),
]);
const gzipBytes = (relative) => zlib.gzipSync(fs.readFileSync(path.join(dist, relative))).length;
const dailyJavaScriptGzip = [...dailyFiles].reduce((total, file) => total + gzipBytes(file), 0);
assert.ok(dailyJavaScriptGzip < 100 * 1024, `daily JavaScript gzip budget exceeded: ${dailyJavaScriptGzip} bytes`);
console.log(
  `PASS: daily asset graph is isolated from ${dictionaryFile}; eager daily JavaScript is ${dailyJavaScriptGzip} gzip bytes`,
);
console.log("=== ROUTE_VALIDATION_TESTS_COMPLETE ===");

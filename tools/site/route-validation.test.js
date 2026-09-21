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
const sharedToolEntry = Object.values(manifest).find((entry) => entry.src === "src/solver/WordSolver.jsx");
assert.ok(dailyEntry, "daily chunk must be present in Vite manifest");
assert.ok(solverEntry, "solver chunk must be present in Vite manifest");
assert.ok(sharedToolEntry, "shared tool chunk must exist");
const dictionaryFile = sharedToolEntry.file;
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
assert.equal(dailyStaticImports.has("src/solver/WordSolver.jsx"), false);
assert.equal(dailyStaticImports.has(sharedToolEntry.file), false);
assert.equal(dailyStaticImports.has("src/solver/SolverApp.jsx"), false);
assert.equal(dailyStaticImports.has(solverEntry.file), false);
assert.equal(archive.includes(dictionaryFile), false, "archive HTML must not eagerly reference the solver/dictionary chunk");
const dictionaryChunk = fs.readFileSync(path.join(dist, dictionaryFile), "utf8");
assert.match(dictionaryChunk, /zymurgy/, "shared solver chunk should contain the production dictionary marker");
const dictionaryChunks = Object.values(manifest).filter(entry => entry.file.endsWith(".js") && read(entry.file).includes("zymurgy"));
assert.equal(dictionaryChunks.length, 1, "dictionary must appear in exactly one emitted chunk");
assert.ok(collectStaticImports(solverEntry).has("src/solver/WordSolver.jsx"), "homepage must reuse the shared tool chunk");
for (const route of ["anagram-solver", "scrabble-word-finder"]) {
  const html = read(`${route}/index.html`);
  assert.match(html, /id="tool-root" data-tool-mode="(?:anagram|tile-game)"/);
  assert.ok(html.includes(`src="/${manifest["index.html"].file}"`), "tool page must use current bootstrap");
  assert.ok(html.includes(`href="https://wordcabin.com/${route}/"`));
  assert.match(html, /content="index, follow"/);
  assert.ok(html.indexOf('id="tool-root"') < html.indexOf('<ol class="steps">'), "tool must precede guide");
  assert.match(html, /Related tools:/);
  assert.match(html, /href="#tool"/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.ok(read(manifest["index.html"].file).includes(sharedToolEntry.file.split("/").at(-1)), "bootstrap loads shared tool entry");
}
console.log("PASS: tool mounts, current assets, preserved SEO/guides/navigation and one shared dictionary chunk");
assert.doesNotMatch(
  fs.readFileSync(path.join(dist, dailyEntry.file), "utf8"),
  /zymurgy/,
  "daily chunk must not contain the production dictionary marker",
);
const fileForManifestKey = (key) => manifest[key]?.file;
const dailyFiles = new Set([
  manifest["index.html"].file,
  dailyEntry.file,
  ...[...collectStaticImports(dailyEntry)].map(fileForManifestKey).filter(Boolean),
]);
const gzipBytes = (relative) => zlib.gzipSync(fs.readFileSync(path.join(dist, relative))).length;
const dailyJavaScriptGzip = [...dailyFiles].reduce((total, file) => total + gzipBytes(file), 0);
assert.ok(dailyJavaScriptGzip < 100 * 1024, `daily JavaScript gzip budget exceeded: ${dailyJavaScriptGzip} bytes`);
console.log(
  `PASS: daily asset graph is isolated from ${dictionaryFile}; eager daily JavaScript is ${dailyJavaScriptGzip} gzip bytes`,
);
console.log("=== ROUTE_VALIDATION_TESTS_COMPLETE ===");

const analyticsEntry = manifest["src/analytics/bootstrap.js"];
assert.ok(analyticsEntry, "analytics must have a standalone entry for static pages");
assert.equal(collectStaticImports(analyticsEntry).size, 0, "static analytics must not load React or the dictionary");
assert.doesNotMatch(read(analyticsEntry.file), /zymurgy|plausible\.io/);
assert.ok(collectStaticImports(manifest["index.html"]).has("src/analytics/bootstrap.js"));
for (const route of ["privacy", "advertising", "word-unscrambler"]) {
  const html = read(`${route}/index.html`);
  assert.equal(html.split(`src="/${analyticsEntry.file}"`).length - 1, 1);
  assert.equal(html.includes(dictionaryFile), false);
  for (const css of analyticsEntry.css || []) assert.ok(html.includes(`href="/${css}"`));
}
console.log("PASS: one lightweight current analytics entry on static pages; all app routes share the adapter");

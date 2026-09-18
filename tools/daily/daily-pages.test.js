import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { DAILY_CHALLENGES } from "../../src/daily/challenges.js";
import { generateDailyPages } from "./generate-pages.js";

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wordcabin-daily-pages-"));
const assetDirectory = path.join(temporaryDirectory, "assets");
fs.mkdirSync(assetDirectory);
fs.writeFileSync(path.join(assetDirectory, "app-current.js"), "console.log('current');\n");
fs.writeFileSync(path.join(assetDirectory, "app-current.css"), "body{}\n");
fs.writeFileSync(
  path.join(temporaryDirectory, "index.html"),
  `<!doctype html><html><head>
    <title>WordCabin | Home</title>
    <meta name="description" content="Home description" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://wordcabin.com/" />
    <meta property="og:title" content="WordCabin | Home" />
    <meta property="og:description" content="Home description" />
    <meta property="og:url" content="https://wordcabin.com/" />
    <meta name="twitter:title" content="WordCabin | Home" />
    <meta name="twitter:description" content="Home description" />
    <script type="application/ld+json">{"@type":"WebSite"}</script>
    <link rel="stylesheet" href="/assets/app-current.css" />
  </head><body><div id="root"></div><script type="module" src="/assets/app-current.js"></script></body></html>`,
);

try {
  const silent = { log() {}, warn() {}, error() {} };
  const generated = generateDailyPages({
    distDirectory: temporaryDirectory,
    instant: new Date("2026-09-24T15:00:00Z"),
    logger: silent,
  });
  assert.equal(generated.published.length, 7);
  const archivePath = path.join(temporaryDirectory, "daily-word-challenge", "index.html");
  const archive = fs.readFileSync(archivePath, "utf8");
  assert.match(archive, /Daily Word Challenge Archive \| WordCabin/);
  assert.match(archive, /meta name="robots" content="index, follow"/);
  assert.match(archive, /rel="canonical" href="https:\/\/wordcabin\.com\/daily-word-challenge\/"/);
  assert.match(archive, /"@type":"ItemList"/);
  assert.match(archive, /\/assets\/app-current\.js/);
  assert.match(archive, /\/assets\/app-current\.css/);

  for (const challenge of DAILY_CHALLENGES) {
    const pagePath = path.join(temporaryDirectory, "daily-word-challenge", challenge.date, "index.html");
    assert.equal(fs.existsSync(pagePath), true, pagePath);
    const page = fs.readFileSync(pagePath, "utf8");
    const head = page.slice(0, page.indexOf("</head>"));
    assert.match(head, /meta name="robots" content="noindex, follow"/);
    assert.match(head, new RegExp(`rel="canonical" href="https://wordcabin\\.com/daily-word-challenge/${challenge.date}/"`));
    assert.equal(head.toLowerCase().includes(challenge.answer), false, `metadata leaked ${challenge.answer}`);
    assert.match(page, /\/assets\/app-current\.js/);
    assert.match(page, /\/assets\/app-current\.css/);
  }
  const middle = fs.readFileSync(
    path.join(temporaryDirectory, "daily-word-challenge", DAILY_CHALLENGES[3].date, "index.html"),
    "utf8",
  );
  assert.match(middle, new RegExp(DAILY_CHALLENGES[2].date));
  assert.match(middle, new RegExp(DAILY_CHALLENGES[4].date));
  console.log("PASS: archive/date generation, canonicals, robots, structured data, answer-safe metadata, navigation, and current assets");

  generateDailyPages({
    distDirectory: temporaryDirectory,
    instant: new Date("2026-09-18T15:00:00Z"),
    logger: silent,
  });
  assert.equal(
    fs.existsSync(path.join(temporaryDirectory, "daily-word-challenge", "2026-09-19", "index.html")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(temporaryDirectory, "daily-word-challenge", "2099-01-01", "index.html")),
    false,
  );
  console.log("PASS: future and unknown challenge routes are not generated");

  fs.rmSync(path.join(assetDirectory, "app-current.js"));
  assert.throws(
    () => generateDailyPages({ distDirectory: temporaryDirectory, instant: new Date("2026-09-18T15:00:00Z"), logger: silent }),
    /missing asset/,
  );
  console.log("PASS: stale or missing hashed asset references fail page generation");
  console.log("=== DAILY_PAGE_GENERATION_TESTS_COMPLETE ===");
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

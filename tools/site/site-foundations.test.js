import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const sitemap = read("public/sitemap.xml");
const robots = read("public/robots.txt");
const main = read("src/main.jsx");

const requiredUrls = [
  "https://wordcabin.com/",
  "https://wordcabin.com/word-unscrambler/",
  "https://wordcabin.com/anagram-solver/",
  "https://wordcabin.com/scrabble-word-finder/",
  "https://wordcabin.com/privacy/",
  "https://wordcabin.com/advertising/",
];

for (const url of requiredUrls) {
  assert.equal(
    sitemap.split(`<loc>${url}</loc>`).length - 1,
    1,
    `${url} must appear once in sitemap`,
  );
}
assert.match(robots, /Allow:\s*\//);
assert.match(robots, /Sitemap:\s*https:\/\/wordcabin\.com\/sitemap\.xml/);
for (const route of [
  "word-unscrambler",
  "anagram-solver",
  "scrabble-word-finder",
  "privacy",
  "advertising",
]) {
  assert.match(
    main,
    new RegExp(`/${route}/`),
    `homepage must link to /${route}/`,
  );
}
for (const page of [
  "public/privacy/index.html",
  "public/advertising/index.html",
]) {
  const html = read(page);
  assert.match(html, /<title>.+<\/title>/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /meta name="robots" content="index, follow"/);
}
assert.equal(read(".env.example").includes("VITE_ADSENSE_CLIENT=\n"), true);
console.log(
  "PASS: crawlability, internal links, disclosures, and disabled-by-default monetization configuration",
);
console.log("=== SITE_FOUNDATIONS_TESTS_COMPLETE ===");

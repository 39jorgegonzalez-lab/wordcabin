import fs from "node:fs";
import path from "node:path";

// These pages have no React application. Use the lightweight analytics entry
// from this build, never the solver/bootstrap/dictionary payload.
const dist = path.resolve("dist");
const manifest = JSON.parse(fs.readFileSync(path.join(dist, ".vite/manifest.json"), "utf8"));
const entry = manifest["src/analytics/bootstrap.js"];
if (!entry) throw new Error("Missing analytics entry in current build");
const files = [entry.file, ...(entry.css || [])];
for (const file of files) {
  if (!file.startsWith("assets/") || !fs.existsSync(path.join(dist, file))) throw new Error(`Missing analytics asset: ${file}`);
}
const tags = `<script type="module" crossorigin src="/${entry.file}"></script>\n`
  + (entry.css || []).map(file => `<link rel="stylesheet" href="/${file}">`).join("\n");
for (const route of ["privacy", "advertising", "word-unscrambler"]) {
  const file = path.join(dist, route, "index.html");
  const html = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, html.replace("</head>", `${tags}\n</head>`));
}
console.log("PASS: static pages use current lightweight analytics assets");

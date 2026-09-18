import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const TOOL_ROUTES = ["anagram-solver", "scrabble-word-finder"];

export function generateToolPages(dist = path.resolve("dist")) {
  const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const scripts = shell.match(/<script\b[^>]*type="module"[^>]*src="[^"]+"[^>]*><\/script>/g) || [];
  const styles = shell.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) || [];
  if (scripts.length !== 1) throw new Error("Expected one current Vite module entry");
  const assets = [...scripts, ...styles].join("\n");
  for (const [, url] of assets.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (!url.startsWith("/assets/") || !fs.existsSync(path.join(dist, url.slice(1)))) {
      throw new Error(`Missing current tool asset: ${url}`);
    }
  }
  for (const route of TOOL_ROUTES) {
    const source = fs.readFileSync(new URL(`../../public/${route}/index.html`, import.meta.url), "utf8");
    if (!source.includes('id="tool-root"') || !source.includes("<!-- TOOL_ASSETS -->")) {
      throw new Error(`Tool shell missing mount or asset marker: ${route}`);
    }
    fs.writeFileSync(path.join(dist, route, "index.html"), source.replace("<!-- TOOL_ASSETS -->", assets));
  }
  console.log("PASS: two existing tool pages connected to current Vite assets");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) generateToolPages();

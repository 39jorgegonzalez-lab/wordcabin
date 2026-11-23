import { readFileSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ToolNavigation } from "../../src/solver/ToolNavigation.js";

// Run after the daily and tool generators have consumed the empty app shell.
const homepage = new URL("../../dist/index.html", import.meta.url);
const html = readFileSync(homepage, "utf8");
const mount = '<div id="root"></div>';
if (html.split(mount).length !== 2) {
  throw new Error("Expected one empty homepage application root.");
}
const navigation = renderToStaticMarkup(createElement(ToolNavigation));
writeFileSync(homepage, html.replace(mount, `<div id="root">${navigation}</div>`));

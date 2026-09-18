import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateToolPages, TOOL_ROUTES } from "./generate-tool-pages.js";

// Execute real React DOM updates in a DOM harness. This is not visual/browser QA.
const dom = new JSDOM('<!doctype html><div id="root"></div>', {url:"https://wordcabin.test/"});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {value:dom.window.navigator, configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import("react");
const { createRoot } = await import("react-dom/client");
const server = await createServer({server:{middlewareMode:true}, appType:"custom"});
try {
  const { WordSolver } = await server.ssrLoadModule("/src/solver/WordSolver.jsx");
  const root = createRoot(document.getElementById("root"));
  const change = async (input, value) => React.act(async()=>{
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,"value").set.call(input,value);
    input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
  });
  const resultWords = () => [...document.querySelectorAll(".wordPill span")].map(el=>el.textContent);
  for (const mode of ["unscrambler", "anagram", "tile-game"]) {
    await React.act(async()=>root.render(React.createElement(WordSolver,{mode,key:mode})));
    const input=document.querySelector(".inputRow input");
    assert.ok(input.getAttribute("aria-label"));
    assert.equal(document.querySelectorAll(".inputRow button").length,0);
    assert.match(document.getElementById("letter-help").textContent,/Results update as you type/);
    await change(input,"LISTEN");
    assert.ok(resultWords().includes("silent"), `${mode}: results must update with input, without submit`);
    assert.equal(document.querySelector('[role="status"]').getAttribute("aria-live"),"polite");
    if (mode === "anagram") assert.ok(resultWords().every(word=>word.length===6));
    else assert.ok(resultWords().some(word=>word.length<6));
    await change(input,"  LISTEN  ");
    const before=resultWords();
    await React.act(async()=>input.dispatchEvent(new dom.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true})));
    assert.equal(input.value,"LISTEN");
    assert.deepEqual(resultWords(),before);
    await change(document.querySelector(".filters input"),"s");
    assert.ok(resultWords().length > 0 && resultWords().every(word=>word.startsWith("s")));
    await change(input,"list?n");
    assert.ok(resultWords().includes("silent"));
    if(mode!=="anagram") {
      await change(document.querySelector('input[type="number"]'),"3");
      assert.ok(resultWords().length>0 && resultWords().every(word=>word.length===3));
    }
    await React.act(async()=>document.querySelector(".ghost").click());
    assert.equal(input.value,"");
    assert.ok([...document.querySelectorAll(".filters input")].every(el=>el.value===""));
    assert.equal(document.activeElement,input);
    assert.equal(resultWords().length,0);
    await change(input,"123!");
    assert.match(document.querySelector(".resultsPanel").textContent,/No words found/);
    assert.equal(resultWords().length,0);
  }
  await React.act(async()=>root.unmount());
  console.log("PASS: real DOM live typing, no submit control, all modes, filters, wildcard, Enter, reset/focus, invalid states and live announcements");
} finally { await server.close(); dom.window.close(); }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "wordcabin-tool-pages-"));
try {
  fs.mkdirSync(path.join(temp,"assets"));
  for (const route of TOOL_ROUTES) fs.mkdirSync(path.join(temp,route));
  fs.writeFileSync(path.join(temp,"index.html"), '<script type="module" crossorigin src="/assets/current.js"></script>');
  assert.throws(()=>generateToolPages(temp), /Missing current tool asset/);
  fs.writeFileSync(path.join(temp,"assets/current.js"), "/* fixture entry */");
  generateToolPages(temp);
  for(const route of TOOL_ROUTES) {
    const page=fs.readFileSync(path.join(temp,route,"index.html"),"utf8");
    assert.match(page,/src="\/assets\/current.js"/);
    assert.ok(!page.includes("TOOL_ASSETS"));
    assert.ok(page.indexOf('id="tool-root"') < page.indexOf('<ol class="steps">'));
    assert.ok(page.includes(`https://wordcabin.com/${route}/`));
  }
  fs.writeFileSync(path.join(temp,"index.html"), "<html></html>");
  assert.throws(()=>generateToolPages(temp), /Expected one current Vite module entry/);
  console.log("PASS: tool-page asset generation fails closed on missing/stale shell assets and preserves real routes/content");
} finally { fs.rmSync(temp,{recursive:true,force:true}); }

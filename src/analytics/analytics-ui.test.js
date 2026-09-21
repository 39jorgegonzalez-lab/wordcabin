import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import { DAILY_CHALLENGES } from "../daily/challenges.js";

const dom = new JSDOM('<!doctype html><div id="root"></div>', {url:"https://wordcabin.test/daily-word-challenge/2026-09-18/"});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.localStorage = dom.window.localStorage;
globalThis.requestAnimationFrame = callback => callback();
Object.defineProperty(globalThis, "navigator", {value:dom.window.navigator, configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import("react");
const { createRoot } = await import("react-dom/client");
const server = await createServer({server:{middlewareMode:true}, appType:"custom"});
try {
  const { mountAnalytics } = await server.ssrLoadModule("/src/analytics/bootstrap.js");
  const api = mountAnalytics(window, "G-82FJCYXT95");
  mountAnalytics(window, "G-82FJCYXT95");
  assert.equal(document.querySelectorAll("#analytics-preferences").length, 1);
  const panel = document.getElementById("analytics-preferences");
  assert.equal(panel.hidden, false);
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(document.querySelector("main"), null);
  document.querySelector('[data-choice="denied"]').click();
  assert.equal(api.choice, "denied");
  assert.equal(panel.hidden, true);
  assert.equal(document.querySelectorAll("script[data-wordcabin-ga4]").length, 1);
  document.querySelector(".analyticsFooter button").click();
  assert.equal(panel.hidden, false);
  assert.equal(document.activeElement, panel.querySelector("button"));
  document.querySelector('[data-choice="granted"]').click();
  assert.equal(api.choice, "granted");
  assert.equal(panel.hidden, true);
  assert.equal(document.querySelectorAll("script[data-wordcabin-ga4]").length, 1);
  document.querySelector(".analyticsFooter button").click();
  document.querySelector('[data-choice="denied"]').click();
  assert.equal(api.choice, "denied");
  assert.equal(window["ga-disable-G-82FJCYXT95"], undefined);
  assert.equal(Array.from(window.dataLayer.at(-1))[2].analytics_storage, "denied");
  assert.match(panel.textContent, /limited cookieless page signals/);
  console.log("PASS: real consent DOM, comparable choices, nonmodal decline/grant/reopen/revoke and focus");

  const { DailyChallengeApp } = await server.ssrLoadModule("/src/daily/DailyChallengeApp.jsx");
  const root = createRoot(document.getElementById("root"));
  const received = [];
  window.addEventListener("wordcabin:analytics", event => received.push(event.detail));
  await React.act(async()=>root.render(React.createElement(DailyChallengeApp,{pathname:"/daily-word-challenge/2026-09-18/"})));
  const answer = DAILY_CHALLENGES[0].answer;
  async function solve() {
    const input = document.getElementById("daily-guess");
    await React.act(async()=>{
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,"value").set.call(input,answer);
      input.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
    });
    await React.act(async()=>document.querySelector(".challengeForm").dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true})));
  }
  await solve();
  assert.equal(received.filter(e=>e.name==="daily_challenge_complete").length,1);
  const original = localStorage.getItem("wordcabin.daily.v1");
  await React.act(async()=>document.querySelector(".dailyReplay").click());
  await solve();
  assert.equal(received.filter(e=>e.name==="daily_challenge_complete").length,1,"replay does not create another original completion event");
  assert.equal(localStorage.getItem("wordcabin.daily.v1"),original);
  assert.equal(JSON.stringify(received).includes(answer),false);
  await React.act(async()=>root.unmount());
  console.log("PASS: actual Daily completion/replay preserves storage and emits original completion once, without answer");
} finally { await server.close(); dom.window.close(); }

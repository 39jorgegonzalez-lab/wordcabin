import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { initializeGA4, validMeasurementId, pageProperties } from "./ga4.js";
import { CONSENT_KEY, parseConsent, readConsent } from "./consent.js";
import { ANALYTICS_EVENT, createToolEngagement, safeEvent, TOOL_NAMES } from "./events.js";

const id = "G-82FJCYXT95";
function fixture(path = "/", stored) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><main>Working tool</main></body></html>", { url: `https://wordcabin.test${path}` });
  if (stored) dom.window.localStorage.setItem(CONSENT_KEY, stored);
  return dom.window;
}
const commands = win => [...(win.dataLayer || [])].map(args => Array.from(args));
const events = win => commands(win).filter(args => args[0] === "event");
const emit = (win, name, properties) => win.dispatchEvent(new win.CustomEvent(ANALYTICS_EVENT, { detail: { name, properties } }));
const daily = { challengeId: "daily-2026-09-18", challengeDate: "2026-09-18", difficulty: "medium", attemptNumber: 2, completionStatus: true };

test("Advanced initialization order is deterministic for no choice, stored denial and stored grant", () => {
  for (const choice of [null, "denied", "granted"]) {
    const win = fixture("/", choice && JSON.stringify({version:1, analytics:choice}));
    const append = win.document.head.appendChild.bind(win.document.head);
    let atInsertion;
    win.document.head.appendChild = node => {
      atInsertion = commands(win);
      return append(node);
    };
    initializeGA4(win, id);
    assert.equal(atInsertion.length, 1, "only consent default exists at tag insertion");
    assert.deepEqual(atInsertion[0].slice(0, 2), ["consent", "default"]);
    assert.ok(Object.values(atInsertion[0][2]).every(value => value === "denied"));
    assert.deepEqual(commands(win).map(c => c.slice(0, 2)), [
      ["consent", "default"], ["js", commands(win)[1][1]], ["config", id],
      ...(choice ? [["consent", "update"]] : []), ["event", "page_view"],
    ]);
    assert.equal(commands(win).find(c=>c[0]==="config")[2].send_page_view, false);
    assert.equal(commands(win).filter(c=>c[0]==="consent").at(-1)[2].analytics_storage, choice || "denied");
    assert.equal(win.document.scripts.length, 1);
    win.close();
  }
});

test("consent update precedes persistence; independent hard opt-out is not overridden", () => {
  const win = fixture();
  win[`ga-disable-${id}`] = true;
  const api = initializeGA4(win, id);
  let stored = null;
  Object.defineProperty(win, "localStorage", {value:{
    getItem:()=>stored,
    setItem(key, value) {
      assert.equal(commands(win).at(-1)[0], "consent");
      assert.equal(commands(win).at(-1)[2].analytics_storage, JSON.parse(value).analytics);
      stored = value;
    },
  }});
  api.setConsent("granted");
  api.setConsent("denied");
  assert.equal(win[`ga-disable-${id}`], true, "do not bypass a separate user opt-out");
  assert.equal(win.document.querySelector("main").textContent, "Working tool");
  win.close();
});

test("denied product activity is dropped, never replayed on grant, while new granted activity is forwarded", () => {
  const win = fixture();
  const api = initializeGA4(win, id);
  const names = ["tool_engaged", "daily_challenge_view", "daily_challenge_start", "daily_challenge_complete", "daily_challenge_failed", "daily_challenge_navigation"];
  for (const name of names) emit(win, name, name === "tool_engaged" ? {tool_name:"anagram_solver"} : daily);
  api.setConsent("granted");
  assert.deepEqual(events(win).map(c=>c[1]), ["page_view"]);
  for (const name of names) emit(win, name, name === "tool_engaged" ? {tool_name:"anagram_solver"} : daily);
  assert.deepEqual(events(win).map(c=>c[1]), ["page_view", ...names]);
  api.setConsent("denied");
  for (const name of names) emit(win, name, name === "tool_engaged" ? {tool_name:"anagram_solver"} : daily);
  api.setConsent("granted");
  assert.deepEqual(events(win).map(c=>c[1]), ["page_view"]);
  win.close();
});

test("valid public ID accepted; absent/empty/malformed configurations do nothing", () => {
  assert.ok(validMeasurementId(id));
  for (const bad of [undefined, null, "", " ", "G-123", "G-82FJCYXT95?x=secret", "UA-123", "g-82fjcyxt95"]) {
    const win = fixture();
    assert.equal(initializeGA4(win, bad), null);
    assert.equal(win.dataLayer, undefined);
    assert.equal(win.document.scripts.length, 0);
    win.close();
  }
});
test("default denied before commands; tag and one page view exist before opt-in, product events remain gated", () => {
  const win = fixture();
  const api = initializeGA4(win, id);
  assert.equal(api.choice, null);
  assert.equal(win[`ga-disable-${id}`], undefined);
  assert.deepEqual(commands(win)[0], ["consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
  emit(win, "daily_challenge_complete", daily);
  api.setConsent("denied");
  assert.equal(win.document.scripts.length, 1);
  assert.deepEqual(events(win).map(c => c[1]), ["page_view"]);
  assert.equal(readConsent(win), "denied");
  win.close();
});
test("grant initializes once, ads stay denied, explicit single page view, no duplicate config", () => {
  const win = fixture("/?q=PRIVATE#PRIVATE");
  const api = initializeGA4(win, id);
  emit(win, "tool_engaged", { tool_name: "anagram_solver" });
  api.setConsent("granted");
  api.setConsent("granted");
  assert.equal(initializeGA4(win, id), api);
  assert.equal(win.document.scripts.length, 1);
  assert.equal(win.document.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${id}`);
  assert.equal(win.document.scripts[0].async, true);
  assert.equal(commands(win).filter(c => c[0] === "config").length, 1);
  const config = commands(win).find(c => c[0] === "config")[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.deepEqual(events(win).map(c => c[1]), ["page_view"]);
  assert.doesNotMatch(JSON.stringify(commands(win)), /PRIVATE/);
  for (const c of commands(win).filter(c => c[0] === "consent")) {
    for (const field of ["ad_storage", "ad_user_data", "ad_personalization"]) assert.equal(c[2][field], "denied");
  }
  win.close();
});
test("stored choices restore; corrupted/version/extra-field storage fails closed", () => {
  for (const choice of ["granted", "denied"]) {
    const win = fixture("/", JSON.stringify({version:1, analytics:choice}));
    const api = initializeGA4(win, id);
    assert.equal(api.choice, choice);
    assert.equal(win.document.scripts.length, 1);
    assert.equal(commands(win).filter(c => c[0] === "consent").at(-1)[2].analytics_storage, choice);
    win.close();
  }
  for (const raw of ["{", "null", "[]", "true", '{"version":2,"analytics":"granted"}', '{"version":1,"analytics":"yes"}', '{"version":1,"analytics":"granted","identity":"x"}']) {
    assert.equal(parseConsent(raw), null);
    const win = fixture("/", raw);
    assert.equal(initializeGA4(win, id).choice, null);
    assert.equal(win.document.scripts.length, 1);
    assert.equal(commands(win).filter(c => c[0] === "consent").at(-1)[2].analytics_storage, "denied");
    win.close();
  }
});
test("storage read/write denial and quota errors cannot prevent current-page consent or site use", () => {
  for (const storage of [null, { getItem(){throw Error("denied");}, setItem(){throw Error("quota");} }]) {
    const win = fixture();
    Object.defineProperty(win, "localStorage", {get(){ if (!storage) throw Error("denied"); return storage; }});
    const api = initializeGA4(win, id);
    assert.doesNotThrow(() => api.setConsent("granted"));
    assert.equal(api.choice, "granted");
    assert.doesNotThrow(() => api.setConsent("denied"));
    assert.equal(win.document.querySelector("main").textContent, "Working tool");
    win.close();
  }
});
test("revocation immediately denies storage, purges queued product events, retains page measurement", () => {
  const win = fixture();
  const api = initializeGA4(win, id);
  api.setConsent("granted");
  emit(win, "daily_challenge_start", daily);
  api.setConsent("denied");
  assert.equal(win[`ga-disable-${id}`], undefined);
  assert.equal(commands(win).at(-1)[2].analytics_storage, "denied");
  assert.deepEqual(events(win).map(c => c[1]), ["page_view"]);
  emit(win, "daily_challenge_complete", daily);
  assert.deepEqual(events(win).map(c => c[1]), ["page_view"]);
  assert.equal(readConsent(win), "denied");
  api.setConsent("granted");
  assert.equal(win.document.scripts.length, 1);
  assert.deepEqual(events(win).map(c => c[1]), ["page_view"], "regrant does not replay activity or duplicate page view");
  win.close();
});
test("another tab revoking or clearing preferences returns storage to denied", () => {
  const win = fixture();
  const api = initializeGA4(win, id);
  for (const key of [CONSENT_KEY, null]) {
    api.setConsent("granted");
    win.dispatchEvent(new win.StorageEvent("storage", {key, newValue:null}));
    assert.equal(api.choice, "denied");
    assert.equal(commands(win).at(-1)[2].analytics_storage, "denied");
    assert.equal(win[`ga-disable-${id}`], undefined);
  }
  win.close();
});
test("blocked script never breaks consent/product event dispatch", () => {
  const win = fixture();
  assert.doesNotThrow(() => {
    const api = initializeGA4(win, id);
    api.setConsent("granted");
    win.document.scripts[0].dispatchEvent(new win.Event("error"));
    emit(win, "tool_engaged", {tool_name:"word_unscrambler"});
    api.setConsent("denied");
  });
  win.close();
});
test("failed consent-default command prevents tag insertion and leaves the site functional", () => {
  const win = fixture();
  win.gtag = () => { throw Error("blocked"); };
  assert.equal(initializeGA4(win, id), null);
  assert.equal(win.document.scripts.length, 0);
  assert.equal(win.document.querySelector("main").textContent, "Working tool");
  win.close();
});
test("all required pages send one explicit sanitized page view per document", () => {
  for (const path of ["/", "/anagram-solver/", "/scrabble-word-finder/", "/daily-word-challenge/", "/daily-word-challenge/2026-09-18/", "/privacy/", "/advertising/"]) {
    const win = fixture(`${path}?query=PRIVATE#PRIVATE`);
    const api = initializeGA4(win, id);
    assert.equal(events(win).length, 1, "no-choice page view");
    for (const choice of ["denied", "granted", "denied", "granted"]) {
      api.setConsent(choice);
      assert.equal(events(win).length, 1, "consent changes must not add a page view");
    }
    initializeGA4(win, id);
    assert.equal(events(win).filter(c => c[1] === "page_view").length, 1);
    assert.equal(events(win)[0][2].page_location, `https://wordcabin.com${path}`);
    assert.equal(events(win)[0][2].page_referrer, "");
    assert.doesNotMatch(JSON.stringify(events(win)), /PRIVATE/);
    win.close();
  }
  assert.equal(pageProperties("/arbitrary-user-text/"), null);
  const unknown = fixture("/arbitrary-user-text/", JSON.stringify({version:1,analytics:"granted"}));
  assert.equal(initializeGA4(unknown, id), null);
  assert.equal(unknown.document.scripts.length, 0);
  assert.equal(unknown.dataLayer, undefined);
  unknown.close();
});
test("event/property AND value allowlists reject arbitrary text, guesses, answers and unknown names", () => {
  const win = fixture();
  initializeGA4(win, id).setConsent("granted");
  const prohibited = {guess:"PRIVATE", answer:"PRIVATE", letters:"PRIVATE", solution:"PRIVATE", filters:"PRIVATE", email:"PRIVATE", user_id:"PRIVATE", localStorage:"PRIVATE"};
  for (const name of ["daily_challenge_view", "daily_challenge_start", "daily_challenge_complete", "daily_challenge_failed", "daily_challenge_navigation"]) {
    emit(win, name, {...daily, ...prohibited, direction:"next", failureStatus:true});
    assert.ok(events(win).some(c => c[1] === name));
  }
  for (const name of ["daily_challenge_guess", "daily_challenge_archive_view", "unknown", "page_view"]) {
    assert.equal(safeEvent({name, properties:daily}), null);
  }
  assert.equal(safeEvent({name:"tool_engaged", properties:{tool_name:"PRIVATE"}}), null);
  assert.equal(safeEvent({name:"daily_challenge_view", properties:{...daily, challengeId:"PRIVATE"}}), null);
  const sanitized = safeEvent({name:"daily_challenge_view", properties:{...daily, difficulty:"PRIVATE", attemptNumber:"PRIVATE", direction:"PRIVATE", completionStatus:"PRIVATE"}});
  assert.deepEqual(sanitized.properties, {challengeId:daily.challengeId, challengeDate:daily.challengeDate});
  assert.doesNotMatch(JSON.stringify(events(win)), /PRIVATE/);
  assert.equal(safeEvent(null), null);
  assert.equal(safeEvent({name:"tool_engaged", properties:[]}), null);
  win.close();
});
test("vendor-neutral core engagement emits once per instance, no keystroke noise and correct tool names", () => {
  const win = fixture();
  const seen = [];
  win.addEventListener(ANALYTICS_EVENT, e => seen.push(e.detail));
  for (const mode of Object.keys(TOOL_NAMES)) {
    const engage = createToolEngagement(mode, win);
    engage(false); engage(false);
    const before = seen.length;
    engage(true); engage(true); engage(false); engage(true);
    assert.equal(seen.length, before + 1);
    assert.deepEqual(seen.at(-1), {name:"tool_engaged", properties:{tool_name:TOOL_NAMES[mode]}});
  }
  win.close();
});
test("duplicate daily/tool signals are bounded per document", () => {
  const win = fixture();
  initializeGA4(win, id).setConsent("granted");
  for (let n = 0; n < 3; n++) {
    emit(win, "daily_challenge_complete", daily);
    emit(win, "tool_engaged", {tool_name:"anagram_solver"});
  }
  assert.equal(events(win).filter(c => c[1] === "daily_challenge_complete").length, 1);
  assert.equal(events(win).filter(c => c[1] === "tool_engaged").length, 1);
  win.close();
});

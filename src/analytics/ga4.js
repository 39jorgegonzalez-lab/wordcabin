import { ANALYTICS_EVENT, safeEvent } from "./events.js";
import { CONSENT_KEY, parseConsent, readConsent, saveConsent } from "./consent.js";

export const validMeasurementId = value => typeof value === "string" && /^G-[A-Z0-9]{10}$/.test(value);
const denied = Object.freeze({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
const titles = {
  "/": "Word Unscrambler | WordCabin",
  "/word-unscrambler/": "Word Unscrambler Guide | WordCabin",
  "/anagram-solver/": "Anagram Solver | WordCabin",
  "/scrabble-word-finder/": "Tile-Game Word Finder | WordCabin",
  "/daily-word-challenge/": "Daily Word Challenge | WordCabin",
  "/privacy/": "Privacy | WordCabin",
  "/advertising/": "Advertising | WordCabin",
};
export function pageProperties(pathname) {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const daily = /^\/daily-word-challenge\/\d{4}-\d{2}-\d{2}\/$/.test(path);
  if (!Object.hasOwn(titles, path) && !daily) return null;
  return {
    page_location: `https://wordcabin.com${path}`,
    page_title: titles[path] || `Daily Word Challenge ${path.split("/")[2]} | WordCabin`,
    page_referrer: "",
  };
}

// One instance per document. Existing navigation uses full document loads.
export function initializeGA4(win, measurementId) {
  if (!validMeasurementId(measurementId)) return null;
  const page = pageProperties(win.location.pathname);
  if (!page) return null;
  if (win.__wordcabinGA4) return win.__wordcabinGA4;
  let choice = readConsent(win);
  let configured = false;
  let pageSent = false;
  const seen = new Set();
  const disableKey = `ga-disable-${measurementId}`;
  win[disableKey] = true;
  win.dataLayer = win.dataLayer || [];
  win.gtag = win.gtag || function () { win.dataLayer.push(arguments); };
  const command = (...args) => { try { win.gtag(...args); } catch { /* Noncritical. */ } };
  command("consent", "default", { ...denied });

  function enable() {
    win[disableKey] = false;
    command("consent", "update", { ...denied, analytics_storage: "granted" });
    if (!configured) {
      configured = true;
      command("js", new Date());
      command("config", measurementId, {
        send_page_view: false, allow_google_signals: false,
        allow_ad_personalization_signals: false, ignore_referrer: true,
        ...page,
      });
      try { if (!win.document.querySelector("script[data-wordcabin-ga4]")) {
        const script = win.document.createElement("script");
        script.async = true;
        script.dataset.wordcabinGa4 = "true";
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        win.document.head.appendChild(script);
      } } catch { /* Script blocking must not interrupt the preference UI. */ }
    }
    if (!pageSent && page) {
      pageSent = true;
      command("event", "page_view", { ...page, send_to: measurementId });
    }
  }
  function apply(value, persist = true) {
    choice = value === "granted" ? "granted" : "denied";
    // Disable synchronously, before the queued consent update can be processed.
    win[disableKey] = choice !== "granted";
    if (persist) saveConsent(win, choice);
    if (choice === "granted") enable();
    else {
      // Remove events still waiting for a blocked/slow script. Never replay them.
      for (let i = win.dataLayer.length - 1; i >= 0; i--) {
        if (win.dataLayer[i]?.[0] === "event") win.dataLayer.splice(i, 1);
      }
      command("consent", "update", { ...denied });
    }
  }
  win.addEventListener(ANALYTICS_EVENT, event => {
    if (choice !== "granted" || !page) return;
    const safe = safeEvent(event.detail);
    if (!safe) return;
    const key = `${safe.name}:${safe.properties.challengeId || safe.properties.tool_name}`;
    if (["tool_engaged", "daily_challenge_view", "daily_challenge_start", "daily_challenge_complete", "daily_challenge_failed"].includes(safe.name)) {
      if (seen.has(key)) return;
      seen.add(key);
    }
    command("event", safe.name, { ...safe.properties, ...page, send_to: measurementId });
  });
  win.addEventListener("storage", event => {
    if (event.key === CONSENT_KEY || event.key === null) apply(parseConsent(event.newValue) || "denied", false);
  });
  const api = { get choice() { return choice; }, setConsent: apply };
  win.__wordcabinGA4 = api;
  if (choice === "granted") enable();
  return api;
}

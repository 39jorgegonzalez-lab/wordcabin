import { initializeGA4 } from "./ga4.js";
import "./consent.css";

export function mountAnalytics(win, id) {
  try {
    const api = initializeGA4(win, id);
    if (!api || win.document.getElementById("analytics-preferences")) return api;
    const doc = win.document;
    const panel = doc.createElement("section");
    panel.id = "analytics-preferences";
    panel.className = "analyticsConsent";
    panel.setAttribute("aria-labelledby", "analytics-heading");
    panel.hidden = api.choice !== null;
    panel.innerHTML = '<div><h2 id="analytics-heading">Analytics preferences</h2><p>Allow Google Analytics cookies and tool-usage measurement? If you decline, Google may still receive limited cookieless page signals. Your letters and answers are not sent as analytics events. The tools work either way. <a href="/privacy/">Privacy</a></p><p class="analyticsStatus" role="status"></p></div><div class="analyticsChoices"><button type="button" data-choice="granted">Allow analytics</button><button type="button" data-choice="denied">Decline</button></div>';
    const footer = doc.createElement("div");
    footer.className = "analyticsFooter";
    const reopen = doc.createElement("button");
    reopen.type = "button";
    reopen.textContent = "Analytics preferences";
    reopen.setAttribute("aria-controls", panel.id);
    reopen.addEventListener("click", () => {
      panel.hidden = false;
      panel.querySelector(".analyticsStatus").textContent = `Analytics currently ${api.choice === "granted" ? "allowed" : "declined"}.`;
      panel.querySelector("button").focus();
    });
    for (const button of panel.querySelectorAll("button")) button.addEventListener("click", () => {
      api.setConsent(button.dataset.choice);
      panel.hidden = true;
      reopen.focus({ preventScroll: true });
    });
    footer.append(reopen);
    doc.body.prepend(panel);
    doc.body.append(footer);
    return api;
  } catch { return null; }
}

if (typeof window !== "undefined") mountAnalytics(window, import.meta.env?.VITE_GA4_MEASUREMENT_ID);

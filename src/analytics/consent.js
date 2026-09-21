export const CONSENT_KEY = "wordcabin.analytics-consent.v1";
export function parseConsent(raw) {
  try {
    const value = JSON.parse(raw);
    return value?.version === 1 && Object.keys(value).length === 2
      && ["granted", "denied"].includes(value.analytics) ? value.analytics : null;
  } catch { return null; }
}
export function readConsent(win) {
  try { return parseConsent(win.localStorage.getItem(CONSENT_KEY)); } catch { return null; }
}
export function saveConsent(win, analytics) {
  if (!["granted", "denied"].includes(analytics)) return false;
  try {
    win.localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, analytics }));
    return true;
  } catch { return false; }
}

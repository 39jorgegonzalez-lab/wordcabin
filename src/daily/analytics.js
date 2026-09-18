export const DAILY_ANALYTICS_EVENT = "wordcabin:analytics";
export const DAILY_EVENT_NAMES = Object.freeze([
  "daily_challenge_view",
  "daily_challenge_start",
  "daily_challenge_guess",
  "daily_challenge_complete",
  "daily_challenge_failed",
  "daily_challenge_archive_view",
  "daily_challenge_navigation",
]);

const ALLOWED_FIELDS = new Set([
  "challengeId",
  "challengeDate",
  "attemptNumber",
  "difficulty",
  "completionStatus",
  "failureStatus",
  "direction",
]);

export function sanitizeAnalyticsDetail(name, properties = {}) {
  if (!DAILY_EVENT_NAMES.includes(name)) throw new TypeError(`Unsupported daily analytics event: ${name}`);
  const detail = { name, properties: {} };
  for (const [key, value] of Object.entries(properties)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value)) detail.properties[key] = value;
  }
  return detail;
}

export function emitDailyEvent(name, properties = {}, target = globalThis.window) {
  const detail = sanitizeAnalyticsDetail(name, properties);
  if (target?.dispatchEvent && typeof globalThis.CustomEvent === "function") {
    target.dispatchEvent(new CustomEvent(DAILY_ANALYTICS_EVENT, { detail }));
  }
  return detail;
}

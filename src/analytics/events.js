export const ANALYTICS_EVENT = "wordcabin:analytics";
export const TOOL_NAMES = Object.freeze({
  unscrambler: "word_unscrambler",
  anagram: "anagram_solver",
  "tile-game": "tile_game_word_finder",
});

// Only a boolean crosses the product/measurement boundary; never input text.
export function createToolEngagement(mode, target = globalThis.window) {
  let engaged = false;
  return (hasValidResults) => {
    if (engaged || !hasValidResults || !Object.hasOwn(TOOL_NAMES, mode)) return;
    engaged = true;
    try {
      target?.dispatchEvent(new target.CustomEvent(ANALYTICS_EVENT, {
        detail: { name: "tool_engaged", properties: { tool_name: TOOL_NAMES[mode] } },
      }));
    } catch { /* Measurement never blocks the tool. */ }
  };
}

const dailyNames = new Set([
  "daily_challenge_view", "daily_challenge_start", "daily_challenge_complete",
  "daily_challenge_failed", "daily_challenge_navigation",
]);
const date = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const fields = {
  challengeId: value => typeof value === "string" && value.startsWith("daily-") && date(value.slice(6)),
  challengeDate: date,
  difficulty: value => ["easy", "medium", "hard"].includes(value),
  attemptNumber: value => Number.isInteger(value) && value >= 1 && value <= 10,
  completionStatus: value => typeof value === "boolean",
  failureStatus: value => typeof value === "boolean",
  direction: value => ["previous", "next"].includes(value),
};

export function safeEvent(detail) {
  if (!detail || typeof detail !== "object") return null;
  const { name, properties } = detail;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;
  if (name === "tool_engaged") {
    return Object.values(TOOL_NAMES).includes(properties.tool_name)
      ? { name, properties: { tool_name: properties.tool_name } } : null;
  }
  if (!dailyNames.has(name)) return null;
  const safe = {};
  for (const [key, valid] of Object.entries(fields)) {
    if (valid(properties[key])) safe[key] = properties[key];
  }
  if (!safe.challengeId || !safe.challengeDate || safe.challengeId !== `daily-${safe.challengeDate}`) return null;
  return { name, properties: safe };
}

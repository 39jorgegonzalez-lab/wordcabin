import assert from "node:assert/strict";

import { DAILY_CHALLENGES } from "./challenges.js";
import { createGameState, replayGame, submitGuess } from "./game-reducer.js";
import {
  DAILY_STORAGE_KEY,
  emptyDailyProgress,
  readDailyProgress,
  recordCompletion,
  sanitizeDailyProgress,
  writeDailyProgress,
} from "./storage.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key),
  };
}

const challenge = DAILY_CHALLENGES[0];
const ids = DAILY_CHALLENGES.map((entry) => entry.id);
assert.deepEqual(readDailyProgress(memoryStorage(), ids), emptyDailyProgress());
assert.deepEqual(readDailyProgress(memoryStorage({ [DAILY_STORAGE_KEY]: "not json" }), ids), emptyDailyProgress());
assert.deepEqual(
  readDailyProgress(memoryStorage({ [DAILY_STORAGE_KEY]: JSON.stringify({ version: 99, completions: {} }) }), ids),
  emptyDailyProgress(),
);
assert.deepEqual(readDailyProgress({ getItem: () => { throw new Error("denied"); } }, ids), emptyDailyProgress());
console.log("PASS: missing, corrupted, unsupported-version, and denied storage reads fail safely");

let completedState = createGameState(challenge);
completedState = submitGuess(completedState, challenge, challenge.answer);
const completedAt = new Date("2026-09-18T15:00:00Z");
const progress = recordCompletion(emptyDailyProgress(), challenge, completedState, completedAt);
assert.equal(progress.completions[challenge.id].attempts, 1);
assert.equal(progress.completions[challenge.id].completedAt, completedAt.toISOString());
const storage = memoryStorage();
assert.equal(writeDailyProgress(progress, storage), true);
assert.deepEqual(readDailyProgress(storage, ids), progress);
assert.equal(writeDailyProgress(progress, { setItem: () => { throw new Error("quota"); } }), false);
console.log("PASS: completion persistence and quota/write failures are safe");

const laterState = { ...completedState, attempts: ["aster", challenge.answer] };
const preserved = recordCompletion(progress, challenge, laterState, new Date("2026-09-19T15:00:00Z"));
assert.strictEqual(preserved, progress);
const replaySolved = submitGuess(replayGame(challenge), challenge, challenge.answer);
assert.strictEqual(recordCompletion(progress, challenge, replaySolved), progress);
console.log("PASS: original completion is immutable and replay cannot alter it");

const malformed = sanitizeDailyProgress({
  version: 1,
  completions: {
    [challenge.id]: { completedAt: "invalid", attempts: 0, solution: "" },
    "daily-2099-01-01": { completedAt: completedAt.toISOString(), attempts: 2, solution: "future" },
  },
}, ids);
assert.deepEqual(malformed, emptyDailyProgress());
console.log("PASS: malformed and unknown completion objects are rejected");
console.log("=== DAILY_STORAGE_TESTS_COMPLETE ===");

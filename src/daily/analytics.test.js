import assert from "node:assert/strict";

import { DAILY_EVENT_NAMES, emitDailyEvent, sanitizeAnalyticsDetail } from "./analytics.js";

for (const name of DAILY_EVENT_NAMES) {
  const detail = sanitizeAnalyticsDetail(name, {
    challengeId: "daily-2026-09-18",
    challengeDate: "2026-09-18",
    attemptNumber: 2,
    difficulty: "easy",
    completionStatus: true,
    failureStatus: false,
    direction: "next",
    guess: "secret",
    answer: "secret",
    clueAnswer: "secret",
    localStorage: "secret",
    userId: "secret",
  });
  assert.equal(detail.name, name);
  for (const forbidden of ["guess", "answer", "clueAnswer", "localStorage", "userId"]) {
    assert.equal(Object.hasOwn(detail.properties, forbidden), false);
  }
}
assert.throws(() => sanitizeAnalyticsDetail("unknown_event", {}), /Unsupported/);
const detail = emitDailyEvent("daily_challenge_view", { challengeId: "daily-2026-09-18", guess: "hidden" }, null);
assert.deepEqual(detail.properties, { challengeId: "daily-2026-09-18" });
console.log("PASS: analytics event names, field allowlist, and prohibited-data exclusion");
console.log("=== DAILY_ANALYTICS_TESTS_COMPLETE ===");

import assert from "node:assert/strict";

import { WORDS } from "../data/words.js";
import { DAILY_CHALLENGES } from "./challenges.js";
import {
  bogotaDateFromInstant,
  computeStreaks,
  findChallengeByPath,
  getChallengeNavigation,
  parseCalendarDate,
  selectTodayOrLatest,
  validateChallengeDataset,
} from "./challenge-model.js";

const clone = () => structuredClone(DAILY_CHALLENGES);
const validate = (challenges, options = {}) =>
  validateChallengeDataset(challenges, WORDS, { canonicalDate: "2026-09-18", ...options });
const expectFailure = (mutate, pattern) => {
  const challenges = clone();
  mutate(challenges);
  const result = validate(challenges);
  assert.equal(result.passed, false);
  assert.match(result.errors.join("\n"), pattern);
};

const baseline = validate(clone());
assert.equal(baseline.passed, true, baseline.errors.join("\n"));
assert.equal(baseline.inventory.futureCount, 6);
assert.equal(baseline.warnings.length, 1);
console.log("PASS: challenge schema, dictionary membership, exhaustive anagrams, dates, and inventory warning");

expectFailure((items) => { items[1].id = items[0].id; }, /duplicates id/);
expectFailure((items) => { items[1].date = items[0].date; items[1].id = `daily-${items[0].date}`; }, /duplicates date/);
expectFailure((items) => { items[1].answer = items[0].answer; }, /duplicates answer/);
expectFailure((items) => { items[1].answer = "tears"; items[1].letters = "aerst"; items[1].acceptedAnagrams = items[0].acceptedAnagrams; }, /duplicates a letter signature/);
expectFailure((items) => { items[0].date = "2026-02-30"; items[0].id = "daily-2026-02-30"; }, /invalid publication date/);
expectFailure((items) => { items[0].date = "09-18-2026"; items[0].id = "daily-09-18-2026"; }, /invalid publication date|malformed id/);
expectFailure((items) => { items[0].id = "challenge-1"; }, /malformed id/);
expectFailure((items) => { items[0].answer = "zzzzword"; }, /absent from the production dictionary/);
expectFailure((items) => { items[0].letters = "abcde"; }, /do not match the answer multiset/);
expectFailure((items) => { items[0].letters = items[0].answer; }, /displays the answer in sequence/);
expectFailure((items) => { items[0].clue = `Please ${items[0].answer} at this clue.`; }, /clue contains the answer/);
expectFailure((items) => { items[0].difficulty = "impossible"; }, /unsupported difficulty/);
expectFailure((items) => { items[0].maxAttempts = 99; }, /invalid attempt limit/);
expectFailure((items) => { items[0].acceptedAnagrams = items[0].acceptedAnagrams.slice(1); }, /not exhaustive|omit the target/);
expectFailure((items) => { items[0].acceptedAnagrams[0] = "zzzzz"; }, /absent from the production dictionary|different letters|not exhaustive/);
expectFailure((items) => { items[2].date = "2026-09-22"; items[2].id = "daily-2026-09-22"; }, /contiguous|duplicates date/);
console.log("PASS: fail-closed duplicate, date, id, answer, letters, clue, difficulty, attempt, and anagram checks");

assert.equal(parseCalendarDate("2024-02-29")?.value, "2024-02-29");
assert.equal(parseCalendarDate("2025-02-29"), null);
assert.equal(parseCalendarDate("2026-2-01"), null);
assert.equal(
  bogotaDateFromInstant(new Date("2026-09-19T04:59:59.999Z")),
  "2026-09-18",
);
assert.equal(
  bogotaDateFromInstant(new Date("2026-09-19T05:00:00.000Z")),
  "2026-09-19",
);
const originalTimezone = process.env.TZ;
for (const timezone of ["Pacific/Kiritimati", "Pacific/Honolulu", "Asia/Tokyo"]) {
  process.env.TZ = timezone;
  assert.equal(
    bogotaDateFromInstant(new Date("2026-09-19T04:59:59.999Z")),
    "2026-09-18",
  );
}
process.env.TZ = originalTimezone;
console.log("PASS: canonical Bogotá midnight boundary and cross-visitor-timezone consistency");

const todaySelection = selectTodayOrLatest(DAILY_CHALLENGES, "2026-09-18");
assert.equal(todaySelection.challenge.id, "daily-2026-09-18");
assert.equal(todaySelection.isToday, true);
const latestSelection = selectTodayOrLatest(DAILY_CHALLENGES, "2026-09-26");
assert.equal(latestSelection.challenge.id, "daily-2026-09-24");
assert.equal(latestSelection.isToday, false);
assert.equal(selectTodayOrLatest(DAILY_CHALLENGES, "2026-09-17").challenge, null);
assert.equal(findChallengeByPath(DAILY_CHALLENGES, "/daily-word-challenge/2026-09-18/")?.id, "daily-2026-09-18");
assert.equal(findChallengeByPath(DAILY_CHALLENGES, "/daily-word-challenge/2026-99-99/"), null);
assert.equal(findChallengeByPath(DAILY_CHALLENGES, "/daily-word-challenge/not-a-date/"), null);
const firstNavigation = getChallengeNavigation(DAILY_CHALLENGES, DAILY_CHALLENGES[0]);
assert.equal(firstNavigation.previous, null);
assert.equal(firstNavigation.next.id, DAILY_CHALLENGES[1].id);
const lastNavigation = getChallengeNavigation(DAILY_CHALLENGES, DAILY_CHALLENGES.at(-1));
assert.equal(lastNavigation.previous.id, DAILY_CHALLENGES.at(-2).id);
assert.equal(lastNavigation.next, null);
console.log("PASS: deterministic ordering, lookup, previous/next boundaries, and today/latest fallback");

const streakChallenges = [18, 19, 20, 21].map((day) => ({ id: `daily-2026-09-${day}`, date: `2026-09-${day}` }));
const completion = (...days) => Object.fromEntries(days.map((day) => [`daily-2026-09-${day}`, { completedAt: "2026-09-21T12:00:00Z" }]));
assert.deepEqual(computeStreaks(streakChallenges, {}, "2026-09-21"), { current: 0, longest: 0 });
assert.deepEqual(computeStreaks(streakChallenges, completion(18), "2026-09-18"), { current: 1, longest: 1 });
assert.deepEqual(computeStreaks(streakChallenges, completion(18, 19, 21), "2026-09-21"), { current: 1, longest: 2 });
const missingDateChallenges = streakChallenges.filter((challenge) => challenge.date !== "2026-09-20");
assert.deepEqual(computeStreaks(missingDateChallenges, completion(21, 18, 19), "2026-09-21"), { current: 3, longest: 3 });
assert.deepEqual(computeStreaks(streakChallenges, completion(18, 20, 21), "2026-09-21"), { current: 2, longest: 2 });
console.log("PASS: current/longest streak, missed publication, missing date, first challenge, and out-of-order completion data");

const stocked = validateChallengeDataset(clone(), WORDS, { canonicalDate: "2026-09-17" });
assert.equal(stocked.inventory.futureCount, 7);
assert.equal(stocked.warnings.length, 0);
const depleted = validateChallengeDataset(clone(), WORDS, { canonicalDate: "2026-09-24" });
assert.equal(depleted.inventory.futureCount, 0);
assert.equal(depleted.warnings.length, 1);
console.log("PASS: challenge inventory depletion warning threshold");
console.log("=== DAILY_CHALLENGE_MODEL_TESTS_COMPLETE ===");

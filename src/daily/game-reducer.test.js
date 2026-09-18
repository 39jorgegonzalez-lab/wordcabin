import assert from "node:assert/strict";

import { DAILY_CHALLENGES } from "./challenges.js";
import { createGameState, replayGame, submitGuess } from "./game-reducer.js";

const challenge = DAILY_CHALLENGES[0];
const ready = createGameState(challenge);
assert.equal(ready.status, "ready");
assert.deepEqual(ready.attempts, []);
assert.equal(createGameState(null).status, "error");

for (const value of ["", "   "]) {
  const result = submitGuess(ready, challenge, value);
  assert.equal(result.feedback, "invalid");
  assert.equal(result.attempts.length, 0);
}
assert.match(submitGuess(ready, challenge, "sta!e").message, /A through Z/);
assert.match(submitGuess(ready, challenge, "star").message, /5-letter/);
assert.match(submitGuess(ready, challenge, "zzzzz").message, /displayed letter/);
assert.match(submitGuess(ready, challenge, "ertas").message, /no approved dictionary word/);
console.log("PASS: empty, whitespace, illegal, wrong-length, unbuildable, and nondictionary guesses");

const validWrong = submitGuess(ready, challenge, "aster");
assert.equal(validWrong.status, "playing");
assert.equal(validWrong.feedback, "valid-wrong");
assert.equal(validWrong.attempts.length, 1);
assert.equal(validWrong.message, "Valid word, but not the clue’s answer.");
const duplicate = submitGuess(validWrong, challenge, "aster");
assert.equal(duplicate.attempts.length, 1);
assert.match(duplicate.message, /already tried/);
const completed = submitGuess(validWrong, challenge, challenge.answer);
assert.equal(completed.status, "completed");
assert.equal(completed.attempts.length, 2);
assert.match(completed.message, /Solved in 2 attempts/);
assert.match(submitGuess(completed, challenge, "tears").message, /round has ended/);
console.log("PASS: valid-but-wrong, duplicate, correct answer, and post-completion behavior");

let failing = createGameState(challenge);
for (const guess of challenge.acceptedAnagrams.filter((word) => word !== challenge.answer).slice(0, challenge.maxAttempts)) {
  failing = submitGuess(failing, challenge, guess);
}
assert.equal(failing.status, "failed");
assert.match(failing.message, new RegExp(`answer was ${challenge.answer}`));
assert.match(submitGuess(failing, challenge, challenge.answer).message, /round has ended/);
console.log("PASS: maximum-attempt failure reveals the target immediately");

const replay = replayGame(challenge);
assert.equal(replay.status, "replay");
assert.equal(replay.replay, true);
const replaySolved = submitGuess(replay, challenge, challenge.answer);
assert.equal(replaySolved.status, "completed");
assert.equal(replaySolved.replay, true);
console.log("PASS: deterministic replay state preserves replay identity");
console.log("=== DAILY_GAME_REDUCER_TESTS_COMPLETE ===");

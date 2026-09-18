import assert from "node:assert/strict";
import { WORDS } from "../data/words.js";
import { canBuildWord, normalizeLetters, solveWords } from "../engine/solver.js";
import { solveTool, TOOL_MODES } from "./tool-modes.js";

const solve = (mode, letters, filters = {}) => solveTool({mode, letters, filters, dictionary: WORDS, minLength: 2, limit: 600});
const words = (result) => result.results.map(item => item.word);
const exact = solve("anagram", "LISTEN");
for (const word of ["enlist", "inlets", "listen", "silent", "tinsel"]) assert.ok(words(exact).includes(word), word);
assert.ok(exact.results.every(item => item.length === 6 && [...item.word].sort().join("") === "eilnst"));
assert.equal(new Set(words(exact)).size, exact.results.length);
assert.deepEqual(solve("anagram", "listen", { length: "3" }), exact, "exact mode cannot be overridden with a shorter length");
assert.deepEqual(solve("unscrambler", "listen"), solveWords({letters:"listen", dictionary:WORDS, minLength:2, limit:600}), "homepage behavior unchanged");
for (const mode of Object.keys(TOOL_MODES)) {
  assert.deepEqual(solve(mode, " LI-STEN 123 "), solve(mode, "listen"));
  for (const invalid of ["", " ", "123!", "a"]) assert.equal(solve(mode, invalid).results.length, 0);
  const result = solve(mode, "list?n");
  assert.ok(words(result).includes("listen"));
  assert.ok(result.results.every(item => canBuildWord(normalizeLetters("list?n"), item.word)));
  assert.equal(new Set(words(result)).size, result.results.length);
  assert.ok(solve(mode, "listen", {startsWith:"s", endsWith:"t", contains:"il"}).results.every(item => item.word.startsWith("s") && item.word.endsWith("t") && item.word.includes("il")));
}
assert.ok(solve("anagram", "list?n").results.every(item => item.length === 6));
const rack = solve("tile-game", "listen");
assert.ok(rack.results.some(item => item.length < 6));
assert.deepEqual(rack, solve("tile-game", "listen"), "deterministic order");
assert.ok(rack.results.every(item => canBuildWord("listen", item.word)));
for (let i=1; i<rack.results.length; i++) {
  const a=rack.results[i-1], b=rack.results[i];
  assert.ok(a.length > b.length || (a.length === b.length && a.score >= b.score));
}
assert.equal(solve("tile-game", "qu?z").results.find(item=>item.word === "quiz").score, 21, "blank i scores zero");
assert.equal(solve("tile-game", "quiz").results.find(item=>item.word === "quiz").score, 22);
assert.throws(()=>solve("unknown", "listen"), /Unknown solver mode/);
console.log("PASS: three shared modes, exact anagrams, normalization, invalid inputs, wildcards, filters, uniqueness, rack constraints, deterministic ranking and blank scoring");

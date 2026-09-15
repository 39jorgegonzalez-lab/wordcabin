import assert from "node:assert/strict";
import { evaluateCandidateWords } from "./candidate-evaluation.js";

const report = evaluateCandidateWords({
  candidateWords: ["a", "apple", "cat", "abcdefghijklmnop"],
  productionWords: [{ w: "apple" }, { w: "dog" }],
});

assert.equal(report.evaluationVersion, 1);
assert.equal(report.candidateWordCount, 4);
assert.equal(report.inProfileWordCount, 2);
assert.equal(report.outsideProfileWordCount, 2);
assert.equal(report.existingWordCount, 1);
assert.equal(report.novelWordCount, 1);
assert.equal(report.overlapPercentage, 50);
assert.deepEqual(report.sampleNovelWords, ["cat"]);
assert.equal(report.productionMutationAllowed, false);
assert.equal(report.promotionStatus, "not-evaluated-for-promotion");

assert.throws(
  () => evaluateCandidateWords({ candidateWords: null, productionWords: [] }),
  /requires candidateWords and productionWords arrays/,
);

console.log("PASS: candidate comparison and profile evaluation");
console.log("=== CANDIDATE_EVALUATION_TESTS_COMPLETE ===");

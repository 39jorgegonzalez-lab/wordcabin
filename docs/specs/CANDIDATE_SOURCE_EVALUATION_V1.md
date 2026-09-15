# Candidate Source Evaluation v1

**Status:** Implemented and test-covered

**Boundary:** Candidate analysis only; never production promotion

## Purpose

Evaluate a precisely identified lexical artifact without allowing candidate data to modify WordCabin's production dictionary.

## Required inputs

- a schema-valid source manifest;
- an explicit artifact ID declared by that manifest;
- pinned byte size and SHA-256 for every required artifact;
- a configured absolute source root;
- a unique lowercase build ID;
- a candidate-only requested use (`internal-analysis` or `internal-qa`).

## Gate order

1. Validate build configuration and manifest.
2. Resolve the exact artifact beneath the configured source root.
3. Reject lexical and real-path/symlink escapes.
4. Verify size and SHA-256 before parsing.
5. Evaluate license, allowed-use, profile, and attribution obligations.
6. Extract the explicitly selected artifact and bind extracted bytes back to the integrity result.
7. Normalize and run structural QA.
8. Compare the candidate with the immutable production dictionary baseline.
9. Write an immutable candidate artifact and auditable reports under candidate-only directories.

## Evaluation v1 report

`candidate-evaluation.json` records candidate size, general-anagram length eligibility, production overlap, novel-word count, length distribution, bounded samples, and an explicit `productionMutationAllowed: false` assertion. It intentionally does not claim semantic quality, safety approval, license approval for public use, or promotion eligibility.

## Outputs

- `tools/dictionary/output/candidates/<build-id>/candidate-words.txt`
- `tools/dictionary/reports/candidates/<build-id>/artifact-integrity.json`
- `source-eligibility.json`
- `extraction.json`
- `normalization.json`
- `candidate-qa.json`
- `candidate-evaluation.json`
- `build-summary.json`

Writes use exclusive-create behavior. Existing build IDs cannot be overwritten, and partial outputs are removed if a write fails.

## Production safety invariant

The candidate builder imports the production word list only as a comparison baseline. It does not import or call the production generator. Automated tests hash `src/data/words.js` before and after success and failure cases and require the hash to remain unchanged.

## Running the pipeline

Set `WORDCABIN_DICTIONARY_SOURCES` to the absolute source root, then run:

```text
npm run candidate:build -- --manifest <manifest.json> --artifact <artifact-id> --build <unique-build-id> --use internal-analysis
```

Promotion is deliberately outside v1 and requires a separately specified, reviewed, and tested production gate.

The legacy production builder also fails closed unless the exact production-write confirmation environment value is supplied. That confirmation is an operator safeguard, not a substitute for source approval.

# WORDCABIN Daily Engagement Engine — Phase 1

## Scope

Phase 1 adds one clue-driven Daily Word Challenge without changing the existing solver engine, production dictionary, candidate-source pipeline, advertising configuration, or analytics vendor configuration. It has no account, backend, email collection, authentication, or server synchronization.

The challenge asks a player to unscramble all displayed letters and identify the clue's intended target word within a limited number of valid attempts. A full-length production-dictionary anagram that is not the intended answer is explicitly treated as a valid-but-wrong attempt.

## Architecture

`src/main.jsx` is a small path-aware bootstrap. It dynamically imports `src/solver/SolverApp.jsx` for the homepage and solver experience, or `src/daily/DailyChallengeApp.jsx` for `/daily-word-challenge/` routes. The solver JSX was extracted with minimal functional change. The daily browser path does not import `src/data/words.js`.

Daily responsibilities are deliberately small:

- `challenges.js`: manually curated records;
- `challenge-model.js`: dates, Bogotá publication time, validation, lookup, ordering, navigation, and streaks;
- `game-reducer.js`: pure deterministic gameplay transitions;
- `storage.js`: versioned and defensive local completion storage;
- `analytics.js`: vendor-neutral, allowlisted browser events;
- `DailyPromo.jsx`: compact homepage discovery;
- `DailyChallengeApp.jsx`: archive and challenge UI;
- `daily.css`: route-specific responsive presentation.

## Route and indexing policy

- `/`: existing solver plus a compact discovery module.
- `/daily-word-challenge/`: indexable archive hub, self-canonical, included once in the sitemap.
- `/daily-word-challenge/YYYY-MM-DD/`: generated only for explicit records published by the build's canonical Bogotá date, self-canonical, `noindex,follow`, and excluded from the sitemap.
- Unknown, malformed, and unpublished dates have no generated static file and use normal hosting 404 behavior.

The dated pages are intentionally not indexed in Phase 1. They must not become programmatic SEO inventory without a separate content and search-quality review.

## Canonical publication timezone

The product timezone is `America/Bogota`. `bogotaDateFromInstant()` formats an absolute instant in that timezone through `Intl.DateTimeFormat`. Browser/device timezone is never used to decide which challenge is today. Explicit dated routes remain deterministic, and streaks operate on ordered published records.

## Challenge data format

Each record contains an explicit stable ID, publication date, target answer, shuffled letters, original clue, difficulty, attempt limit, and exhaustive production-dictionary anagrams:

```js
{
  id: "daily-2026-09-18",
  date: "2026-09-18",
  answer: "...",
  letters: "...",
  clue: "Original manually written clue.",
  difficulty: "easy",
  maxAttempts: 6,
  acceptedAnagrams: ["..."]
}
```

The stable ID is explicit even though its Phase 1 format is date-derived. Array position is never identity.

## Curation and validation

Add records manually to `src/daily/challenges.js` in contiguous publication-date order. Do not generate them from keywords, search queries, or arbitrary dates.

Before accepting a record:

1. Choose an answer already present in the production dictionary.
2. Write an original clue that does not contain the answer.
3. Shuffle every answer letter exactly once; do not display the answer sequence.
4. Identify every full-length production-dictionary word with the same letter signature.
5. Put that complete set in `acceptedAnagrams`.
6. Choose an attempt limit that can actually be exhausted by valid-but-wrong anagrams.
7. Run `npm run daily:validate` and `npm run test:daily`.

Validation fails closed for malformed IDs/dates, impossible dates, duplicates, noncontiguous dates, answer or signature reuse, dictionary absence, letter mismatch, answer-order display, clue spoilers, unsupported difficulty, invalid attempt limits, incomplete or invalid accepted-anagram sets, and other schema failures.

The Node validator may import `src/data/words.js`. Daily browser modules must not import it. Accepted anagrams are stored as a small curated runtime list and compared exhaustively against the production dictionary at build/test time.

## Inventory warning

Validation counts records dated after the canonical Bogotá publication date. Fewer than seven future unpublished records emits a prominent warning but does not fail Phase 1 builds.

Maintain at least seven future records whenever possible. When inventory expires:

- no nonexistent date is synthesized;
- no future route is generated;
- the archive retains published challenges;
- the homepage says **Latest challenge**, never **Today's challenge**, when no exact Bogotá-date record exists.

A newly dated record requires a verified rebuild to publish its static page. Phase 1 does not introduce a scheduler or production deployment automation.

## Gameplay semantics

Invalid input does not consume an attempt. A correctly constructed, full-length accepted dictionary anagram that is not the clue's target consumes an attempt and receives “Valid word, but not the clue’s answer.” The target completes the challenge. Exhausting all attempts reveals the target immediately in accessible status text.

Replay starts a fresh in-memory round, clearly labels replay mode, and never changes the original stored completion, completion timestamp, archive status, or streak.

## Local storage

Storage key: `wordcabin.daily.v1`

```json
{
  "version": 1,
  "completions": {
    "daily-YYYY-MM-DD": {
      "completedAt": "ISO timestamp",
      "attempts": 3,
      "solution": "target"
    }
  }
}
```

Only successful completion is persisted. Raw failed guesses are not stored after reload. Reads sanitize all fields and reject unsupported versions or malformed entries. Read denial, parse failure, and quota/write failure return a safe nonpersistent experience rather than crashing. Clearing browser storage clears progress. There is no account or server synchronization.

## Streak rules

Streaks count consecutive published challenge records, not unrepresented calendar days. If records exist for the 18th, 19th, and 21st, completing all three is a streak of three because no challenge existed on the 20th. Missing a record that was actually published breaks the run. Replay cannot create or extend a completion.

Current streak is the consecutive completed run ending at the latest published record. Longest streak is the largest completed run anywhere in published history.

## Analytics event contract

The feature dispatches `wordcabin:analytics` `CustomEvent` instances. It does not import or call a vendor.

Allowed event names:

- `daily_challenge_view`
- `daily_challenge_start`
- `daily_challenge_guess`
- `daily_challenge_complete`
- `daily_challenge_failed`
- `daily_challenge_archive_view`
- `daily_challenge_navigation`

Allowed properties are challenge ID/date, attempt number, difficulty, completion/failure status, and navigation direction. Guess text, answers, clue answers, local-storage content, and personal identifiers are excluded by an allowlist and tests.

## Build and static generation

`npm run build` performs:

1. fail-closed challenge/dictionary validation;
2. the normal Vite production build with a manifest;
3. static archive/date page generation into `dist`.

The generator reads the freshly emitted Vite `dist/index.html` shell and retains its actual hashed asset references. It never hardcodes a build hash. It verifies that every referenced asset exists before creating pages. Route tests re-check assets, internal links, metadata, sitemap policy, and manifest-level solver/dictionary isolation.

## Bundle isolation

The thin bootstrap dynamically selects one application. The solver module owns the large production dictionary import. The daily module owns only the seven curated records and accepted anagrams. Vite's manifest and route tests verify that the daily chunk has no static dependency on the solver/dictionary chunk.

## Rollback

Phase 1 is isolated on `daily-engagement-phase1`. Before any owner-authorized production merge, rollback is simply abandoning the feature branch. After a future merge, use `git revert <feature-commit>`; do not rewrite shared history. A future production rollback can promote the previously verified deployment or deploy the revert commit only with owner authorization.

Local `wordcabin.daily.v1` data becomes harmless orphaned browser storage after rollback and does not affect the solver.

## Known limitations

- Phase 1 contains exactly seven manually curated records and has no content scheduler.
- Publishing a newly available dated page requires a verified rebuild/deployment.
- Completion is browser/device local and does not synchronize.
- Clearing site storage removes progress.
- The answer exists client-side as part of the challenge application. This is a casual word game, not a security boundary. Do not claim that the answer is secret from users inspecting browser assets.
- Dated challenge pages remain `noindex,follow` and are intentionally absent from the sitemap.

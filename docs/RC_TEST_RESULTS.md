# V2 inventory candidate verification — November 2, 2026

Tested from preserved source in daily-inventory-v2-90, parent bab27aba9dfa9adef7b821657681cd784d929dcd. Original infrastructure branch/worktree preserved. No production deployment or settings changes. This is engineering evidence, not production/Preview acceptance.

Commands actually executed after corrections:

- npm ci — exit 0; 58 packages installed from lockfile.
- npm test — exit 0; solver, source-contract/artifact integrity, source eligibility, candidate QA/evaluation/build, production-write guards, site foundations, daily model/game/storage/events/pages/schedule/publication DOM, tool modes/UI, analytics and advertising.
- VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95 npm run build — exit 0; archive plus seven original static dated pages, two tools, static analytics assets and runtime shell.
- npm run test:routes — exit 0; 15 static HTML files; current assets and links; runtime date simulations through 2031 with actual build shell; 404/503; canonical/noindex/sitemap policy; one shared dictionary.
- npm audit --omit=dev — exit 0; found 0 vulnerabilities.
- git diff --check — exit 0.
- sha256sum src/data/words.js — cb9be5d9eae5c7427b134a1a90c3c9867a245d1f03dcc97f93c997e0e74b734b, identical to production baseline.

Node test runner reports 16 analytics and 6 advertising tests passing. Other suites use assertion scripts without an aggregate count; do not fabricate a combined total. Publication DOM test proves clock rollover and cross-tab updates, not pixel layout.

Daily eager JS: 75,746 gzip bytes (5,476 bytes above the preceding infrastructure candidate); dictionary remains one shared WordSolver chunk, not daily eager dependencies. No new runtime npm dependency. Existing large-dictionary and lucide module-directive warnings remain; npm also warns about environment http-proxy config. No test failures suppressed.

No changes to production dictionary, solver algorithm, original challenge data, GA4 adapter/ID/consent policy, robots or sitemap. Candidate removes build-date ceiling only with an on-demand dated-route function. Vercel buildCommand/framework/cleanUrls preserved. Ads remain disabled by configuration; certified CMP and account not activated.

Hosted/mobile/GA4 network/Realtime checks are not claimed by these results. See RC_OWNER_ACCEPTANCE.md and DAILY_PUBLICATION_RC.md for exact remaining gates and remaining acceptance gates. Search Console findings were retained without another paid connector request. No active alert delivery or actual Vercel rollback test is claimed.

## V2 inventory verification

The complete command sequence above was rerun for this candidate: npm ci, npm test, VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95 npm run build, npm run test:routes, npm audit --omit=dev. All exited 0. Inventory generator reproducibility and all 90 puzzle gameplay cases ran within npm test. Route tests exercised every new unique date with the current built asset shell.

Validated against 78,833 dictionary entries: 97 distinct puzzles, comprising seven unchanged originals and 90 new puzzles (30 easy, 40 medium, 20 hard). No duplicate IDs, targets, letter multisets, normalized puzzle signatures or clues. Accepted anagrams are exhaustive. November 2 America/Bogota schedule counts: seven previously published distinct puzzles, 90 unpublished; first V2 date November 3, 2026, last unique date January 31, 2027. Repeats begin February 1 and do not replenish stock. Counts describe candidate scheduling, never deployment.

An earlier development route assertion incorrectly matched an answer against the HTML attribute name rather than metadata values. It was corrected to inspect title and meta content values; all 90 dates passed. No failing safeguard was removed.

Dictionary before and after: cb9be5d9eae5c7427b134a1a90c3c9867a245d1f03dcc97f93c997e0e74b734b. Original challenges, solver engine, analytics modules, robots and sitemap have no changes relative to the preceding infrastructure candidate. Original dirty development worktree remains preserved.

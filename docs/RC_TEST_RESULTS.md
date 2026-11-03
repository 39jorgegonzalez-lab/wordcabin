# Isolated candidate verification — November 2, 2026

Tested from preserved source in infrastructure-closure-rc-v1, parent 4dbfeb6865e20cb00e069edfe2ff63016cddb19a. Original infrastructure branch/worktree preserved. No production deployment or settings changes. This is engineering evidence, not production/Preview acceptance.

Commands actually executed after corrections:

- npm ci — exit 0; 58 packages installed from lockfile.
- npm test — exit 0; solver, source-contract/artifact integrity, source eligibility, candidate QA/evaluation/build, production-write guards, site foundations, daily model/game/storage/events/pages/schedule/publication DOM, tool modes/UI, analytics and advertising.
- VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95 npm run build — exit 0; archive plus seven original static dated pages, two tools, static analytics assets and runtime shell.
- npm run test:routes — exit 0; 15 static HTML files; current assets and links; runtime date simulations through 2031 with actual build shell; 404/503; canonical/noindex/sitemap policy; one shared dictionary.
- npm audit --omit=dev — exit 0; found 0 vulnerabilities.
- git diff --check — exit 0.
- sha256sum src/data/words.js — cb9be5d9eae5c7427b134a1a90c3c9867a245d1f03dcc97f93c997e0e74b734b, identical to production baseline.

Node test runner reports 16 analytics and 6 advertising tests passing. Other suites use assertion scripts without an aggregate count; do not fabricate a combined total. Publication DOM test proves clock rollover and cross-tab updates, not pixel layout.

Daily eager JS: 70,270 gzip bytes; dictionary remains one shared WordSolver chunk, not daily eager dependencies. No new runtime npm dependency. Existing large-dictionary and lucide module-directive warnings remain; npm also warns about environment http-proxy config. No test failures suppressed.

No changes to production dictionary, solver algorithm, original challenge data, GA4 adapter/ID/consent policy, robots or sitemap. Candidate removes build-date ceiling only with an on-demand dated-route function. Vercel buildCommand/framework/cleanUrls preserved. Ads remain disabled by configuration; certified CMP and account not activated.

Hosted/mobile/GA4 network/Realtime checks are not claimed by these results. See RC_OWNER_ACCEPTANCE.md and DAILY_PUBLICATION_RC.md for exact remaining gates and product decision. Search Console findings were retained without another paid connector request. No active alert delivery or actual Vercel rollback test is claimed.

# V2 trailing-slash routing repair

Parent: 7d3a7db07bded98d1975bcac016d8703da566ef6. Development branch: daily-v2-routing-repair. No production release authorized.

Owner observed Vercel NOT_FOUND at /daily-word-challenge/2026-11-13/ on the exact parent Preview. Vercel's official @vercel/routing-utils 6.6.1 compiler reproduces the routing defect: the old source /daily-word-challenge/:date compiles to an end-anchored expression without a trailing slash. The canonical slash URL does not match. The date itself is valid and the handler serves it when called directly. cleanUrls transformations do not normalize this dated path or repair its mismatch.

The smallest repair adds one explicit slash-form rewrite before the existing no-slash rewrite. Both resolve to the same existing API handler/date parameter. Canonicals remain slash-terminated, with no added redirect or global trailingSlash setting. No gameplay, content, schedule, dictionary, analytics or advertising change.

The pinned compiler is a development-only test dependency. test:routing compiles the actual vercel.json (including cleanUrls/headers), proves the old failure, checks both date URL forms and route precedence, and exercises the actual handler over HTTP with the compiled destinations. Historical September 22–24, November 3/13, invalid/future dates, canonical/noindex/no-store, direct API, missing date, missing/invalid shell 503 and runtime-shell inclusion are covered. test:routes runs it after the production build.

These tests establish compiler and application behavior, not the private deployed route manifest or cloud function packaging. The old Preview's slash/no-slash/direct-API requests all encounter authentication from this environment. Owner evidence establishes its slash failure. Corrected Preview must be checked separately; do not label hosted acceptance PASS from local tests.

Hosted acceptance: verify homepage/archive; both November 13 URL forms; September 22–24 and November 3; current Bogotá date; tomorrow and invalid date 404; API date invocation. Expected dated responses: 200, current assets, slash self-canonical, noindex/follow and Cache-Control no-store. Invalid/unpublished dates should show the application's Challenge not found response (404), not a platform routing failure. Missing-shell 503 is tested by injection locally; do not damage hosted files to induce it.

After authenticated route acceptance, complete responsive UI, completion/refresh/replay and consent checks on this exact repair Preview. Production identity/rollback confirmation and separate owner release authorization remain required. Preserve prior owner screenshots; no broad Vercel integration or bypass requested.

Verification executed November 13, 2026 America/Bogota: npm ci; npm test; VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95 npm run build; npm run test:routes (including test:routing); npm audit --omit=dev; git diff --check. All exited 0; audit reports zero vulnerabilities. Existing dictionary chunk/module-directive/npm http-proxy warnings remain. Dictionary before/after SHA-256: cb9be5d9eae5c7427b134a1a90c3c9867a245d1f03dcc97f93c997e0e74b734b. Inventory: 97 total, 18 scheduled through November 13, 79 future distinct; January 31, 2027 last unique date. No schedule reset. These are candidate counts, not evidence of production publication.

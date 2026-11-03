# WordCabin Version 1 infrastructure closure review

Date: November 2, 2026, America/Bogota. Verdict: NOT YET COMPLETE; no defensible 100% claim.

## Baseline and deployment evidence

GitHub production branch seo-growth-pages-v1 is 7468e6f9d8c04e299cf58f9402f8842534f5d610. Backup remains 516111665a5d20f81fa88aeb6702368167599207. Fresh clone was clean. Repairs are isolated on infrastructure-closure-v1; production has not been modified by this review.

GitHub's Vercel deployment record identifies commit 7468e6f, environment Production, success, deployment URL wordcabin-1qrll20pi-39jorgegonzalez-7666s-projects.vercel.app (September 21). Its separate production_environment boolean is false, so that field is not used as proof. Live homepage JS and analytics JS/CSS matched the configured baseline build byte-for-byte. The public domain serves the approved GA4 code. Authenticated current Vercel settings/domain assignment and DNS account controls remain unverified.

HTTPS apex and WWW return 200; HTTP redirects to HTTPS. WWW remains a separate 200 endpoint rather than redirecting to apex; canonical tags select apex. HSTS observed. No certificate failure observed in browser/HTTP, but no independent certificate-chain audit. Static Vite/React site; no backend, database, server account system or scheduled content job in repository.

## Actual defects and repairs

1. Live homepage/archive advertise September 22–24 challenge routes, but all three return 404. Build-time static generation was frozen September 21 while browser date selection advanced. Repair embeds the build publication date as a browser ceiling, preserving Bogotá rules and curated-only routes. A new configured build generates all seven past dates. Deployment and live recheck still required.
2. Access to the localStorage property could throw outside the adapter's try/catch. Reproduced with a throwing property getter; repaired and regression-tested.
3. Stale-tab progress writes could replace other completions. Writer now merges latest stored completions, retaining original records; regression tests cover stale writes. Homepage/archive listen for storage changes. This is not server synchronization or a transactional multi-device system; perfectly simultaneous cross-process writes are not guaranteed atomic.
4. Archived puzzle heading falsely said “today’s”; replaced with date-neutral wording.
5. npm audit initially reported two high-severity affected packages: vite and source-map-js. Vite pinned to 8.3.5; source-map-js resolves 1.2.2. Audit after update: zero vulnerabilities. These findings concern build/development dependencies, not evidence of a compromised live static site.
6. Monetization documentation still referenced removed Plausible. Updated to GA4 and accurately described remaining advertising-consent integration.
7. Added read-only production HTTP smoke script and operations/recovery/90-day growth documentation.

No dictionary, solver algorithm, challenge answers/inventory, GA4 identifier, advertising activation, robots, sitemap or backup change.

## Verification executed

- `npm ci`: PASS, baseline and repaired dependency installation.
- `npm test`: PASS: existing solver, dictionary/source-contract/eligibility/candidate QA/evaluation/builder/path/write guards, site foundation, daily model/game/storage/analytics/pages, tool modes and DOM tests, analytics tests.
- Analytics runner: 16 tests, 16 passed, 0 failed; additional consent and replay DOM checks passed.
- `VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95 npm run build`: PASS.
- `npm run test:routes`: PASS, 15 built HTML files, current assets/internal links, canonical/index policies, single dictionary and daily isolation.
- `npm audit --omit=dev`: initial FAIL (2 high), repaired PASS (0).
- `git diff --check`: PASS.
- `sha256sum src/data/words.js`: before/after cb9be5d9eae5c7427b134a1a90c3c9867a245d1f03dcc97f93c997e0e74b734b.
- `node tools/operations/production-smoke.js`: FAIL 12/15 live routes; September 22, 23, 24 are 404. This is a real production gate, not suppressed.
- Unknown dated route /2099-01-01/ and arbitrary unknown path return real 404.

Warnings: no future challenge inventory; existing large dictionary chunk; upgraded bundler reports lucide “use client” directives in this client-only app; local npm proxy configuration warning. None is represented as a passed closure gate.

Daily eager JavaScript remains approximately 69.6 KB gzip, isolated from the approximately 2.02 MB raw / 251 KB gzip shared solver/dictionary chunk. Analytics is approximately 2.41 KB gzip plus 0.45 KB gzip CSS. No new runtime dependency. No field CWV or lab Lighthouse score was obtained; bundle measurements do not establish LCP/INP/CLS.

## Rendered and functional production observations

Cloud desktop browser: homepage, Anagram, Tile-Game, archive, September 18 puzzle, Privacy and Advertising inspected. No material desktop overlap/clipping observed. LISTEN gave 63 broad/rack results and 5 six-letter anagrams. No redundant submit button. Decline did not prevent use. September 18: STAR rejected with 6 attempts remaining; TEARS accepted as valid-but-wrong with 5 remaining; STARE completed in 2 attempts. Latest challenge link visibly reached Vercel 404.

Consent preferences reopened; displayed declined, allowed after explicit grant, then accepted withdrawal. This proves UI behavior, NOT a current network/cookie audit or GA4 Realtime receipt. Prior owner-approved Preview acceptance is retained; production Realtime is not inferred from it.

Current mobile/tablet and iPhone/Safari were not inspected in this review; previous owner mobile acceptance applies to the earlier release only. No WCAG certification claimed. Labels, status text and keyboard behaviors have automated coverage; a complete WCAG 2.2 AA assessment was not performed.

## Closure blockers and owner-access items

1. Repair release must pass Preview rendering and be owner-approved for production, then all live challenge routes must pass. Do not promote an unidentified or differently configured deployment.
2. Seven-record inventory expired September 24. Automatic recurring daily content is not implemented. Preserve curated-only architecture; decide an editorial replenishment/publication schedule or explicitly accept an archive-only product. Do not silently generate indefinite date pages or call a stale puzzle Today.
3. Production GA4 network/Realtime receipt and current mobile acceptance require actual evidence. No receiving GA4 report is accessible through the available connector.
4. GSC Wizard refuses all calls: subscription_required. Direct Search Console owner reports/exports are an alternative; purchasing is not required or authorized. Current indexing, query metrics and field CWV remain unverified, not zero.
5. Advertising remains off. Existing AdSlot is not an ad-consent integration. Network/CMP selection, owner business/contact information, provider identifiers and consent-aware serving tests remain required before ads. External approval/revenue alone are not blockers.
6. Operations/runbook and smoke script exist, but active uptime scheduling/alert delivery, authenticated hosting quotas and recovery/access settings are not verified. No paid monitor was added.

## Deliverables

- Production QA matrix: PRODUCTION_QA_MATRIX.md.
- Operations and recovery guide: OPERATIONS_RECOVERY.md.
- Growth plan: GROWTH_OPERATIONS_90_DAYS.md.
- Corrected monetization activation gates: MONETIZATION_READINESS.md.

Completion percentage is intentionally not invented from the earlier 85–90% estimate. The QA matrix records verified, failed and pending items. Final determination: WORDCABIN VERSION 1 — NOT YET COMPLETE. IDENTIFIED BLOCKERS REMAIN.

# WordCabin operations and recovery

Verified November 2, 2026 (America/Bogota). Repository: 39jorgegonzalez-lab/wordcabin. Vercel static hosting. Production branch seo-growth-pages-v1; historical backup backup-production-before-rebuild must remain at 516111665a5d20f81fa88aeb6702368167599207.

## Release

Use an isolated branch from freshly fetched production. Preserve production dictionary SHA-256 cb9be5d9eae5c7427b134a1a90c3c9867a245d1f03dcc97f93c997e0e74b734b. Run:

```
npm ci
npm test
VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95 npm run build
npm run test:routes
npm audit --omit=dev
git diff --check
sha256sum src/data/words.js
```

Inspect a non-production Preview. Production integration/promotion remains a separate owner-approved step. Confirm commit, source branch, Ready status, domain assignment and build variables. A ref or successful Preview status alone does not prove live identity.

Production GA4: VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95. No private analytics credential is needed. Keep AdSense variables blank until a separate consent-aware advertising launch. Build-time variable changes require a rebuild; promoting an artifact does not retroactively change its variables.

## Daily content and static publication

Seven curated records cover September 18–24, 2026; inventory is exhausted. Fallback must say Latest, never Today. No automatic content authoring or recurring game was authorized by the original Phase 1 architecture.

Dated HTML is generated only through the build's Bogotá date. The repair bounds browser discovery to the build date so an old deployment cannot advertise later unbuilt pages. Publishing future curated records requires a build after their publication date. An old build must not be assumed to publish them at midnight. New recurring content or scheduled publication needs a concrete editorial/release policy; adding seven more records alone does not solve perpetual operation.

## Monitoring

`node tools/operations/production-smoke.js` performs read-only checks of canonical routes and all published curated dates. Nonzero exit means investigate. Run after each deployment and from an approved daily scheduler. The script does not submit analytics or modify user data.

No active external uptime scheduler/alert recipient has been verified. GitHub scheduled workflows execute on the repository default branch (currently main, not production); do not silently change default branch or claim scheduling is active. Owner should enable a no-cost approved monitor for homepage and latest challenge with email alerts, or approve a default-branch workflow explicitly targeting production. Never place deploy tokens in source.

Monthly: dependency audit, solver/candidate guards, configured build and route checks; review Google reports and console errors. No server/database exists in this repository, so server rate limiting and database migrations are not applicable. Hosting plan/quota/billing and account recovery settings require authenticated owner review; no changes made.

## Recovery

1. Identify failing deployment and preserve evidence.
2. In Vercel, select the last known-good deployment and verify its commit, configuration and available daily routes before rollback. Obtain owner authorization where required. Do not assume the historical backup is the correct current rollback target.
3. Use Vercel rollback/promote controls for the verified artifact. Do not force-push or reset shared production history. Fix forward with a reviewed commit.
4. Repeat live smoke and consent checks. Record incident and restoration time.

Source is recoverable from GitHub; maintain an owner-controlled repository backup/export and account recovery methods. Browser-local daily progress is not server-backed: clearing storage loses it; rollback must retain existing schema. GA4 preferences use a separate versioned key. No server visitor database to restore.

## Access boundaries

Never request passwords or secrets in chat. Vercel authentication remains owner-assisted when unavailable. Network/Realtime verification requires actual observation, not adapter tests. Do not enable Enhanced Measurement, Google signals, User-ID, user-provided data or ads as part of routine maintenance.

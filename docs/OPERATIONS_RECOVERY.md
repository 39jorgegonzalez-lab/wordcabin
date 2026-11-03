# WordCabin operations and recovery

Verified November 2, 2026 (America/Bogota). Repository: 39jorgegonzalez-lab/wordcabin. Vercel static hosting plus the candidate’s read-only dated-challenge function (not yet production). Production branch seo-growth-pages-v1; historical backup backup-production-before-rebuild must remain at 516111665a5d20f81fa88aeb6702368167599207.

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

## Candidate daily publication (product approval pending)

See DAILY_PUBLICATION_RC.md. The candidate preserves September 18–24 exactly and retains later legacy practice mappings before November 3. Inventory V2 then provides 90 new unique puzzles, followed only if necessary by labeled 90-day repeats. The original static build-date ceiling is superseded only by the candidate runtime function. No cron or daily rebuild is required, but actual Vercel rewrite/function packaging must pass Preview acceptance before release.

## Monitoring

`node tools/operations/production-smoke.js` performs read-only checks of canonical routes and all published curated dates. Nonzero exit means investigate. Run after each deployment and from an approved daily scheduler. The script does not submit analytics or modify user data.

No active external uptime scheduler/alert recipient has been verified. GitHub scheduled workflows execute on the repository default branch (currently main, not production); do not silently change default branch or claim scheduling is active. Owner should enable a no-cost approved monitor for homepage and latest challenge with email alerts, or approve a default-branch workflow explicitly targeting production. Never place deploy tokens in source.

Monthly: dependency audit, solver/candidate guards, configured build and route checks; review Google reports and console errors. The candidate adds one stateless read-only Node function, with no database, credentials or writes. Monitor its errors, invocation quotas and availability; database migrations remain inapplicable. Hosting plan/quota/billing and account recovery settings require authenticated owner review; no changes made.

## Recovery

1. Identify failing deployment and preserve evidence.
2. In Vercel, select the last known-good deployment and verify its commit, configuration and available daily routes before rollback. Obtain owner authorization where required. Do not assume the historical backup is the correct current rollback target.
3. Use Vercel rollback/promote controls for the verified artifact. Do not force-push or reset shared production history. Fix forward with a reviewed commit.
4. Repeat live smoke and consent checks. Record incident and restoration time.

Source is recoverable from GitHub; maintain an owner-controlled repository backup/export and account recovery methods. Browser-local daily progress is not server-backed: clearing storage loses it; rollback must retain existing schema. GA4 preferences use a separate versioned key. No server visitor database to restore.

## Access boundaries

Never request passwords or secrets in chat. Vercel authentication remains owner-assisted when unavailable. Network/Realtime verification requires actual observation, not adapter tests. Do not enable Enhanced Measurement, Google signals, User-ID, user-provided data or ads as part of routine maintenance.

## Verified access limits and rollback target

On November 2, GitHub reported production branch `protected: false` with required status-check enforcement off. Do not describe the branch as technically protected; the backup is protected by the owner’s operating restriction, not a verified GitHub ruleset. Owner should review Settings → Rules → Rulesets / Branches for production and backup, preventing deletion and force updates while preserving a deliberate release path. No settings changed.

The known source rollback baseline is 7468e6f9d8c04e299cf58f9402f8842534f5d610. Exact currently assigned Vercel deployment is still owner-evidence pending. Before release, record that deployment URL/ID and confirm Vercel’s Rollback option is available; do not click it as a test. A full restoration is not claimed rehearsed. Source snapshot preservation and dictionary checks were executed; those do not establish hosting rollback success.

Owner-only checks, consolidated with release review: Vercel project Git/production branch, build environment scope, failure-notification recipient, last-good rollback availability, and function limits. GitHub source backup does not provide a runtime availability monitor. No external alert delivery has been verified. Keep a daily read-only route check and act on nonzero exit; do not claim alerts are active merely because the script exists.

No Vercel plugin, password, token, or session-cookie access is requested. The owner declined the broad-permission integration.

Inventory warning: a daily ChatGPT condition watch is enabled for distinct stock below 30, with milestone notifications at 29/14/7/0. Its first delivery remains unverified; it is not a production uptime monitor. See DAILY_PUBLICATION_RC.md.

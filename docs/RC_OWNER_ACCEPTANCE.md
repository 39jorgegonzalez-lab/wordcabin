# Controlled candidate acceptance — November 2, 2026

No production release authorization. Vercel plugin declined; do not request it or credentials. This candidate is not production-ready until the checks below are satisfied.

## Before production authorization (one consolidated owner session)

1. Identity, 1–2 minutes: Vercel → WordCabin → Deployments → September 21 “feat: switch GA4 to advanced consent mode” marked Production. Capture one detail view showing deployment ID/URL, Ready/Production, source branch/full SHA or commit link, and assigned domains. Existing domain-list screenshots are accepted and need not be repeated. Request only another detail view if the live alias is not shown. GitHub deployment record 6576881408 is not a Vercel deployment ID.
2. Product decision CLOSED: owner requires at least 90 distinct puzzles. V2 supplies 90 new plus seven original puzzles; see DAILY_PUBLICATION_RC.md. No further seven-puzzle approval is requested.
3. Exact candidate Preview, 5–8 minutes: confirm SHA from candidate GitHub commit, Ready Preview; open homepage LISTEN, anagrams full-length, tile results; archive; September 22/23/24; today’s date; next-day route must be a real 404; malformed date 404. Complete a challenge, refresh, verify archive completion and replay preserve streak. These checks prove the new function works in the actual platform. Old 4dbfeb6 or bab27ab Preview is not evidence for this new inventory. V2 begins November 3; before that instant its routes correctly return 404. Verify a newly added puzzle after the cutover.
4. Mobile 375–430 CSS px or Android Chrome, 3–5 minutes: homepage, each tool, archive/challenge, consent allow/decline/reopen; no overflow, clipping or overlap; controls usable; progress persists. Record physical versus simulated evidence.
5. Operations, 2–3 minutes: Vercel production branch/build configuration, Production GA4 variable scope (no secret values), failure notifications recipient enabled, prior deployment Rollback option and function limits. GitHub production currently reports protected=false: review desired production/backup rules preventing forced updates/deletion. Do not apply unapproved settings or click rollback. No active external uptime alert delivery is currently established.

Estimated total owner review: 11–18 minutes, with no duplicate Search Console export or plugin installation. Exact Preview URL comes from the candidate’s deployment result.

## Only after a separately authorized production release

Verify actual deployed SHA/environment/domain, then live historical/today routes, tools, daily persistence and mobile. Observe GA4 no-choice/decline: denied storage, cookieless page signals allowed; allow: safe engagement without raw letters/guesses/answers; revoke: denied storage and no product events. Owner confirms production GA4 Realtime. Do not require these future-release checks before the candidate is deployed. Preview approval from the GA4 release is retained; new release smoke verifies integration, not a GA4 redesign.

## DNS and canonical redirect recommendation (not applied)

Preferred canonical: https://wordcabin.com. Public checks: apex A 76.76.21.21; www CNAME cname.vercel-dns.com; both HTTPS 200; HTTP 308 to the same hostname’s HTTPS. www does not redirect to apex; metadata points to apex. Nameservers are registrar-servers.com. No outage or conflicting AAAA was observed.

After separate owner approval: Vercel → WordCabin → Settings → Domains → www.wordcabin.com → Edit → Redirect to wordcabin.com with permanent 308. Preserve path/query; verify /anagram-solver/?check=redirect reaches https://wordcabin.com/anagram-solver/?check=redirect with one intended host redirect, no loop, and apex remains 200. This is a project-domain redirect recommendation, not a DNS-record edit. Do not add an unreviewed host redirect to this candidate’s vercel.json.

DNS modernization is separate. Older general-purpose Vercel targets are in use; exact project-recommended replacements are not verified. Do not guess replacements, switch nameservers, or change email/TXT records. Read expanded recommendations only when needed for a separately authorized DNS update. Current HTTPS availability does not require an emergency DNS change.

## Preserved Search Console evidence

Free direct URL-prefix property https://wordcabin.com/ accessed November 2. Sitemap Success, last read October 25, seven discovered pages. Index report October 22: one indexed, five discovered-not-indexed, one crawled-not-indexed; no other exclusion reason in that report. August 1–October 31 performance: one click, 20 impressions, 5% CTR, position 13.9. Not a Domain property and not an exhaustive crawl audit. Normal non-indexing is not automatically an infrastructure failure. No paid renewal needed.

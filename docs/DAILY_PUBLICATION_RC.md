# Daily publication release-candidate decision — November 2, 2026

Status: locally tested mechanism; owner product decision and hosted Preview acceptance pending. Do not deploy as an approved fresh-daily-content product.

## What is implemented

The original seven manually curated/dictionary-validated records for September 18–24, 2026 remain byte-for-byte unchanged. From September 25, immutable rotation v1 assigns those same seven puzzles weekly to explicit date IDs through December 31, 2099. UI discloses repetition on homepage, archive and rotated challenge pages. This provides repeatable daily practice, not a new unique puzzle each day. No evidence establishes explicit owner approval of this seven-puzzle product choice.

The smallest safe implementation preserves the existing solver and dictionary. A read-only Vercel Node function resolves a published date, reads a current-build asset shell, and returns self-canonical noindex,follow HTML. The original seven static pages remain generated. The function has no external calls, writes, user accounts or database. Future/unpublished, malformed, prelaunch and beyond-horizon dates return 404; unavailable shell returns 503 with Retry-After. Responses use no-store so a midnight 404 cannot remain cached. No daily build/cron is required. Vite preview alone does not emulate the Vercel function/rewrite.

Bogotá is the publication timezone on both server and client. Client discovery refreshes every 30 seconds and on focus. Explicit dated pages remain deterministic. The archive displays the latest 30 dates plus original seven, with earlier dates accessible through previous/next. Date records are computed on demand; they are not mass-generated indexed SEO pages. Only archive hub is in sitemap. Dictionary remains build-validation-only for daily code.

## Versioning and editorial procedure

Do not edit/reorder the original records: build validation pins their JSON fingerprint and validates every full-length accepted anagram against the production dictionary. Do not simply expand the array; that changes rotation assignments. Add fresh content in a new versioned inventory with an explicit future cutover date, retaining v1 resolution before the cutover. Validate unique IDs, dates, answers/signatures within each new inventory, clues, exact letters, dictionary membership and exhaustive alternative anagrams. Freeze published assignments. Extend the supported horizon using a reviewed version; warning begins December 2099. At horizon exhaustion, discovery falls back to Latest and unknown future routes remain 404.

## Product recommendation and required decision

Recommendation for a repeat-visit growth product: a larger curated bank (at least 90 distinct clue/answer puzzles), automatic date assignment and documented repeat policy. It would require an explicit editorial/versioning change; it has not been silently substituted into this candidate. Automated publication can eliminate daily owner actions, but it does not manufacture good original clues. Quarterly bank expansion is an editorial process, separate from daily deployment.

Owner decision: accept the transparently disclosed seven-puzzle weekly practice rotation for Version 1, or require the larger fresh-content bank before launch. This decision blocks product acceptance, not continued engineering testing. The seven-puzzle schedule remains reviewable in this isolated candidate and does not modify production.

## Tests and remaining hosted checks

Automated coverage includes September 22–24, November 2–3, leap day, month/year boundaries, Bogotá midnight, different visitor timezones, stable historic mappings, streaks, real built asset existence, no dictionary reference, invalid/future 404 and shell failure 503. A React DOM harness exercises actual discovery rollover and cross-tab state. These are not mobile screenshots or Vercel hosting proof.

On the exact candidate Preview, verify historical routes, today’s route (not a future route), previous/next, archive, and tomorrow’s 404. Confirm an authenticated response comes from the app/function, not the protection page. Run the same smoke checks after a separately authorized production deployment. Answer data exists client-side; this remains a casual game, not a secrecy boundary.

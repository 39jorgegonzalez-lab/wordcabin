# Daily Publication Inventory V2 — 90 new puzzles

Owner approved a minimum of 90 genuinely distinct validated puzzles on November 2, 2026. Seven-puzzle weekly repetition is rejected as the final Version 1 strategy. The new candidate contains 97 distinct puzzles: seven immutable original records plus 90 new authored puzzles. Product decision is resolved; hosted/mobile and production-identity acceptance remain pending.

## Inventory and dates

Canonical timezone: America/Bogota. V2 starts November 3, 2026. Its 90 unique daily assignments end January 31, 2027. As of November 2: seven distinct historical records, 90 unpublished distinct puzzles, no V2 puzzles yet published. Counts describe the publication schedule, not proof of historical live route availability. V1's September 25–November 2 practice mappings remain identical to the previous candidate; September 18–24 source records remain byte-for-byte unchanged. Earlier completion IDs and storage schema are preserved.

V2 has 30 easy, 40 medium and 20 hard puzzles, interleaved in a fixed sequence. New puzzle content IDs are explicit puzzle-v2-NNN values; date-based completion IDs remain daily-YYYY-MM-DD. Each date records its source content ID/version. Different dates/repetitions are not counted as distinct content.

If no new batch arrives, February 1 starts a disclosed 90-day repeat cycle, not a seven-day cycle. Homepage, challenge UI and server-rendered HTML label repeats; archive explains the policy. There is no claim of unlimited new content. Future dates remain real 404s until Bogotá publication day, including already authored inventory dates. After the supported 2099 horizon, current discovery falls back to Latest; a versioned horizon extension is required before then.

## Authoring, validation and report

See DAILY_CONTENT_STANDARD.md and DAILY_INVENTORY_V2_REVIEW.md. Ninety original clues/targets are stored in tools/daily/content/inventory-v2-authored.json. The deterministic Node pipeline derives exhaustive full-length anagrams from the unchanged production dictionary, rejects unsuitable groups, reverses display letters and emits an immutable browser inventory and maintainer report. No external list or runtime dictionary import is introduced. No new scoring system or gameplay rule is introduced.

Run npm run daily:generate-v2 to check reproducibility. The explicit --write generator is only for prepublication preparation; do not change a published bank. Build validation pins V2 metadata and content fingerprint, validates original seven, validates every new target/letter/clue/answer/attempt record, and rejects duplicate content IDs, target answers, normalized gameplay signatures, letter multisets and identical clues across banks. Even changing IDs/dates/letter order cannot evade duplicate checks. All 90 use existing reducer rules; completion, alternatives, duplicate guesses, maximum-attempt failure and replay are tested per puzzle.

The assistant authored and reviewed the target/clue selections; this is AI editorial review plus automated validation, not independent human review. Difficulty is a transparent length proxy (4–5, 6, 7–8 letters), not calibrated player-performance data. Existing original difficulty labels are unchanged. New accepted sets pass a conservative content screen; original immutable dictionary-derived sets are not rewritten.

## Runtime and indexing

The candidate retains the read-only stateless Vercel Node function. It resolves published dates using the same browser schedule and current hashed build shell. No cron, database, daily owner work or midnight rebuild is required. Invalid/future dates return 404; missing/invalid shell returns 503 with Retry-After. No-store prevents a pre-midnight 404 being cached into the next day. Vite preview alone does not prove Vercel routing works.

Only the archive hub is indexed and included in sitemap. Dated pages remain self-canonical noindex,follow, excluded from sitemap, and answer-free in metadata. No 90-page indexed content inventory is generated. Archive shows recent 30 dates plus original seven, with older navigation available. The answer exists client-side: this is a casual game, not a secrecy boundary.

## Adding future batches safely

1. Prepare new original clues/targets and a separate immutable inventory-v3.js (and later versions). Do not edit original seven, V1 mapping, V2 order/content or its cutover.
2. Derive complete accepted anagrams with the existing dictionary grouping pipeline and use a new explicit content-ID namespace. Follow the same quality rubric; validate against every prior bank, including historical content, for duplicates.
3. Choose a future Bogotá cutover date, preferably February 1 or earlier only after all V2 unique puzzles have appeared. To avoid discarding unpublished content, validator requires the next start at or after the preceding bank’s first unique cycle ends. Add one append-only PUBLICATION_BATCHES entry with incremented version, exact start, puzzles and SHA-256 fingerprint of JSON.stringify(puzzles).
4. Confirm the new start is still future immediately before committing/releasing. Never backdate a new batch into already published dates. Review the prior manifest against the deployed baseline. Automated tests must compare every old date through the new cutover against the previous mapping; the existing V3 fixture demonstrates this invariant.
5. Run npm run daily:inventory, npm test, configured build, route checks and Preview acceptance. One owner-authorized batch release supplies many days; no daily deployment is needed. Recheck remaining stock before release because elapsed time consumes scheduled inventory.

npm run daily:inventory and every production build warn loudly below 30 unpublished distinct puzzles (first threshold January 2, 2027 for V2). The operational smoke command also reports the warning. A daily ChatGPT inventory condition watch was created/enabled on November 2 to notify at 29/14/7/0 and meaningful exhaustion-date changes, using current GitHub batches. It distinguishes candidate from production; first notification delivery is not verified. No paid service was purchased. This supplements, rather than proves, production uptime alerting.

## Hosted acceptance still required

On the exact new Preview, verify historical September 22–24, current challenge, archive, invalid/tomorrow 404, new V2 puzzle after its November 3 cutover, completion/replay/storage and mobile. Tests simulate current/future publication, month/year/leap boundaries, all 90 page metadata and built assets. They do not establish authenticated Vercel runtime or visual acceptance. Original production and backup remain unchanged.

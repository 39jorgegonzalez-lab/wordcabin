# WORDCABIN GA4 — Phase 1

## Scope and baseline

Feature branch: `ga4-analytics-v1`, based on production commit
`18bb3dc5286f4ca27ec48b5d21a4e566a77c5753`.
Protected backup: `516111665a5d20f81fa88aeb6702368167599207`.
No production merge, deployment, alias change, advertising activation, or backup
change is part of this work. No runtime dependency was added.

## Architecture

Product components dispatch `wordcabin:analytics` CustomEvents. The existing
Daily event contract remains intact. `src/analytics/events.js` adds vendor-neutral
tool engagement and a strict GA4 event/property/value allowlist.
`ga4.js` alone handles consent commands, config, Google script loading and events.
`consent.js` handles defensive local preference storage. `bootstrap.js` mounts a
small nonmodal preference surface using DOM APIs; it does not require React.

`src/main.jsx` imports this bootstrap before loading any application.
Vite also emits it as a standalone hashed entry. After existing daily/tool page
generation, `generate-analytics-pages.js` attaches the current manifest's entry
and CSS to Privacy, Advertising and the Word Unscrambler guide. Those static
pages do not load React or the dictionary. All tool/daily pages use their existing
application bootstrap and the same shared adapter. Daily does not load dictionary
code. Existing navigation uses document loads, not a client-side router.

The old optional Plausible loader was removed to avoid parallel providers or
an ungated analytics path. No ad configuration changed.

## Configuration and owner setup (required before Preview acceptance)

Expected public Measurement ID: `G-82FJCYXT95`.
Set **`VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95`** at build time.
Missing, blank, or malformed values disable initialization and the preference UI.
The example environment file deliberately leaves the value blank. No private
credential, API secret, OAuth token or service-account key is needed.

1. In GA4 select WORDCABIN → Admin → Data streams → the web stream matching this
   Measurement ID. Turn **Enhanced measurement off**, including history page
   views, site search, form interactions, outbound clicks, scrolling, downloads
   and video events. Our adapter owns the explicit page-view/event baseline.
   Automatic measurement can otherwise send fields outside our allowlist.
2. Keep Google signals, user-provided data collection, User-ID, advertising
   personalization and Ads destinations disabled. Do not add tag-side custom
   variables that capture text. Review Google tag event-detection settings too.
3. In Vercel → wordcabin → Settings → Environment Variables, add the variable
   above to **Preview**, ideally restricted to `ga4-analytics-v1`. Do not change
   unrelated variables. Rebuild the exact feature commit as **Preview** after
   saving; Vite replaces environment variables during build, not at request time.
4. Production will need the same variable in a future owner-approved production
   build. Do not configure/deploy/promote Production as part of this mission.

Account settings are not readable/enforceable by the adapter. Their confirmation
is an acceptance gate. Preview activity uses this same GA4 stream and will appear
in its reports. No debug flag or automatic environment tag is enabled.

## Consent and storage

Basic consent mode: no Google script is inserted until explicit opt-in or a
valid stored grant. All four consent defaults are denied before config or events.
Grant changes only `analytics_storage`; `ad_storage`, `ad_user_data` and
`ad_personalization` remain denied. Google signals and ad personalization are
also explicitly disabled in config.

The equal-style Allow analytics / Decline buttons are in document flow: no modal,
overlay, scroll lock, forced action or inaccessible underlying tool.
Analytics preferences at the page bottom reopens the choices and focuses a
button. The UI explains the current preference when reopened.

Storage key: `wordcabin.analytics-consent.v1`.
Record: `{ "version": 1, "analytics": "granted" }` or `"denied"`.
Extra fields, corrupt JSON, unsupported versions and malformed records are
treated as no choice. No personal data is stored; daily progress uses its own key.
If storage is denied/full, the preference still applies in memory to the current
document. A new document defaults to denied if no valid preference can be read.
Clearing storage resets preference. Cross-tab storage changes revoke collection
in already open tabs too.

Revocation immediately gates product events, sets the destination's
`ga-disable-G-82FJCYXT95` flag before updating Google consent, and removes queued
measurement events waiting for a blocked/slow script. The loaded script is not
reinserted. A subsequent grant does not replay prior activity or duplicate the
same document's page view. Previously delivered or in-flight requests cannot be
recalled. Existing Google cookies are not represented as deleted by this action.
Blocked scripts and storage/gtag failures must never block product functionality.

## Event contract

| GA4 event | Permitted product properties |
| --- | --- |
| `page_view` | No caller-supplied fields; fixed route-derived page fields |
| `tool_engaged` | `tool_name`: `word_unscrambler`, `anagram_solver`, `tile_game_word_finder` |
| `daily_challenge_view` | Validated daily properties below |
| `daily_challenge_start` | Validated daily properties below |
| `daily_challenge_complete` | Validated daily properties below |
| `daily_challenge_failed` | Validated daily properties below |
| `daily_challenge_navigation` | Validated daily properties below |

Daily properties: `challengeId` (explicit `daily-YYYY-MM-DD`), `challengeDate`
(valid matching calendar date), `difficulty` (easy/medium/hard), `attemptNumber`
(integer 1–10), `completionStatus`/`failureStatus` (booleans), `direction`
(previous/next). Unknown fields are stripped; unknown event names are rejected.
The internal guess/archive-view events are not forwarded. Archive is measured
by its page view. No optional reset event was added.

`tool_engaged` is emitted once per mounted tool instance after letters containing
only letters/wildcards/whitespace first produce results. Further input, filters,
Reset and Enter do not emit another engagement. Only a boolean crosses into the
neutral helper; the event carries the tool enum, never the letters. If the first
engagement occurs before consent, it is discarded, not retained for later replay.

Daily completion is emitted only when `recordCompletion` saves a new original
completion. Successful replay does not create another completion event. The
adapter also deduplicates view/start/complete/failure and tool engagement within
the document. Navigation can occur more than once. No gameplay/storage/streak
semantics changed.

Config uses `send_page_view:false`; the adapter explicitly sends one page view
on the first valid grant per document. All event page locations are constructed
from allowed route paths using the canonical origin `https://wordcabin.com`.
Query strings, fragments, raw document titles and referrers are excluded. Preview
therefore also reports canonical paths; its hostname is not an event dimension.
No attribution/referrer/campaign parameters are retained in this minimal phase.

No solver input, query, filter text, guess, answer, solution, email, name, user ID,
localStorage record or free-form text is forwarded. GA itself may emit ordinary
session/first-visit/engagement signals and receive request/browser information
after consent; the site does not claim that Google receives no technical data.

## Automated verification

Run:

```sh
npm ci
npm test
npm run test:analytics
npm run build
npm run test:routes
VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95 npm run build
npm run test:routes
npm audit --omit=dev
git diff --check
sha256sum src/data/words.js
git status --short --branch
git diff --stat 18bb3dc5286f4ca27ec48b5d21a4e566a77c5753
git ls-remote --heads origin
```

Tests cover configuration, default/restored/corrupt/revoked consent, denied and
quota storage failures, idempotent asynchronous script initialization, throwing
gtag, safe event properties and values, unknown/noisy events, sanitized single
page views for all required routes, one tool engagement, cross-tab revocation,
and real DOM consent and Daily completion/replay behavior. Existing solver,
dictionary pipeline/eligibility/integrity/production-write guards, Daily and site
suites remain enabled. Real tool DOM tests additionally observe the neutral
engagement events across all three tool modes.

Route tests validate current hashed JS/CSS on every generated page, standalone
analytics isolation, sitemap/canonical/indexing policy and dictionary isolation.
The Daily size budget now walks all transitive imports, including analytics.

Dictionary baseline SHA-256:
`cb9be5d9eae5c7427b134a1a90c3c9867a245d1f03dcc97f93c997e0e74b734b`.

## Preview network and rendered checklist

Do not substitute DOM tests or a queued `gtag` command for actual delivery.
Open the authenticated Vercel **Preview** for the final feature commit, using an
owner browser if Vercel authentication blocks the automated browser.

1. Open developer tools → Network (preserve log), filter `google`, `gtag`,
   `collect`; start with fresh consent storage for this Preview origin.
2. Before choosing and after Decline: exercise each tool and Daily; there must
   be no Google tag request or Analytics collection request. All products work.
3. Open Analytics preferences → Allow analytics. Confirm one `gtag/js` request
   for the expected ID, then `g/collect` requests to the expected destination.
4. Visit `/`, `/anagram-solver/`, `/scrabble-word-finder/`, archive, a published
   dated challenge, `/privacy/` and `/advertising/`. Confirm one `page_view` per
   document navigation (not an additional automatic one). Consent remains saved.
5. On each tool type a known test rack, change it, filter and reset. Inspect
   requests: one `tool_engaged`, correct enum, no entered letters or filters.
6. Start/complete Daily. Inspect safe event parameters and absence of guesses or
   answers. Successful replay must not count another original completion.
7. Reopen preferences and Decline. Clear the Network log; interact, wait and
   navigate. No new Analytics collection may occur. Requests already in flight
   at revocation are not evidence of new post-revocation collection.
8. Inspect desktop and narrow mobile layouts: comparable choices, keyboard focus,
   no clipped/overlapping controls, no horizontal overflow, products usable with
   banner open or dismissed. Check console for product-breaking errors.

## Owner Realtime acceptance

Open Google Analytics → WORDCABIN → Reports → Realtime. In the configured Preview
grant analytics, visit several pages, engage a core tool and start/complete a
Daily challenge. Confirm `page_view`, `tool_engaged` and safe Daily events arrive
under the intended web stream. Allow normal reporting delay. If absent, inspect
blocked requests, destination ID, stream settings and consent before changing code.

**PENDING OWNER VERIFICATION** until the owner explicitly confirms actual
Realtime receipt. Passing local tests is not a Realtime or network PASS.

## Performance and rollback

No analytics SDK/runtime package added. The shared vanilla adapter is about
5.7 KB minified / 2.4 KB gzip plus 0.45 KB gzip CSS. Google loads asynchronously
only after grant. External Google payload is vendor-controlled and is not part
of the first-party build or pre-consent load. The dictionary remains one shared
tool chunk; static legal pages load only the analytics chunk.

Rollback before merge: leave production at the baseline and discard/revise only
this feature branch. After a later authorized release: an owner-approved revert
of the focused feature commit restores the prior tree; do not reset shared
history or touch the backup branch. Alternatively, removing the GA4 variable and
rebuilding disables this integration (a rebuild/deployment still needs approval).

## Limitations

- Stream/tag settings and Vercel environment variables require owner-accessible
  account configuration; the adapter cannot verify these remotely.
- Opt-in-only measurement intentionally undercounts total visitors and drops
  pre-consent interactions. No event backlog is kept.
- Storage rejection means preferences last only for the current document.
- Browser blockers can prevent Google delivery despite a valid grant.
- Tests inspect command queues and DOM behavior, not Google's ingestion service.
- Authenticated desktop/mobile rendering, Google network receipt, and owner
  Realtime acceptance must be recorded separately before production approval.
- The existing seven-challenge inventory warning is unrelated and unchanged.

References: [Google consent setup](https://developers.google.com/tag-platform/security/guides/consent),
[manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views),
[Enhanced Measurement settings](https://support.google.com/analytics/answer/9216061).

# WORDCABIN GA4 — Phase 1, Advanced Consent Mode

## Scope and baseline

Feature branch: `ga4-analytics-v1`, based on production commit
`18bb3dc5286f4ca27ec48b5d21a4e566a77c5753`.
Protected backup: `516111665a5d20f81fa88aeb6702368167599207`.
No production merge, deployment, alias change, advertising activation, or backup
change is part of this work. No runtime dependency was added. This focused revision follows Basic-mode feature
commit `9b1c24be3a750fed7708bf64ae6842dac4eff383` on the same branch.

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

Basic mode (the previous implementation) blocked the Google tag until opt-in.
Advanced mode (this revision) loads the tag asynchronously with denied defaults
already set, allowing limited consent-aware cookieless page measurement.

Deterministic order for each configured document:

1. Initialize `dataLayer` and `gtag`.
2. Queue all four consent defaults as denied.
3. Insert the asynchronous Google tag once.
4. Queue `js` and GA4 `config`, with `send_page_view:false`, Google signals off,
   ad personalization off and sanitized page fields.
5. Apply a valid stored choice, if present. Only analytics storage can be granted.
6. Queue exactly one explicit sanitized `page_view`.

If the default consent command fails, initialization stops before tag insertion.
No saved choice or a malformed preference keeps analytics storage denied. A saved
grant is applied before the page-view command. Consent changes later in the same
document never issue another page view. Product events remain gated until grant.
Google may produce consent-state pings or other consent-aware requests; a request
is not evidence of analytics storage being granted or a duplicate page-view command.
`ad_storage`, `ad_user_data` and `ad_personalization` remain denied in every state.

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
Clearing storage resets preference. Cross-tab storage changes return analytics
storage to denied and gate product events in already open tabs too.

Revocation immediately gates product events and queues an analytics-storage-denied
consent update before persisting the preference. It removes pending product event
commands waiting for a blocked/slow tag, but retains the single page-view command.
Previously dispatched or in-flight requests cannot be recalled. Existing cookies
are not represented as deleted: denied consent tells Google not to use analytics
storage going forward. Denied-mode cookieless signals may continue.

The adapter no longer sets `ga-disable-G-82FJCYXT95`: that hard switch would also
suppress Advanced-mode denied measurement. It does not clear or override a separate
opt-out flag established outside this adapter. Google consent state controls tag
storage behavior; the site separately gates product events. Regrant does not
replay denied or revoked activity. Blocked scripts and storage/gtag failures must
never block product functionality.

## Event contract

| GA4 event | Permitted product properties |
| --- | --- |
| `page_view` | Fixed route-derived page fields; issued in denied or granted mode |
| `tool_engaged` | `tool_name`: `word_unscrambler`, `anagram_solver`, `tile_game_word_finder` |
| `daily_challenge_view` | Validated daily properties below |
| `daily_challenge_start` | Validated daily properties below |
| `daily_challenge_complete` | Validated daily properties below |
| `daily_challenge_failed` | Validated daily properties below |
| `daily_challenge_navigation` | Validated daily properties below |

All product-specific events in the table require a current analytics grant.
Only the explicit page view can be issued without it.

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
at initialization per document, under the effective denied or stored-granted state. All event page locations are constructed
from allowed route paths using the canonical origin `https://wordcabin.com`.
Query strings, fragments, raw document titles and referrers are excluded. Preview
therefore also reports canonical paths; its hostname is not an event dimension.
No attribution/referrer/campaign parameters are retained in this minimal phase.

No solver input, query, filter text, guess, answer, solution, email, name, user ID,
localStorage record or free-form text is forwarded. GA itself may emit ordinary
session/first-visit/engagement signals and receive request/browser information
under the applicable consent state; the site does not claim that Google receives
no technical data while denied. Cookieless signals are not exact visitor or full
session counts. Behavioral modeling is controlled by Google, may require
eligibility thresholds, and is not guaranteed or asserted to be active.

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

Tests cover default-before-load/config/event ordering, denied-mode loading,
restoring consent before page view, no hard-disable override, immediate updates,
configuration, default/restored/corrupt/revoked consent, denied and
quota storage failures, idempotent asynchronous script initialization, throwing
gtag, safe event properties and values, unknown/noisy events, sanitized single
page views for all required routes, one tool engagement, cross-tab revocation,
and real DOM consent and Daily completion/replay behavior. Page-view counts are
checked through no-choice, decline, grant and revocation; product events are
checked for gating and no backlog replay. Existing solver,
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

1. First confirm the GA4 account settings above and build Preview with
   `VITE_GA4_MEASUREMENT_ID=G-82FJCYXT95`.
2. Open DevTools → Network (preserve log) and Application → Cookies. Start with a
   fresh Preview-origin preference and no existing analytics cookies. Inspect
   Google requests, their consent state, destination ID and payloads.
3. Before choosing: expect one asynchronous `gtag/js` load, denied analytics and
   advertising storage, no newly created normal GA analytics cookies, and possible
   cookieless measurement requests. Use the tools; no product engagement events
   should be forwarded. A Google request alone is not a failure.
4. Decline: storage remains denied; cookieless signals may continue and products
   remain fully functional. Confirm no normal cookie-based analytics grant.
5. Reopen Analytics preferences → Allow analytics. Confirm analytics storage
   becomes granted while all ad-related states stay denied. Normal GA4 requests
   can occur; inspect one `tool_engaged` per newly engaged tool/document and safe
   Daily events. No letters, queries, filters, guesses or answers may appear.
6. Visit `/`, `/anagram-solver/`, `/scrabble-word-finder/`, archive, a published
   dated challenge, `/privacy/` and `/advertising/`. Confirm one explicit
   `page_view` command per navigation, without an additional automatic page view.
   Consent updates/pings are not additional page-view commands. Check no-choice,
   denied, granted and revoked states separately.
7. Reopen preferences and Decline. Inspect the immediate denied update. Subsequent
   normal analytics storage/collection must stop; denied-mode cookieless requests
   may continue. Product events must stop, without replay after regrant. Requests
   already in flight cannot be recalled. Existing cookies may remain on disk;
   inspect future behavior rather than assuming they are erased.
8. Inspect desktop and narrow mobile layouts: comparable choices, keyboard focus,
   no clipped/overlapping controls or horizontal overflow, accurate cookieless
   disclosure and usable tools with the banner open or dismissed.

## Owner Realtime acceptance

Open Google Analytics → WORDCABIN → Reports → Realtime. In the configured Preview
first inspect no-choice/denied behavior, then grant analytics, visit the homepage,
Anagram Solver, Tile-Game Word Finder and Daily archive/challenge. Engage a core
tool and start/complete a
Daily challenge. Confirm `page_view`, `tool_engaged` and safe Daily events arrive
under the intended web stream. Allow normal reporting delay. If absent, inspect
blocked requests, destination ID, stream settings and consent before changing code.

**PENDING OWNER VERIFICATION** until the owner explicitly confirms actual
Realtime receipt. Passing local tests is not a Realtime or network PASS. Denied
signals need not appear as full Realtime sessions. Do not claim behavioral modeling
is active unless the property explicitly indicates eligibility.

## Performance and rollback

No analytics SDK/runtime package added. The shared vanilla adapter is about
a few KB minified plus under 1 KB gzip CSS; measure the current build for exact
values. Google now loads asynchronously before opt-in with consent denied. Its
external payload is vendor-controlled, adds pre-consent network cost, and is not
included in first-party bundle measurements. The dictionary remains one shared
tool chunk; static legal pages load only the analytics chunk.

Configured-build comparison against `9b1c24b`, using Node `zlib.gzipSync`:

| Payload | Basic gzip bytes | Advanced gzip bytes |
| --- | ---: | ---: |
| Analytics JS | 2,413 | 2,412 |
| Consent CSS | 453 | 453 |
| Homepage JS graph | 329,452 | 329,457 |
| Daily JS graph | 69,549 | 69,556 |

Advanced analytics JS is 5,691 raw bytes; consent CSS is 926 raw bytes.
No new chunk family or dependency was introduced. Small route differences include
changed hashed import references; the dictionary itself is unchanged.

Rollback before merge: leave production at the baseline and discard/revise only
this feature branch. After a later authorized release: an owner-approved revert
of the focused feature commit restores the prior tree; do not reset shared
history or touch the backup branch. Alternatively, removing the GA4 variable and
rebuilding disables this integration (a rebuild/deployment still needs approval).

## Limitations

- Stream/tag settings and Vercel environment variables require owner-accessible
  account configuration; the adapter cannot verify these remotely.
- Product engagement remains opt-in-only; pre-consent interactions are dropped.
  No backlog is kept. Cookieless page signals do not guarantee exact visitor
  counts, complete sessions or eligibility for modeled reporting.
- Storage rejection means preferences last only for the current document.
- Browser blockers can prevent Google delivery despite a valid grant.
- Tests inspect command queues and DOM behavior, not Google's ingestion service.
- Authenticated desktop/mobile rendering, Google network receipt, and owner
  Realtime acceptance must be recorded separately before production approval.
- The existing seven-challenge inventory warning is unrelated and unchanged.

References: [Google consent setup](https://developers.google.com/tag-platform/security/guides/consent),
[Advanced versus Basic mode](https://developers.google.com/tag-platform/security/concepts/consent-mode),
[manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views),
[Enhanced Measurement settings](https://support.google.com/analytics/answer/9216061).

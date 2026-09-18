# Core tools — Phase 1.1

## Modes and shared behavior

All three tools render `src/solver/WordSolver.jsx`, importing the same production
dictionary and `src/engine/solver.js`. The engine and dictionary are unchanged.
`tool-modes.js` provides labels, contextual links and the one mode constraint:

| Experience | Route | Semantics |
| --- | --- | --- |
| Word Unscrambler | `/` | All buildable words, including shorter words; existing filters and ranking |
| Anagram Solver | `/anagram-solver/` | Full-length matches only; repeated letters must match, with `?` substituting one letter |
| Tile-Game Word Finder | `/scrabble-word-finder/` | All buildable rack words, grouped longest first, then scored using existing engine values |

Anagram length filtering runs before the engine's 600-result limit, not after it.
Normalization is identical in all modes: ASCII letters and `?` are retained,
case-insensitively; other characters are ignored. Fewer than two usable letters
produce no results. Existing starts-with, ends-with and contains filters remain.
Anagram mode deliberately omits the conflicting length filter. The other modes
retain it. The existing dictionary contains unique records; mode tests check
result uniqueness against that production source.

Tile points are the existing English letter values; blanks score zero. These are
base tile points, not a board-aware move score. No board multipliers or bonuses
are calculated. Results remain candidates: players must check their game's own
dictionary. No official game-list compatibility is promised.

## Live interaction and accessibility

Input state drives memoized solving in all modes. The old visible Unscramble
button only trimmed whitespace; it did not initiate solving. It has been removed
and replaced with "Results update as you type." Enter retains trimming without
navigation or a hidden submit control. Reset clears letters, filters and the copy
indicator, then focuses the input. A short polite live region announces counts
instead of announcing the entire results grid. Inputs retain accessible names;
controls have visible focus and usable target sizes. Shared CSS is scoped to the
tool so it does not restyle the existing SEO-page content.

## Routes, SEO and assets

The existing tool-page HTML stays under `public/`, with its distinct title,
description, canonical, indexing and explanatory content. Guides are below the
embedded tool. Anagram instructions now accurately describe automatic exact
matching. Contextual links connect exact anagrams, broad unscrambling and rack
search. No routes, sitemap entries, robots policies or daily indexing rules were
added or changed.

`main.jsx` mounts the shared tool in `#tool-root` on the two routes, leaving the
static content intact. Home and Daily Challenge keep their own lazy entries.
After the Vite and unchanged daily-page build steps, `generate-tool-pages.js`
injects the current build's module script and any entry CSS into the two pages.
It fails if the shell or assets are missing; hashed names are never hardcoded.
The Vite development middleware supplies the same source bootstrap for those
pages during `npm run dev`.

The dictionary is emitted once in the shared WordSolver chunk and reused by all
three tools. Daily Challenge does not import it. There are no new runtime
dependencies. `jsdom` is a test-only dependency to execute real React DOM input,
keyboard, filter and reset interactions; it is not a visual-rendering substitute.

## Verification and review

Run `npm ci`, `npm test`, `npm run build`, `npm run test:routes`,
`npm audit --omit=dev`, and `git diff --check`. `npm run test:tools` can be used
for the focused mode/DOM/generation suites. Route verification checks current
assets, preserved metadata/content, dictionary uniqueness and daily isolation.
The full existing dictionary safety and daily test suites remain in `npm test`.

Rendered acceptance requires all three routes at desktop and mobile widths in
a non-production preview: type LISTEN without submitting, inspect exact-only
anagrams versus shorter rack words, try a wildcard and filters, use Enter and
Reset, then inspect content, focus, links and overflow. Record actual results;
DOM harness success alone does not certify layout.

## Rollback and boundaries

Before production integration, abandoning this isolated feature branch leaves
production unchanged. After a separately authorized integration, revert the
feature commit and run the full verification before any authorized redeployment.
Do not reset production history or alter `backup-production-before-rebuild`.
Daily challenges, their timezone/storage/analytics, monetization configuration,
candidate tooling, privacy, advertising and the dictionary are unchanged.

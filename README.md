# WordCabin Professional Build

This is the clean rebuild of WordCabin.

## What it includes
- Vite + React production structure
- Stable word solver engine
- Partial-word generation
- Exact anagram detection
- Wildcard support using `?`
- Filters: starts with, ends with, contains, length
- Grouped results by word length
- Ranking by length, common-word priority, word score, and alphabetic order
- Mobile-first cozy UI
- Vercel-ready configuration

## Deployment
Upload all files to the existing GitHub `wordcabin` repository, replacing the current files. Vercel will automatically build and deploy.

## Monthly maintenance approach
1. Review analytics and search behavior.
2. Evaluate missing legitimate words through the candidate-source pipeline; never edit `src/data/words.js` manually.
3. Avoid weekly redesigns. Keep monthly iterations small and measured.

## Verification

Run `npm test`, `npm run build`, and `npm audit --omit=dev` before requesting a deployment. Production deployment requires separate owner authorization.

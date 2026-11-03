// Read-only HTTP monitor. No cookies, queries, credentials, or analytics events.
import { DAILY_CHALLENGES } from '../../src/daily/challenges.js';
import { inventoryStatus, scheduledChallenges } from '../../src/daily/schedule.js';
import { getPublishedChallenges, challengeRoute } from '../../src/daily/challenge-model.js';
const origin = 'https://wordcabin.com';
const inventory=inventoryStatus();
if(inventory.warning) console.error(`WARNING: DAILY INVENTORY LOW: ${inventory.unpublishedDistinct} unique puzzles remain; stock through ${inventory.uniqueThrough}`);
const routes = ['/', '/anagram-solver/', '/scrabble-word-finder/', '/daily-word-challenge/', '/privacy/', '/advertising/', '/robots.txt', '/sitemap.xml', ...new Set([...getPublishedChallenges(DAILY_CHALLENGES), ...scheduledChallenges().slice(-3)].map(challengeRoute))];
let failures = 0;
for (const route of routes) {
  try {
    const response = await fetch(origin + route, { signal: AbortSignal.timeout(20000) });
    const body = await response.text();
    if (response.status !== 200 || !body.length) throw new Error(`HTTP ${response.status}`);
    if (route.endsWith('/') && !body.includes('wordcabin.com')) throw new Error('Unexpected HTML');
    console.log(`PASS ${route}`);
  } catch (error) { failures++; console.error(`FAIL ${route}: ${error.message}`); }
}
console.log(`${routes.length - failures}/${routes.length} routes passed`);
process.exitCode = failures ? 1 : 0;

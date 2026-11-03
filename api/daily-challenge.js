import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { scheduledChallenge, scheduledChallenges } from '../src/daily/schedule.js';
import { bogotaDateFromInstant, challengeRoute, getChallengeNavigation } from '../src/daily/challenge-model.js';
import { replaceMeta, challengeStaticContent } from '../src/daily/page-html.js';

export function dailyResponse(date, { now = new Date(), readShell = () => readFileSync(join(process.cwd(), 'dist/_runtime/daily-shell.txt'), 'utf8') } = {}) {
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, follow', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  const today = bogotaDateFromInstant(now);
  const challenge = typeof date === 'string' ? scheduledChallenge(date, today) : null;
  if (!challenge) return { status: 404, headers, body: '<!doctype html><html lang="en"><title>Challenge not found | WordCabin</title><meta name="robots" content="noindex,follow"><main><h1>Challenge not found</h1><a href="/daily-word-challenge/">Challenge archive</a></main></html>' };
  try {
    const shell = readShell();
    if (!shell.includes('/assets/') || !shell.includes('<div id="root"></div>')) throw new Error('Invalid built shell');
    const navigation = getChallengeNavigation(scheduledChallenges(today), challenge);
    return { status: 200, headers, body: replaceMeta(shell, {
      title: `Daily Word Challenge — ${date} | WordCabin`,
      description: `Solve the ${date} WordCabin daily word challenge. ${challenge.isRepeat ? "A clearly labeled repeat from our curated collection." : "A clue-driven puzzle from our curated collection."}`,
      robots: 'noindex, follow', canonical: `https://wordcabin.com${challengeRoute(challenge)}`,
      staticContent: challengeStaticContent(challenge, navigation),
    }) };
  } catch {
    return { status: 503, headers: { ...headers, 'Retry-After': '60' }, body: '<!doctype html><html lang="en"><title>Challenge temporarily unavailable</title><main><h1>Challenge temporarily unavailable</h1><p>Please try again shortly.</p><a href="/">Open word solver</a></main></html>' };
  }
}
export default function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  const result = dailyResponse(req.query?.date);
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
  return res.status(result.status).end(req.method === 'HEAD' ? undefined : result.body);
}

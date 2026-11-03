import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DAILY_CHALLENGES } from './challenges.js';
import { scheduledChallenge, scheduledChallenges, recentArchive } from './schedule.js';
import { bogotaDateFromInstant, computeStreaks, getChallengeNavigation, letterSignature } from './challenge-model.js';
import { dailyResponse } from '../../api/daily-challenge.js';
assert.equal(createHash('sha256').update(JSON.stringify(DAILY_CHALLENGES)).digest('hex'), '0db4bc544c3512a4af522510fd65a7234af61a56a703a440de6da82f8044f09c', 'Rotation v1 source must never change; create a future version instead');
for (const original of DAILY_CHALLENGES) assert.deepEqual(scheduledChallenge(original.date, '2026-11-03'), original);
const dates = ['2026-09-22','2026-09-23','2026-09-24','2026-11-02','2026-11-03','2028-02-29','2026-11-30','2026-12-01','2026-12-31','2027-01-01','2031-07-18','2099-12-31'];
for (const date of dates) {
  const first = scheduledChallenge(date, date);
  assert.ok(first);
  assert.deepEqual(first, scheduledChallenge(date, '2099-12-31'), 'content is stable after release/refresh');
  assert.equal(first.id, `daily-${date}`);
  assert.equal(letterSignature(first.answer), letterSignature(first.letters));
  assert.ok(first.acceptedAnagrams.includes(first.answer));
}
assert.equal(scheduledChallenge('2026-11-02','2026-11-02').answer, scheduledChallenge('2026-11-09','2026-11-09').answer, 'documented weekly repetition');
for (const invalid of ['2026-02-30','2027-02-29','2026-9-22','../../secrets','2026-09-17','2100-01-01']) assert.equal(scheduledChallenge(invalid,'2100-01-01'),null);
assert.equal(scheduledChallenge('2026-11-03','2026-11-02'),null);
assert.equal(bogotaDateFromInstant('2026-11-03T04:59:59.999Z'),'2026-11-02');
assert.equal(bogotaDateFromInstant('2026-11-03T05:00:00Z'),'2026-11-03');
for (const tz of ['Pacific/Kiritimati','America/Los_Angeles','UTC']) { process.env.TZ=tz; assert.equal(bogotaDateFromInstant('2026-11-03T05:00:00Z'),'2026-11-03'); }
const all = scheduledChallenges('2026-11-03');
assert.equal(all.length,47);
assert.equal(recentArchive(all).length,37);
assert.equal(getChallengeNavigation(all,all.at(-1)).next,null);
assert.equal(getChallengeNavigation(all,all[0]).previous,null);
assert.deepEqual(computeStreaks(all,Object.fromEntries(all.slice(-3).map(c=>[c.id,{}])),'2026-11-03'),{current:3,longest:3});
const shell = '<html><head><title>Home</title><meta name="description" content="Home" /><meta name="robots" content="index, follow" /><link rel="canonical" href="https://wordcabin.com/" /></head><body><div id="root"></div><script src="/assets/current.js"></script></body></html>';
for (const date of dates) {
  const result = dailyResponse(date,{now:new Date(`${date}T17:00:00Z`),readShell:()=>shell});
  assert.equal(result.status,200);
  assert.match(result.body,/noindex, follow/);
  assert.ok(result.body.includes(`https://wordcabin.com/daily-word-challenge/${date}/`));
  assert.ok(result.body.includes('/assets/current.js'));
  assert.ok(!result.body.split('</head>')[0].includes(scheduledChallenge(date,date).answer));
}
assert.equal(dailyResponse('2026-11-03',{now:new Date('2026-11-03T04:59:59Z'),readShell:()=>shell}).status,404);
assert.equal(dailyResponse('2026-11-03',{now:new Date('2026-11-03T05:00:00Z'),readShell:()=>shell}).status,200);
assert.equal(dailyResponse(['2026-11-02']).status,404);
assert.equal(dailyResponse('2026-11-02',{now:new Date('2026-11-03'),readShell:()=>{throw Error('missing')}}).status,503);
assert.equal(dailyResponse('2026-11-02',{now:new Date('2026-11-03'),readShell:()=>shell}).headers['Cache-Control'],'no-store');
console.log('PASS: immutable rotating schedule, historical/current/future dates through 2099, repetition, calendar/zone boundaries, streaks, real 404/503 responses, metadata and asset shell');

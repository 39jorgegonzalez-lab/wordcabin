import assert from 'node:assert/strict';
import { INVENTORY_V2 } from './inventory-v2.js';
import { DAILY_CHALLENGES } from './challenges.js';
import { PUBLICATION_BATCHES } from './publication-batches.js';
import { scheduledChallenge, inventoryStatus } from './schedule.js';
import { validateInventories, fingerprint, normalizedPuzzleSignature } from '../../tools/daily/validate-inventories.js';
import { runChallengeValidation } from '../../tools/daily/validate-challenges.js';
import { createGameState, submitGuess, replayGame } from './game-reducer.js';
import { recordCompletion, emptyDailyProgress } from './storage.js';
const check=validateInventories({today:'2026-11-02'});assert.deepEqual(check.errors,[]);assert.equal(check.distinctCount,97);
assert.equal(INVENTORY_V2.length,90);
assert.equal(new Set([...DAILY_CHALLENGES,...INVENTORY_V2].map(normalizedPuzzleSignature)).size,97);
assert.deepEqual(INVENTORY_V2.reduce((a,p)=>(a[p.difficulty]++,a),{easy:0,medium:0,hard:0}),{easy:30,medium:40,hard:20});
assert.equal(fingerprint(INVENTORY_V2),'b040e0abb1cc039952136d0897ed6c19075893106ace36ed5ae775cf4f039606');
for(const p of INVENTORY_V2){
 const start=createGameState(p);
 assert.equal(submitGuess(start,p,'!').attempts.length,0);
 const alternative=p.acceptedAnagrams.find(w=>w!==p.answer);
 const wrong=submitGuess(start,p,alternative);assert.equal(wrong.feedback,'valid-wrong');
 assert.equal(submitGuess(wrong,p,alternative).attempts.length,1);
 const solved=submitGuess(wrong,p,p.answer);assert.equal(solved.status,'completed');assert.equal(solved.attempts.length,2);
 let failure=start;for(const w of p.acceptedAnagrams.filter(w=>w!==p.answer).slice(0,p.maxAttempts))failure=submitGuess(failure,p,w);
 assert.equal(failure.status,'failed');assert.ok(failure.message.includes(p.answer));
 const replay=submitGuess(replayGame(p),p,p.answer);assert.equal(replay.status,'completed');
 const progress=emptyDailyProgress();assert.equal(recordCompletion(progress,p,replay),progress);
}
for(let i=0;i<90;i++){
 const date=new Date(Date.parse('2026-11-03T00:00:00Z')+i*86400000).toISOString().slice(0,10);
 const p=scheduledChallenge(date,date);assert.equal(p.sourceId,INVENTORY_V2[i].id);assert.equal(p.isRepeat,false);
 assert.equal(p.id,`daily-${date}`);assert.deepEqual(p,scheduledChallenge(date,'2099-12-31'));
}
assert.equal(scheduledChallenge('2026-11-03','2026-11-02'),null);
assert.equal(scheduledChallenge('2027-02-01','2027-02-01').sourceId,INVENTORY_V2[0].id);
assert.equal(scheduledChallenge('2027-02-01','2027-02-01').isRepeat,true);
assert.equal(scheduledChallenge('2027-02-01','2027-02-01').repeatCycle,1);
assert.deepEqual(inventoryStatus('2026-11-02'),{totalDistinct:97,publishedDistinct:7,unpublishedDistinct:90,uniqueThrough:'2027-01-31',warning:false});
assert.equal(inventoryStatus('2027-01-01').warning,false);assert.equal(inventoryStatus('2027-01-02').warning,true);
assert.equal(inventoryStatus('2027-01-31').unpublishedDistinct,0);
const warnings=[];runChallengeValidation({instant:new Date('2027-01-02T17:00:00Z'),logger:{log(){},error(){},warn(s){warnings.push(s);}}});assert.ok(warnings.some(s=>s.includes('DAILY INVENTORY LOW')));
// Appending a version does not remap any earlier date, including legacy practice.
const extra={id:'puzzle-v3-001',answer:'time',letters:'emit',clue:'What a clock measures as seconds and minutes go by.',difficulty:'easy',maxAttempts:3,acceptedAnagrams:['emit','item','mite','time']};
const batch={version:3,start:'2027-02-01',puzzles:[extra],fingerprint:fingerprint([extra])};
const extended=[...PUBLICATION_BATCHES,batch];assert.equal(validateInventories({batches:extended}).passed,true);
for(let epoch=Date.parse('2026-09-18');epoch<Date.parse(batch.start);epoch+=86400000){
 const date=new Date(epoch).toISOString().slice(0,10);assert.deepEqual(scheduledChallenge(date,'2028-01-01'),scheduledChallenge(date,'2028-01-01',extended));
}
assert.equal(scheduledChallenge(batch.start,batch.start,extended).sourceId,extra.id);
for(const [mutate,pattern] of [
 [b=>b[0].start='2026-11-04',/metadata/],
 [b=>b[0].puzzles[1]={...b[0].puzzles[0]},/Duplicate/],
 [b=>b[0].puzzles[0].acceptedAnagrams.pop(),/exhaustive/],
 [b=>b[0].puzzles[0].letters='zzzz',/multiset/],
 [b=>b[0].puzzles[0].difficulty='hard',/Difficulty/],
 [b=>b[0].puzzles[0].clue='The answer is '+b[0].puzzles[0].answer,/clue/],
 [b=>b.push({...batch,start:'2026-12-01'}),/overlapping/],
]){const copy=structuredClone(PUBLICATION_BATCHES);mutate(copy);const r=validateInventories({batches:copy});assert.equal(r.passed,false);assert.match(r.errors.join(' '),pattern);}
console.log('PASS: 97 genuine distinct puzzles, 90 new playable completion/failure/replay cases, 30/40/20 distribution, immutable assignments, 90-day repeat cycle, append-only expansion, inventory warning and rejection cases');

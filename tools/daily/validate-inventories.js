import { DISALLOWED_NEW_ANAGRAMS } from './content-policy.js';
import { createHash } from 'node:crypto';
import { WORDS } from '../../src/data/words.js';
import { DAILY_CHALLENGES } from '../../src/daily/challenges.js';
import { PUBLICATION_BATCHES } from '../../src/daily/publication-batches.js';
import { letterSignature, parseCalendarDate, validateChallengeDataset, bogotaDateFromInstant } from '../../src/daily/challenge-model.js';
import { inventoryStatus } from '../../src/daily/schedule.js';
export const fingerprint = puzzles => createHash('sha256').update(JSON.stringify(puzzles)).digest('hex');
export const normalizedPuzzleSignature = puzzle => `${letterSignature(puzzle.letters)}:${[...new Set(puzzle.acceptedAnagrams)].sort().join(',')}`;
export function validateInventories({batches=PUBLICATION_BATCHES,dictionary=WORDS,today=bogotaDateFromInstant()}={}) {
 const errors=[]; const signatures=new Set(); const letterSets=new Set(); const answers=new Set(); const ids=new Set(); const clues=new Set();
 for(const p of DAILY_CHALLENGES){signatures.add(normalizedPuzzleSignature(p));letterSets.add(letterSignature(p.letters));answers.add(p.answer);ids.add(p.id);clues.add(p.clue.toLowerCase());}
 const v2=batches[0];
 if(v2?.version!==2||v2.start!=='2026-11-03'||v2.fingerprint!=='b040e0abb1cc039952136d0897ed6c19075893106ace36ed5ae775cf4f039606')errors.push('Immutable V2 publication metadata changed');
 let end=null,version=1;
 for(const batch of batches){
  const start=parseCalendarDate(batch.start);
  if(!start||batch.start<='2026-09-24'||(end&&start.epoch<end)||!Number.isInteger(batch.version)||batch.version<=version){errors.push('Invalid/overlapping batch start or version');continue;}
  if(!Array.isArray(batch.puzzles)||!batch.puzzles.length){errors.push('Empty/malformed batch');continue;}
  if(fingerprint(batch.puzzles)!==batch.fingerprint)errors.push('Immutable inventory fingerprint changed');
  end=start.epoch+batch.puzzles.length*86400000;version=batch.version;
  const dated=batch.puzzles.map((p,i)=>{const date=new Date(start.epoch+i*86400000).toISOString().slice(0,10);return {...p,id:`daily-${date}`,date};});
  errors.push(...validateChallengeDataset(dated,dictionary,{expectedCount:batch.puzzles.length,canonicalDate:today}).errors);
  for(const p of batch.puzzles){
   if(!new RegExp(`^puzzle-v${batch.version}-[0-9]{3,}$`).test(p.id)||ids.has(p.id))errors.push('Duplicate/malformed content ID');
   const signature=normalizedPuzzleSignature(p),letters=letterSignature(p.letters);
   if(signatures.has(signature)||letterSets.has(letters)||answers.has(p.answer))errors.push('Duplicate/equivalent puzzle');
   if(clues.has(p.clue.toLowerCase()))errors.push('Duplicate clue');
   if(p.acceptedAnagrams.some(w=>DISALLOWED_NEW_ANAGRAMS.has(w)))errors.push('Disallowed new accepted anagram');
   const n=p.answer.length;
   if(p.difficulty==='easy'?n<4||n>5:p.difficulty==='medium'?n!==6:n<7||n>8)errors.push('Difficulty/length mismatch');
   if(p.acceptedAnagrams.length<4||p.acceptedAnagrams.length>9||p.maxAttempts!==Math.min(6,p.acceptedAnagrams.length-1))errors.push('Alternative-count/attempt policy mismatch');
   ids.add(p.id);signatures.add(signature);letterSets.add(letters);answers.add(p.answer);clues.add(p.clue.toLowerCase());
  }
 }
 if(signatures.size<90)errors.push('At least 90 distinct puzzles required');
 const status=errors.length ? null : inventoryStatus(today,batches);
 return {passed:!errors.length,errors,distinctCount:signatures.size,status};
}

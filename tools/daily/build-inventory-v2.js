import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { WORDS } from '../../src/data/words.js';
import { DAILY_CHALLENGES } from '../../src/daily/challenges.js';
import { letterSignature, validateChallengeDataset } from '../../src/daily/challenge-model.js';
const source = JSON.parse(fs.readFileSync(new URL('./content/inventory-v2-authored.json',import.meta.url),'utf8'));
const pattern=['easy','medium','hard','medium','easy','medium','hard','easy','medium'];
const cursors={easy:0,medium:0,hard:0};
const groups=new Map();
for(const {w} of WORDS){const key=letterSignature(w);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(w);}
const signatures=new Set(DAILY_CHALLENGES.map(c=>letterSignature(c.letters)));
const rejected=[];const records=[];
import { DISALLOWED_NEW_ANAGRAMS as forbidden } from './content-policy.js';
for(let i=0;i<90;i++){
 const difficulty=pattern[i%pattern.length];const row=source[difficulty]?.[cursors[difficulty]++];
 if(!row){rejected.push(`Missing ${difficulty} entry at position ${i+1}`);continue;}
 const [answer,clue]=row;const letters=[...answer].reverse().join('');const key=letterSignature(answer);const acceptedAnagrams=[...(groups.get(key)||[])].sort();
 const expected=difficulty==='easy'?answer.length>=4&&answer.length<=5:difficulty==='medium'?answer.length===6:answer.length>=7&&answer.length<=8;
 if(signatures.has(key)||!acceptedAnagrams.includes(answer)||acceptedAnagrams.length<4||acceptedAnagrams.length>9||!expected||acceptedAnagrams.some(w=>forbidden.has(w))) {rejected.push(`Rejected ${answer}: duplicate, dictionary, alternative-count, difficulty or content screen`);continue;}
 signatures.add(key);
 records.push({id:`puzzle-v2-${String(i+1).padStart(3,'0')}`,answer,letters,clue,difficulty,maxAttempts:Math.min(6,acceptedAnagrams.length-1),acceptedAnagrams});
}
for(const level of Object.keys(cursors))if(cursors[level]!==source[level]?.length)rejected.push(`Unused ${level} entries`);
const start=Date.parse('2026-11-03T00:00:00Z');
const dated=records.map((r,i)=>{const date=new Date(start+i*86400000).toISOString().slice(0,10);return {...r,id:`daily-${date}`,date};});
const check=validateChallengeDataset(dated,WORDS,{expectedCount:90});rejected.push(...check.errors);
if(rejected.length)throw Error(rejected.join('\n'));
const fingerprint=createHash('sha256').update(JSON.stringify(records)).digest('hex');
const output=`// Generated deterministically from reviewed authoring inputs. Immutable once published.\nexport const INVENTORY_V2 = Object.freeze(${JSON.stringify(records,null,2)});\n`;
const report=['# V2 puzzle quality review report','',`90 accepted; 0 rejected among the final authored selections. Earlier dictionary groups with fewer than four or more than nine alternatives were excluded from candidate discovery. No claim of independent human review.`, '',`Fingerprint: ${fingerprint}`,'','30 easy / 40 medium / 20 hard. Original seven are separate and unchanged. Each row has a unique sorted-letter signature; accepted sets are exhaustive.','', '| ID | Target | Letters | Clue | Difficulty | Attempts | All accepted dictionary anagrams |','|---|---|---|---|---|---|---|',...records.map(r=>`| ${r.id} | ${r.answer} | ${r.letters} | ${r.clue} | ${r.difficulty} (${r.answer.length} letters) | ${r.maxAttempts} | ${r.acceptedAnagrams.join(', ')} |`),''].join('\n');
const destinations=[[new URL('../../src/daily/inventory-v2.js',import.meta.url),output],[new URL('../../docs/DAILY_INVENTORY_V2_REVIEW.md',import.meta.url),report]];
if(process.argv.includes('--write')){for(const [url,text]of destinations)fs.writeFileSync(url,text);}
else for(const [url,text]of destinations)if(fs.readFileSync(url,'utf8')!==text)throw Error(`Generated content drift: ${fileURLToPath(url)}`);
console.log(`PASS: 90 distinct V2 puzzles, deterministic output, exhaustive dictionary answers; fingerprint ${fingerprint}`);

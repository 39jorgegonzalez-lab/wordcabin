
import { WORDS } from '../data/words.js';
import { solveWords } from './solver.js';
function assert(condition, message){ if(!condition){ throw new Error(message); } }
const solved = solveWords({ letters: 'elgnriat', dictionary: WORDS });
const found = solved.results.map(x => x.word);
assert(found.includes('triangle'), 'triangle should be found');
assert(found.some(w => w.length < 8), 'shorter words should be found');
assert(found.includes('angle'), 'angle should be found');
assert(found.includes('train'), 'train should be found');
console.log('All WordCabin solver tests passed.');

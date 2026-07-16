
import { WORDS } from '../data/words.js';
import {
  canBuildWord,
  passesFilters,
  solveWords,
  wordScore,
} from './solver.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  assert(
    Object.is(actual, expected),
    `${message}: expected ${expected}, received ${actual}`,
  );
}

const solved = solveWords({
  letters: 'elgnriat',
  dictionary: WORDS,
});

const found = solved.results.map((item) => item.word);

assert(found.includes('triangle'), 'triangle should be found');
assert(
  found.some((word) => word.length < 8),
  'shorter words should be found',
);
assert(found.includes('angle'), 'angle should be found');
assert(found.includes('train'), 'train should be found');

assertEqual(
  canBuildWord('cat', 'tact'),
  false,
  'repeated letters should require enough tiles',
);

assertEqual(
  canBuildWord('cat?', 'tact'),
  true,
  'a wildcard should satisfy one missing repeated letter',
);

assertEqual(
  passesFilters('cat', { length: '' }),
  true,
  'blank Length should not filter results',
);

assertEqual(
  passesFilters('cat', { length: '3' }),
  true,
  'positive whole-number Length should match exactly',
);

assertEqual(
  passesFilters('cat', { length: '4' }),
  false,
  'nonmatching positive Length should be rejected',
);

for (const invalidLength of [
  'abc',
  '2.5',
  '3.0',
  '0',
  '-1',
  '03',
]) {
  assertEqual(
    passesFilters('cat', { length: invalidLength }),
    false,
    `invalid Length ${invalidLength} should be rejected`,
  );
}

const wildcardSolved = solveWords({
  letters: 'q?',
  dictionary: [{ w: 'qi', common: true }],
  filters: { length: '2' },
});

assertEqual(
  wildcardSolved.results[0]?.score,
  10,
  'a wildcard tile should contribute zero points',
);

assertEqual(
  wildcardSolved.results[0]?.exact,
  true,
  'a wildcard-assisted full-rack word should be exact',
);

const allWildcardSolved = solveWords({
  letters: '??',
  dictionary: [{ w: 'qi', common: true }],
  filters: { length: '2' },
});

assertEqual(
  allWildcardSolved.results[0]?.score,
  0,
  'two wildcard tiles should contribute zero points',
);

assertEqual(
  allWildcardSolved.results[0]?.exact,
  true,
  'an all-wildcard full-rack word should be exact',
);

assertEqual(
  wordScore('qi'),
  11,
  'generic wordScore should retain full letter values',
);


const lengthPrioritySolved = solveWords({
  letters: 'train',
  dictionary: [
    { w: 'rain', common: true },
    { w: 'train', common: false },
  ],
});

assertEqual(
  lengthPrioritySolved.results[0]?.word,
  'train',
  'longer words should rank before shorter common words',
);

const scorePrioritySolved = solveWords({
  letters: 'zape',
  dictionary: [
    { w: 'ape', common: true },
    { w: 'zap', common: false },
  ],
});

assertEqual(
  scorePrioritySolved.results[0]?.word,
  'zap',
  'higher tile score should rank before common status at equal length',
);

const commonTieBreakSolved = solveWords({
  letters: 'act',
  dictionary: [
    { w: 'act', common: false },
    { w: 'cat', common: true },
  ],
});

assertEqual(
  commonTieBreakSolved.results[0]?.word,
  'cat',
  'common status should break equal-length equal-score ties',
);

const alphabeticalTieBreakSolved = solveWords({
  letters: 'act',
  dictionary: [
    { w: 'cat', common: false },
    { w: 'act', common: false },
  ],
});

assertEqual(
  alphabeticalTieBreakSolved.results[0]?.word,
  'act',
  'alphabetical order should break complete ranking ties',
);

assert(
  Array.isArray(scorePrioritySolved.results),
  'solveWords should continue returning a results array',
);

assert(
  scorePrioritySolved.grouped &&
    typeof scorePrioritySolved.grouped === 'object',
  'solveWords should continue returning grouped results',
);

assertEqual(
  scorePrioritySolved.best,
  scorePrioritySolved.results[0],
  'best should reference the first ranked result',
);

assertEqual(
  scorePrioritySolved.meta.returned,
  scorePrioritySolved.results.length,
  'meta.returned should match the returned result count',
);

console.log('All WordCabin solver tests passed.');


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

console.log('All WordCabin solver tests passed.');
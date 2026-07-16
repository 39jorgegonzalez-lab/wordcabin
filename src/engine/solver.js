
export const LETTER_SCORES = Object.freeze({
  a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10
});

export function normalizeLetters(value = '') {
  return String(value).toLowerCase().replace(/[^a-z?]/g, '');
}

export function normalizeWord(value = '') {
  return String(value).toLowerCase().replace(/[^a-z]/g, '');
}

export function letterCounts(value = '') {
  const counts = Object.create(null);
  let wildcards = 0;
  for (const char of normalizeLetters(value)) {
    if (char === '?') wildcards += 1;
    else counts[char] = (counts[char] || 0) + 1;
  }
  return { counts, wildcards };
}

function analyzeBuild(inputLetters, word) {
  const { counts, wildcards } = letterCounts(inputLetters);
  let remainingWildcards = wildcards;
  let score = 0;

  for (const char of normalizeWord(word)) {
    if (counts[char] > 0) {
      counts[char] -= 1;
      score += LETTER_SCORES[char] || 0;
    } else if (remainingWildcards > 0) {
      remainingWildcards -= 1;
    } else {
      return { canBuild: false, score: 0 };
    }
  }

  return { canBuild: true, score };
}

export function canBuildWord(inputLetters, word) {
  return analyzeBuild(inputLetters, word).canBuild;
}

export function wordScore(word) {
  return normalizeWord(word).split('').reduce((sum, char) => sum + (LETTER_SCORES[char] || 0), 0);
}

export function passesFilters(word, filters = {}) {
  const clean = normalizeWord(word);
  const startsWith = normalizeWord(filters.startsWith || '');
  const endsWith = normalizeWord(filters.endsWith || '');
  const contains = normalizeWord(filters.contains || '');
  const length = String(filters.length ?? '').trim();
  if (startsWith && !clean.startsWith(startsWith)) return false;
  if (endsWith && !clean.endsWith(endsWith)) return false;
  if (contains && !clean.includes(contains)) return false;
  if (length) {
    if (!/^[1-9]\d*$/.test(length)) return false;
    if (clean.length !== Number(length)) return false;
  }
  return true;
}

export function solveWords({ letters, dictionary, filters = {}, minLength = 2, limit = 500 }) {
  const cleanLetters = normalizeLetters(letters);
  if (!cleanLetters || cleanLetters.length < minLength) {
    return { results: [], grouped: {}, best: null, meta: { searched: 0, returned: 0 } };
  }

  const candidates = [];
  for (const entry of dictionary) {
    const word = entry.w;
    if (!word || word.length < minLength || word.length > cleanLetters.length) continue;
    if (!passesFilters(word, filters)) continue;
    const build = analyzeBuild(cleanLetters, word);
    if (!build.canBuild) continue;
    candidates.push({
      word,
      length: word.length,
      score: build.score,
      common: Boolean(entry.common),
      exact: word.length === cleanLetters.length
    });
  }

  candidates.sort((a, b) =>
    b.length - a.length ||
    b.score - a.score ||
    Number(b.common) - Number(a.common) ||
    a.word.localeCompare(b.word)
  );

  const results = candidates.slice(0, limit);
  const grouped = results.reduce((acc, item) => {
    const key = String(item.length);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return { results, grouped, best: results[0] || null, meta: { searched: dictionary.length, returned: results.length } };
}

export const DAILY_TIME_ZONE = "America/Bogota";
export const DAILY_ROUTE_PREFIX = "/daily-word-challenge";
export const SUPPORTED_DIFFICULTIES = Object.freeze(["easy", "medium", "hard"]);

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ID_PATTERN = /^daily-(\d{4}-\d{2}-\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseCalendarDate(value) {
  const match = DATE_PATTERN.exec(String(value ?? ""));
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { value: `${yearText}-${monthText}-${dayText}`, year, month, day, epoch: date.getTime() };
}

export function bogotaDateFromInstant(instant = new Date()) {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) throw new TypeError("A valid instant is required.");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DAILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function letterSignature(value) {
  return [...String(value ?? "").toLowerCase()].sort().join("");
}

export function orderChallenges(challenges) {
  return [...challenges].sort((a, b) => a.date.localeCompare(b.date));
}

export function challengeRoute(challengeOrDate) {
  const date = typeof challengeOrDate === "string" ? challengeOrDate : challengeOrDate.date;
  return `${DAILY_ROUTE_PREFIX}/${date}/`;
}

export function getPublishedChallenges(challenges, canonicalDate = bogotaDateFromInstant()) {
  return orderChallenges(challenges).filter((challenge) => challenge.date <= canonicalDate);
}

export function selectTodayOrLatest(challenges, canonicalDate = bogotaDateFromInstant()) {
  const published = getPublishedChallenges(challenges, canonicalDate);
  const today = published.find((challenge) => challenge.date === canonicalDate);
  const challenge = today ?? published.at(-1) ?? null;
  return { challenge, isToday: Boolean(today), canonicalDate };
}

export function findChallengeByPath(challenges, pathname) {
  const match = /^\/daily-word-challenge\/(\d{4}-\d{2}-\d{2})\/$/.exec(pathname);
  if (!match || !parseCalendarDate(match[1])) return null;
  return challenges.find((challenge) => challenge.date === match[1]) ?? null;
}

export function getChallengeNavigation(challenges, challenge) {
  const ordered = orderChallenges(challenges);
  const index = ordered.findIndex((entry) => entry.id === challenge?.id);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

export function computeStreaks(challenges, completions, canonicalDate = bogotaDateFromInstant()) {
  const published = getPublishedChallenges(challenges, canonicalDate);
  const completedIds = new Set(
    Object.entries(completions ?? {})
      .filter(([, completion]) => completion && typeof completion === "object")
      .map(([id]) => id),
  );
  let longest = 0;
  let run = 0;
  for (const challenge of published) {
    if (completedIds.has(challenge.id)) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  let current = 0;
  for (let index = published.length - 1; index >= 0; index -= 1) {
    if (!completedIds.has(published[index].id)) break;
    current += 1;
  }
  return { current, longest };
}

function dictionaryWordSet(dictionary) {
  return new Set(
    (dictionary ?? []).map((entry) => (typeof entry === "string" ? entry : entry?.w)).filter(Boolean),
  );
}

export function validateChallengeDataset(
  challenges,
  dictionary,
  { expectedCount = 7, canonicalDate = bogotaDateFromInstant() } = {},
) {
  const errors = [];
  const warnings = [];
  const words = dictionaryWordSet(dictionary);
  if (!Array.isArray(challenges)) {
    return { passed: false, errors: ["Challenge data must be an array."], warnings, inventory: null };
  }
  if (expectedCount !== null && challenges.length !== expectedCount) {
    errors.push(`Expected exactly ${expectedCount} challenge records; received ${challenges.length}.`);
  }
  const ids = new Set();
  const dates = new Set();
  const answers = new Set();
  const signatures = new Set();

  for (const [index, challenge] of challenges.entries()) {
    const label = `Challenge ${index + 1}`;
    if (!challenge || typeof challenge !== "object" || Array.isArray(challenge)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    const parsedDate = parseCalendarDate(challenge.date);
    if (!parsedDate) errors.push(`${label} has an invalid publication date.`);
    if (typeof challenge.id !== "string" || !ID_PATTERN.test(challenge.id)) {
      errors.push(`${label} has a malformed id.`);
    } else if (parsedDate && challenge.id !== `daily-${parsedDate.value}`) {
      errors.push(`${label} id must explicitly match its publication date.`);
    }
    if (ids.has(challenge.id)) errors.push(`${label} duplicates id ${challenge.id}.`);
    ids.add(challenge.id);
    if (dates.has(challenge.date)) errors.push(`${label} duplicates date ${challenge.date}.`);
    dates.add(challenge.date);

    const answer = String(challenge.answer ?? "");
    const letters = String(challenge.letters ?? "");
    if (!/^[a-z]{4,12}$/.test(answer)) errors.push(`${label} has a malformed answer.`);
    if (!/^[a-z]{4,12}$/.test(letters)) errors.push(`${label} has malformed display letters.`);
    if (answers.has(answer)) errors.push(`${label} duplicates answer ${answer}.`);
    answers.add(answer);
    const signature = letterSignature(answer);
    if (signatures.has(signature)) errors.push(`${label} duplicates a letter signature.`);
    signatures.add(signature);
    if (letterSignature(letters) !== signature) errors.push(`${label} letters do not match the answer multiset.`);
    if (letters === answer) errors.push(`${label} displays the answer in sequence.`);
    if (!words.has(answer)) errors.push(`${label} answer is absent from the production dictionary.`);

    const clue = typeof challenge.clue === "string" ? challenge.clue.trim() : "";
    if (clue.length < 20 || clue.length > 180) errors.push(`${label} has a malformed clue.`);
    if (answer && clue.toLowerCase().includes(answer)) errors.push(`${label} clue contains the answer.`);
    if (!SUPPORTED_DIFFICULTIES.includes(challenge.difficulty)) errors.push(`${label} has an unsupported difficulty.`);
    if (!Number.isInteger(challenge.maxAttempts) || challenge.maxAttempts < 1 || challenge.maxAttempts > 8) {
      errors.push(`${label} has an invalid attempt limit.`);
    }

    if (!Array.isArray(challenge.acceptedAnagrams) || challenge.acceptedAnagrams.length === 0) {
      errors.push(`${label} must declare accepted full-length anagrams.`);
      continue;
    }
    const accepted = [...new Set(challenge.acceptedAnagrams)];
    if (accepted.length !== challenge.acceptedAnagrams.length) errors.push(`${label} repeats an accepted anagram.`);
    for (const acceptedWord of accepted) {
      if (!words.has(acceptedWord)) errors.push(`${label} accepted anagram ${acceptedWord} is absent from the production dictionary.`);
      if (letterSignature(acceptedWord) !== signature) errors.push(`${label} accepted anagram ${acceptedWord} has different letters.`);
    }
    const exhaustive = [...words].filter((word) => word.length === answer.length && letterSignature(word) === signature).sort();
    if (JSON.stringify([...accepted].sort()) !== JSON.stringify(exhaustive)) {
      errors.push(`${label} accepted anagrams are not exhaustive for the production dictionary.`);
    }
    if (!accepted.includes(answer)) errors.push(`${label} accepted anagrams omit the target answer.`);
    if (Number.isInteger(challenge.maxAttempts) && challenge.maxAttempts > Math.max(1, accepted.length - 1)) {
      errors.push(`${label} attempt limit cannot be exhausted by its valid-but-wrong anagrams.`);
    }
  }

  const ordered = orderChallenges(challenges.filter((challenge) => parseCalendarDate(challenge?.date)));
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = parseCalendarDate(ordered[index - 1].date);
    const current = parseCalendarDate(ordered[index].date);
    if (current.epoch - previous.epoch !== DAY_MS) {
      errors.push("The initial challenge publication dates must be contiguous.");
      break;
    }
  }

  const futureCount = ordered.filter((challenge) => challenge.date > canonicalDate).length;
  const inventory = { canonicalDate, futureCount, totalCount: ordered.length };
  if (futureCount < 7) {
    warnings.push(
      `Challenge inventory warning: only ${futureCount} future unpublished challenge${futureCount === 1 ? " remains" : "s remain"} after ${canonicalDate}; stock at least seven.`,
    );
  }
  return { passed: errors.length === 0, errors, warnings, inventory };
}

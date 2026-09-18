export const DAILY_STORAGE_KEY = "wordcabin.daily.v1";
export const DAILY_STORAGE_VERSION = 1;

export function emptyDailyProgress() {
  return { version: DAILY_STORAGE_VERSION, completions: {} };
}

function validCompletion(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.completedAt === "string" &&
    !Number.isNaN(Date.parse(value.completedAt)) &&
    Number.isInteger(value.attempts) &&
    value.attempts > 0 &&
    typeof value.solution === "string" &&
    /^[a-z]+$/.test(value.solution)
  );
}

export function sanitizeDailyProgress(value, challengeIds = null) {
  if (!value || typeof value !== "object" || value.version !== DAILY_STORAGE_VERSION) {
    return emptyDailyProgress();
  }
  const allowed = challengeIds ? new Set(challengeIds) : null;
  const completions = {};
  if (value.completions && typeof value.completions === "object" && !Array.isArray(value.completions)) {
    for (const [id, completion] of Object.entries(value.completions)) {
      if (/^daily-\d{4}-\d{2}-\d{2}$/.test(id) && (!allowed || allowed.has(id)) && validCompletion(completion)) {
        completions[id] = {
          completedAt: completion.completedAt,
          attempts: completion.attempts,
          solution: completion.solution,
        };
      }
    }
  }
  return { version: DAILY_STORAGE_VERSION, completions };
}

export function readDailyProgress(storage = globalThis.localStorage, challengeIds = null) {
  try {
    const raw = storage?.getItem(DAILY_STORAGE_KEY);
    if (!raw) return emptyDailyProgress();
    return sanitizeDailyProgress(JSON.parse(raw), challengeIds);
  } catch {
    return emptyDailyProgress();
  }
}

export function writeDailyProgress(progress, storage = globalThis.localStorage) {
  try {
    storage?.setItem(DAILY_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function recordCompletion(progress, challenge, state, completedAt = new Date()) {
  if (!challenge || state?.status !== "completed" || state.replay) return progress;
  if (progress.completions[challenge.id]) return progress;
  return {
    version: DAILY_STORAGE_VERSION,
    completions: {
      ...progress.completions,
      [challenge.id]: {
        completedAt: completedAt.toISOString(),
        attempts: state.attempts.length,
        solution: challenge.answer,
      },
    },
  };
}

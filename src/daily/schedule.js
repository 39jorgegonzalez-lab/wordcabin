// Rotation v1 is immutable: do not reorder/change its source records.
// Seven intentionally repeating practice puzzles, not unlimited unique content.
import { DAILY_CHALLENGES } from './challenges.js';
import { bogotaDateFromInstant, parseCalendarDate } from './challenge-model.js';
export const SCHEDULE_VERSION = 1;
export const ROTATION_START = '2026-09-25';
export const SCHEDULE_END = '2099-12-31';
const DAY = 86400000;
const first = parseCalendarDate(DAILY_CHALLENGES[0].date).epoch;
const rotationEpoch = parseCalendarDate(ROTATION_START).epoch;

export function scheduledChallenge(date, today = bogotaDateFromInstant()) {
  const parsed = parseCalendarDate(date);
  if (!parsed || date > today || date > SCHEDULE_END || parsed.epoch < first) return null;
  const original = DAILY_CHALLENGES.find(entry => entry.date === date);
  if (original) return original;
  if (date < ROTATION_START || DAILY_CHALLENGES.length !== 7) return null;
  const source = DAILY_CHALLENGES[((parsed.epoch - rotationEpoch) / DAY) % 7];
  return { ...source, id: `daily-${date}`, date, rotationVersion: SCHEDULE_VERSION, sourceId: source.id };
}

export function scheduledChallenges(today = bogotaDateFromInstant()) {
  const parsed = parseCalendarDate(today);
  if (!parsed || today < DAILY_CHALLENGES[0].date) return [];
  const end = Math.min(parsed.epoch, parseCalendarDate(SCHEDULE_END).epoch);
  const results = [];
  for (let day = first; day <= end; day += DAY) {
    const date = new Date(day).toISOString().slice(0, 10);
    const challenge = scheduledChallenge(date, today);
    if (challenge) results.push(challenge);
  }
  return results;
}

export function scheduledPath(pathname, today = bogotaDateFromInstant()) {
  const match = /^\/daily-word-challenge\/(\d{4}-\d{2}-\d{2})\/$/.exec(pathname);
  return match ? scheduledChallenge(match[1], today) : null;
}

export function recentArchive(published) {
  const dates = new Set(published.slice(-30).map(item => item.date));
  for (const original of DAILY_CHALLENGES) dates.add(original.date);
  return published.filter(item => dates.has(item.date));
}

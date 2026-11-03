// Rotation v1 is immutable: do not reorder/change its source records.
// V1 mappings before the V2 cutover are retained. Later versions are append-only.
import { DAILY_CHALLENGES } from './challenges.js';
import { PUBLICATION_BATCHES } from './publication-batches.js';
import { bogotaDateFromInstant, parseCalendarDate } from './challenge-model.js';
export const SCHEDULE_VERSION = 2;
export const ROTATION_START = '2026-09-25';
export const SCHEDULE_END = '2099-12-31';
const DAY = 86400000;
const first = parseCalendarDate(DAILY_CHALLENGES[0].date).epoch;
const rotationEpoch = parseCalendarDate(ROTATION_START).epoch;

export function scheduledChallenge(date, today = bogotaDateFromInstant(), batches = PUBLICATION_BATCHES) {
  const parsed = parseCalendarDate(date);
  if (!parsed || date > today || date > SCHEDULE_END || parsed.epoch < first) return null;
  const original = DAILY_CHALLENGES.find(entry => entry.date === date);
  if (original) return original;
  const batch = [...batches].reverse().find(entry => entry.start <= date);
  if (batch) {
    if (!batch.puzzles.length) return null;
    const ordinal = (parsed.epoch - parseCalendarDate(batch.start).epoch) / DAY;
    const source = batch.puzzles[ordinal % batch.puzzles.length];
    return {...source, id:`daily-${date}`, date, inventoryVersion:batch.version, sourceId:source.id,
      isRepeat:ordinal >= batch.puzzles.length, repeatCycle:Math.floor(ordinal / batch.puzzles.length)};
  }
  if (date < ROTATION_START || DAILY_CHALLENGES.length !== 7) return null;
  const source = DAILY_CHALLENGES[((parsed.epoch - rotationEpoch) / DAY) % 7];
  return { ...source, id: `daily-${date}`, date, rotationVersion: 1, sourceId: source.id };
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

export function inventoryStatus(today = bogotaDateFromInstant(), batches = PUBLICATION_BATCHES) {
  const originalPublished = DAILY_CHALLENGES.filter(p=>p.date<=today).length;
  let published = originalPublished;
  let upcoming = DAILY_CHALLENGES.length-originalPublished;
  for (const batch of batches) {
    const elapsed = Math.max(0, Math.floor((parseCalendarDate(today).epoch-parseCalendarDate(batch.start).epoch)/DAY)+1);
    const used = Math.min(batch.puzzles.length, elapsed);
    published += used; upcoming += batch.puzzles.length-used;
  }
  const last=batches.at(-1);
  const uniqueThrough=last ? new Date(parseCalendarDate(last.start).epoch+(last.puzzles.length-1)*DAY).toISOString().slice(0,10) : DAILY_CHALLENGES.at(-1).date;
  return {totalDistinct:DAILY_CHALLENGES.length+batches.reduce((n,b)=>n+b.puzzles.length,0),publishedDistinct:published,unpublishedDistinct:upcoming,uniqueThrough,warning:upcoming<30};
}

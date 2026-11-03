import React, { useEffect, useMemo, useState } from "react";

import { scheduledChallenges } from "./schedule.js";
import { usePublicationDate } from "./use-publication-date.js";
import {
  challengeRoute,
  computeStreaks,
  selectTodayOrLatest,
} from "./challenge-model.js";
import { DAILY_STORAGE_KEY, readDailyProgress } from "./storage.js";

export function DailyPromo() {
  const canonicalDate = usePublicationDate();
  const published = useMemo(() => scheduledChallenges(canonicalDate), [canonicalDate]);
  const challengeIds = useMemo(() => published.map((challenge) => challenge.id), [published]);
  const [progress, setProgress] = useState(() => readDailyProgress(undefined, challengeIds));
  useEffect(() => {
    const refresh = (event) => {
      if (event.key === DAILY_STORAGE_KEY || event.key === null) setProgress(readDailyProgress(undefined, challengeIds));
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [challengeIds]);
  const selection = selectTodayOrLatest(published, canonicalDate);
  const streaks = computeStreaks(published, progress.completions, canonicalDate);
  const challenge = selection.challenge;

  if (!challenge) return null;
  const completed = Boolean(progress.completions[challenge.id]);

  return (
    <section className="dailyPromo" aria-labelledby="daily-promo-title">
      <div>
        <p className="eyebrow">Daily Word Challenge</p>
        <h2 id="daily-promo-title">
          {selection.isToday ? "Today’s challenge is ready." : "The latest challenge is ready."}
        </h2>
        <p>
          Unscramble one clue-driven word in a few focused attempts.
          {challenge.rotationVersion ? " Daily practice repeats a seven-puzzle collection weekly; 90 new puzzles begin November 3." : challenge.isRepeat ? " Repeat challenge from the collection." : ""}
          {completed ? " Completed on this device." : " Your progress stays on this device."}
        </p>
        {streaks.current > 0 && <strong className="dailyPromoStreak">Current streak: {streaks.current}</strong>}
      </div>
      <div className="dailyPromoActions">
        <a className="dailyPrimaryLink" href={challengeRoute(challenge)}>
          {completed ? "Play again" : selection.isToday ? "Play today’s challenge" : "Play latest challenge"}
        </a>
        <a href="/daily-word-challenge/">View archive</a>
      </div>
    </section>
  );
}

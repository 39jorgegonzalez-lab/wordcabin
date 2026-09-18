import React, { useMemo, useState } from "react";

import { DAILY_CHALLENGES } from "./challenges.js";
import {
  bogotaDateFromInstant,
  challengeRoute,
  computeStreaks,
  selectTodayOrLatest,
} from "./challenge-model.js";
import { readDailyProgress } from "./storage.js";

export function DailyPromo() {
  const challengeIds = useMemo(() => DAILY_CHALLENGES.map((challenge) => challenge.id), []);
  const [progress] = useState(() => readDailyProgress(undefined, challengeIds));
  const canonicalDate = bogotaDateFromInstant();
  const selection = selectTodayOrLatest(DAILY_CHALLENGES, canonicalDate);
  const streaks = computeStreaks(DAILY_CHALLENGES, progress.completions, canonicalDate);
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

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Flame, Home, RotateCcw } from "lucide-react";

import { emitDailyEvent } from "./analytics.js";
import { DAILY_CHALLENGES } from "./challenges.js";
import {
  DAILY_ROUTE_PREFIX,
  bogotaDateFromInstant,
  challengeRoute,
  computeStreaks,
  findChallengeByPath,
  getChallengeNavigation,
  getPublishedChallenges,
  selectTodayOrLatest,
} from "./challenge-model.js";
import { createGameState, replayGame, submitGuess } from "./game-reducer.js";
import {
  readDailyProgress,
  recordCompletion,
  writeDailyProgress,
} from "./storage.js";
import "./daily.css";

function displayDate(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${dateString}T12:00:00Z`));
}

function DailyHeader() {
  return (
    <header className="dailyHeader">
      <a className="dailyBrand" href="/"><Home size={22} /> WordCabin</a>
      <a href="/#tool">Open solver</a>
    </header>
  );
}

function ArchiveView({ published, progress, canonicalDate }) {
  const selection = selectTodayOrLatest(published, canonicalDate);
  const streaks = computeStreaks(published, progress.completions, canonicalDate);

  useEffect(() => {
    emitDailyEvent("daily_challenge_archive_view", {});
  }, []);

  return (
    <main className="dailyPage">
      <DailyHeader />
      <section className="dailyIntro">
        <p className="dailyEyebrow">Daily Word Challenge</p>
        <h1>A small word puzzle for every cabin visit.</h1>
        <p>Use each set of letters and its clue to find the intended word. Progress is stored only in this browser.</p>
        <div className="dailyStats" aria-label="Challenge progress">
          <span><Flame size={18} /> Current streak: <strong>{streaks.current}</strong></span>
          <span>Longest streak: <strong>{streaks.longest}</strong></span>
        </div>
        {selection.challenge && (
          <a className="dailyPrimaryLink" href={challengeRoute(selection.challenge)}>
            {selection.isToday ? "Play today’s challenge" : "Play latest challenge"}
          </a>
        )}
      </section>
      <section className="dailyArchive" aria-labelledby="archive-title">
        <h2 id="archive-title">Challenge archive</h2>
        <ul>
          {[...published].reverse().map((challenge) => {
            const completed = Boolean(progress.completions[challenge.id]);
            return (
              <li key={challenge.id}>
                <a href={challengeRoute(challenge)}>
                  <span>
                    <strong>{displayDate(challenge.date)}</strong>
                    <small>{challenge.difficulty} · {challenge.answer.length} letters</small>
                  </span>
                  <span className={completed ? "archiveStatus completed" : "archiveStatus"}>
                    {completed ? <><Check size={17} /> Completed</> : "Not completed"}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function ChallengeView({ challenge, published, progress, setProgress }) {
  const completion = progress.completions[challenge.id];
  const initialState = completion
    ? {
        ...createGameState(challenge),
        status: "completed",
        attempts: Array.from({ length: completion.attempts }, () => "recorded-attempt"),
        message: `Completed on this device in ${completion.attempts} attempt${completion.attempts === 1 ? "" : "s"}.`,
        feedback: "success",
      }
    : createGameState(challenge);
  const [game, setGame] = useState(initialState);
  const [guess, setGuess] = useState("");
  const [started, setStarted] = useState(false);
  const inputRef = useRef(null);
  const navigation = getChallengeNavigation(published, challenge);
  const attemptsRemaining = Math.max(0, challenge.maxAttempts - game.attempts.length);

  useEffect(() => {
    emitDailyEvent("daily_challenge_view", {
      challengeId: challenge.id,
      challengeDate: challenge.date,
      difficulty: challenge.difficulty,
      completionStatus: Boolean(completion),
    });
  }, [challenge.id]);

  const submit = (event) => {
    event.preventDefault();
    if (!started) {
      setStarted(true);
      emitDailyEvent("daily_challenge_start", {
        challengeId: challenge.id,
        challengeDate: challenge.date,
        difficulty: challenge.difficulty,
      });
    }
    const next = submitGuess(game, challenge, guess);
    const attemptConsumed = next.attempts.length > game.attempts.length;
    setGame(next);
    if (attemptConsumed) {
      emitDailyEvent("daily_challenge_guess", {
        challengeId: challenge.id,
        challengeDate: challenge.date,
        attemptNumber: next.attempts.length,
        difficulty: challenge.difficulty,
      });
      setGuess("");
    }
    if (next.status === "completed" && game.status !== "completed") {
      const updated = recordCompletion(progress, challenge, next);
      if (updated !== progress) {
        setProgress(updated);
        writeDailyProgress(updated);
      }
      emitDailyEvent("daily_challenge_complete", {
        challengeId: challenge.id,
        challengeDate: challenge.date,
        attemptNumber: next.attempts.length,
        difficulty: challenge.difficulty,
        completionStatus: true,
      });
    }
    if (next.status === "failed" && game.status !== "failed") {
      emitDailyEvent("daily_challenge_failed", {
        challengeId: challenge.id,
        challengeDate: challenge.date,
        attemptNumber: next.attempts.length,
        difficulty: challenge.difficulty,
        failureStatus: true,
      });
    }
    if (!["completed", "failed"].includes(next.status)) inputRef.current?.focus();
  };

  const replay = () => {
    setGame(replayGame(challenge));
    setGuess("");
    setStarted(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const navigate = (direction, target) => {
    emitDailyEvent("daily_challenge_navigation", {
      challengeId: challenge.id,
      challengeDate: challenge.date,
      direction,
    });
    window.location.assign(challengeRoute(target));
  };

  return (
    <main className="dailyPage">
      <DailyHeader />
      <article className="challengeCard">
        <p className="dailyEyebrow">Daily Word Challenge · {displayDate(challenge.date)}</p>
        <h1>Unscramble today’s cabin word.</h1>
        <p className="challengeClue"><strong>Clue:</strong> {challenge.clue}</p>
        <div className="letterTiles" aria-label={`Letters: ${challenge.letters.split("").join(", ")}`}>
          {challenge.letters.split("").map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}
        </div>
        <p className="attemptCount">
          {game.status === "completed" ? "Challenge completed" : game.status === "failed" ? "Challenge not solved" : `${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining`}
        </p>
        {!["completed", "failed"].includes(game.status) && (
          <form className="challengeForm" onSubmit={submit} noValidate>
            <label htmlFor="daily-guess">Your answer</label>
            <div>
              <input
                ref={inputRef}
                id="daily-guess"
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
                maxLength={challenge.answer.length + 2}
                aria-describedby="daily-feedback"
              />
              <button type="submit">Submit word</button>
            </div>
          </form>
        )}
        <p
          id="daily-feedback"
          className={`challengeFeedback ${game.feedback ?? ""}`}
          role="status"
          aria-live="polite"
        >
          {game.message || "Use every displayed letter exactly once."}
        </p>
        {game.attempts.length > 0 && !completion && (
          <p className="attemptHistory">Attempts used: {game.attempts.length} of {challenge.maxAttempts}</p>
        )}
        {["completed", "failed"].includes(game.status) && (
          <button className="dailyReplay" type="button" onClick={replay}>
            <RotateCcw size={17} /> Replay challenge
          </button>
        )}
        {game.replay && <p className="replayNotice">Replay mode does not change your original completion or streak.</p>}
      </article>
      <nav className="challengeNavigation" aria-label="Challenge navigation">
        {navigation.previous ? (
          <button type="button" onClick={() => navigate("previous", navigation.previous)}>
            <ArrowLeft size={18} /> Previous
          </button>
        ) : <span />}
        <a href={`${DAILY_ROUTE_PREFIX}/`}>Archive</a>
        {navigation.next ? (
          <button type="button" onClick={() => navigate("next", navigation.next)}>
            Next <ArrowRight size={18} />
          </button>
        ) : <span />}
      </nav>
    </main>
  );
}

export function DailyChallengeApp({ pathname = window.location.pathname }) {
  const canonicalDate = bogotaDateFromInstant();
  const published = useMemo(() => getPublishedChallenges(DAILY_CHALLENGES, canonicalDate), [canonicalDate]);
  const challengeIds = useMemo(() => DAILY_CHALLENGES.map((challenge) => challenge.id), []);
  const [progress, setProgress] = useState(() => readDailyProgress(undefined, challengeIds));
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;

  if (normalizedPath === `${DAILY_ROUTE_PREFIX}/`) {
    return <ArchiveView published={published} progress={progress} canonicalDate={canonicalDate} />;
  }
  const challenge = findChallengeByPath(published, normalizedPath);
  if (!challenge) {
    return (
      <main className="dailyPage">
        <DailyHeader />
        <section className="challengeUnavailable" role="alert">
          <h1>This challenge is unavailable.</h1>
          <p>Choose a published challenge from the archive.</p>
          <a className="dailyPrimaryLink" href={`${DAILY_ROUTE_PREFIX}/`}>Open archive</a>
        </section>
      </main>
    );
  }
  return <ChallengeView challenge={challenge} published={published} progress={progress} setProgress={setProgress} />;
}

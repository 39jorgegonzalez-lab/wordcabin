import { letterSignature } from "./challenge-model.js";

export function createGameState(challenge, { replay = false } = {}) {
  if (!challenge) {
    return { status: "error", attempts: [], message: "This challenge is unavailable.", replay: false };
  }
  return {
    status: replay ? "replay" : "ready",
    attempts: [],
    message: replay ? "Replay mode. Your original completion will not change." : "",
    replay,
  };
}

export function submitGuess(state, challenge, rawGuess) {
  if (!challenge) return createGameState(null);
  if (["completed", "failed", "error"].includes(state.status)) {
    return { ...state, message: "This round has ended. Choose replay to try again." };
  }
  const guess = String(rawGuess ?? "").trim().toLowerCase();
  if (!guess) return { ...state, message: "Enter a word before submitting.", feedback: "invalid" };
  if (!/^[a-z]+$/.test(guess)) {
    return { ...state, message: "Use letters A through Z only.", feedback: "invalid" };
  }
  if (guess.length !== challenge.answer.length) {
    return { ...state, message: `Enter a ${challenge.answer.length}-letter word.`, feedback: "invalid" };
  }
  if (letterSignature(guess) !== letterSignature(challenge.letters)) {
    return { ...state, message: "Use each displayed letter exactly once.", feedback: "invalid" };
  }
  if (!challenge.acceptedAnagrams.includes(guess)) {
    return { ...state, message: "Those letters form no approved dictionary word for this challenge.", feedback: "invalid" };
  }
  if (state.attempts.includes(guess)) {
    return { ...state, message: "You already tried that word.", feedback: "invalid" };
  }
  const attempts = [...state.attempts, guess];
  if (guess === challenge.answer) {
    return {
      ...state,
      status: "completed",
      attempts,
      message: `Solved in ${attempts.length} attempt${attempts.length === 1 ? "" : "s"}.`,
      feedback: "success",
    };
  }
  if (attempts.length >= challenge.maxAttempts) {
    return {
      ...state,
      status: "failed",
      attempts,
      message: `Valid word, but not the clue’s answer. No attempts remain. The answer was ${challenge.answer}.`,
      feedback: "failure",
    };
  }
  return {
    ...state,
    status: state.replay ? "replay" : "playing",
    attempts,
    message: "Valid word, but not the clue’s answer.",
    feedback: "valid-wrong",
  };
}

export function replayGame(challenge) {
  return createGameState(challenge, { replay: true });
}

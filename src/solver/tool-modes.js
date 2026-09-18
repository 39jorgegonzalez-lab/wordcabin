import { normalizeLetters, solveWords } from "../engine/solver.js";

export const TOOL_MODES = Object.freeze({
  unscrambler: {
    title: "Word Unscrambler", inputLabel: "Letters to unscramble",
    help: "Results include shorter words you can build from the letters.",
    relatedText: "Need exact rearrangements? Try", relatedHref: "/anagram-solver/", relatedLabel: "Anagram Solver",
  },
  anagram: {
    title: "Anagram Solver", inputLabel: "Letters to rearrange",
    help: "Every result uses all your letters, including one letter for each wildcard.",
    relatedText: "Want shorter words too? Try", relatedHref: "/#tool", relatedLabel: "Word Unscrambler",
  },
  "tile-game": {
    title: "Tile-Game Word Finder", inputLabel: "Letters on your rack",
    help: "Longest words first, then tile points. Blanks score zero; board bonuses are not included. Check candidates against your game's dictionary.",
    relatedText: "Looking for exact rearrangements? Try", relatedHref: "/anagram-solver/", relatedLabel: "Anagram Solver",
  },
});

// Modes share normalization, matching, blank scoring, filtering and ranking.
// Apply full length BEFORE the engine's result cap, never filter capped output.
export function solveTool({ mode = "unscrambler", letters, filters = {}, ...options }) {
  if (!Object.hasOwn(TOOL_MODES, mode)) throw new Error(`Unknown solver mode: ${mode}`);
  return solveWords({
    ...options, letters,
    filters: mode === "anagram"
      ? { ...filters, length: String(normalizeLetters(letters).length) }
      : filters,
  });
}

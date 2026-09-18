import React, { useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Copy,
  Home,
  Filter,
  BookOpen,
  RefreshCcw,
} from "lucide-react";
import { WORDS } from "../data/words.js";
import { solveWords } from "../engine/solver.js";
import { Analytics } from "../monetization/Analytics.jsx";
import { AdSlot } from "../monetization/AdSlot.jsx";
import { DailyPromo } from "../daily/DailyPromo.jsx";
import "../styles.css";

export function SolverApp() {
  const [letters, setLetters] = useState("");
  const [filters, setFilters] = useState({
    startsWith: "",
    endsWith: "",
    contains: "",
    length: "",
  });
  const [copied, setCopied] = useState("");
  const solved = useMemo(
    () =>
      solveWords({
        letters,
        dictionary: WORDS,
        filters,
        minLength: 2,
        limit: 600,
      }),
    [letters, filters],
  );
  const hasSearched = letters.trim().length > 0;
  const groupKeys = Object.keys(solved.grouped).sort(
    (a, b) => Number(b) - Number(a),
  );

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const updateLengthFilter = (value) => {
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      updateFilter("length", value);
    }
  };
  const reset = () => {
    setLetters("");
    setFilters({ startsWith: "", endsWith: "", contains: "", length: "" });
  };
  const copyWord = async (word) => {
    try {
      await navigator.clipboard.writeText(word);
      setCopied(word);
      setTimeout(() => setCopied(""), 1200);
    } catch {}
  };

  return (
    <main>
      <Analytics />
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <Home size={28} />
            <span>WordCabin</span>
          </div>
          <a href="#tool">Start solving</a>
        </nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow">
              <Sparkles size={16} /> cozy word solving
            </p>
            <h1>Unscramble words in a cozy little corner.</h1>
            <p className="subtitle">
              A fast, friendly word finder for games, school, vocabulary
              practice, and those moments when your letters refuse to cooperate.
            </p>
          </div>
          <div className="cabinCard" aria-hidden="true">
            <div className="moon"></div>
            <div className="window">
              <span>W</span>
              <span>O</span>
              <span>R</span>
              <span>D</span>
            </div>
            <p>Warm lights. Sharp words.</p>
          </div>
        </div>
      </section>

      <DailyPromo />

      <section className="toolShell" id="tool">
        <div className="toolHeader">
          <div>
            <p className="eyebrow">
              <Search size={16} /> word unscrambler
            </p>
            <h2>Enter your letters</h2>
          </div>
          <button className="ghost" onClick={reset}>
            <RefreshCcw size={16} /> Reset
          </button>
        </div>
        <div className="inputRow">
          <input
            aria-label="Letters to unscramble"
            aria-describedby="letter-help"
            value={letters}
            onChange={(e) => setLetters(e.target.value)}
            placeholder="Try: elgnriat, rtmaes, listen, pla?er"
            autoFocus
          />
          <button onClick={() => setLetters((v) => v.trim())}>
            Unscramble
          </button>
        </div>
        <p className="hint" id="letter-help">
          Use <strong>?</strong> as a wildcard. Results include shorter words
          you can build from the letters.
        </p>

        <div className="filters">
          <label>
            <span>Starts with</span>
            <input
              value={filters.startsWith}
              onChange={(e) => updateFilter("startsWith", e.target.value)}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Ends with</span>
            <input
              value={filters.endsWith}
              onChange={(e) => updateFilter("endsWith", e.target.value)}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Contains</span>
            <input
              value={filters.contains}
              onChange={(e) => updateFilter("contains", e.target.value)}
              placeholder="optional"
            />
          </label>
          <label>
            <span>Length</span>
            <input
              type="number"
              min="1"
              step="1"
              value={filters.length}
              onChange={(e) => updateLengthFilter(e.target.value)}
              placeholder="any"
              inputMode="numeric"
            />
          </label>
        </div>

        <section className="resultsPanel" aria-live="polite">
          {!hasSearched && <EmptyState />}
          {hasSearched && solved.results.length === 0 && <NoResults />}
          {hasSearched && solved.results.length > 0 && (
            <>
              <div className="summary">
                <div>
                  <p>Best word</p>
                  <strong>{solved.best.word}</strong>
                  <span>
                    {solved.best.length} letters · {solved.best.score} pts
                  </span>
                </div>
                <div>
                  <p>Words found</p>
                  <strong>{solved.meta.returned}</strong>
                  <span>ranked and grouped</span>
                </div>
              </div>
              {groupKeys.map((length) => (
                <div className="group" key={length}>
                  <h3>{length}-letter words</h3>
                  <div className="wordGrid">
                    {solved.grouped[length].map((item) => (
                      <button
                        className="wordPill"
                        key={item.word}
                        onClick={() => copyWord(item.word)}
                        title="Copy word"
                      >
                        <span>{item.word}</span>
                        <small>{item.score}</small>
                        {copied === item.word && <em>copied</em>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      </section>

      <AdSlot slot={import.meta.env.VITE_ADSENSE_PRIMARY_SLOT} />

      <section className="infoGrid">
        <article>
          <Filter />
          <h3>Built for useful results</h3>
          <p>
            WordCabin prioritizes buildable words, clean grouping, simple
            filters, and practical ranking.
          </p>
        </article>
        <article>
          <BookOpen />
          <h3>Friendly for every level</h3>
          <p>
            Easy enough for elementary learners, useful enough for serious word
            game players.
          </p>
        </article>
        <article>
          <Home />
          <h3>Low-maintenance foundation</h3>
          <p>
            The solver, dictionary, and UI are separated so future monthly
            improvements stay controlled.
          </p>
        </article>
      </section>
      <section className="explore" aria-labelledby="explore-title">
        <p className="eyebrow">Explore WordCabin</p>
        <h2 id="explore-title">Choose the word tool that fits.</h2>
        <div className="exploreLinks">
          <a href="/word-unscrambler/">
            <strong>Word Unscrambler</strong>
            <span>Build useful words from mixed-up letters.</span>
          </a>
          <a href="/anagram-solver/">
            <strong>Anagram Solver</strong>
            <span>Focus on rearrangements and full-length matches.</span>
          </a>
          <a href="/scrabble-word-finder/">
            <strong>Tile-Game Word Finder</strong>
            <span>Explore playable options from a letter rack.</span>
          </a>
        </div>
      </section>
      <footer>
        <span>
          WordCabin · A cozy word finder for games, school, and curious minds.
        </span>
        <nav aria-label="Legal and advertising">
          <a href="/privacy/">Privacy</a>
          <a href="/advertising/">Advertising</a>
        </nav>
      </footer>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <h3>Warm up the cabin.</h3>
      <p>
        Type some letters above and WordCabin will find the words hiding inside.
      </p>
    </div>
  );
}
function NoResults() {
  return (
    <div className="empty">
      <h3>No words found yet.</h3>
      <p>Try removing a filter, adding a wildcard, or entering more letters.</p>
    </div>
  );
}

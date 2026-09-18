import React, { useMemo, useRef, useState } from "react";
import { Search, RefreshCcw } from "lucide-react";
import { WORDS } from "../data/words.js";
import { solveTool, TOOL_MODES } from "./tool-modes.js";
import "./word-solver.css";

export function WordSolver({ mode = "unscrambler", autoFocus = false }) {
  const config = TOOL_MODES[mode];
  const inputRef = useRef(null);
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
      solveTool({
        mode,
        letters,
        dictionary: WORDS,
        filters,
        minLength: 2,
        limit: 600,
      }),
    [letters, filters, mode],
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
    setCopied("");
    inputRef.current?.focus();
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
      <section className={`toolShell wordSolver mode-${mode}`} id="tool">
        <div className="toolHeader">
          <div>
            <p className="eyebrow">
              <Search size={16} /> {config.title}
            </p>
            <h2>Enter your letters</h2>
          </div>
          <button className="ghost" onClick={reset}>
            <RefreshCcw size={16} /> Reset
          </button>
        </div>
        <div className="inputRow">
          <input
            aria-label={config.inputLabel}
            ref={inputRef}
            aria-describedby="letter-help"
            value={letters}
            onChange={(e) => setLetters(e.target.value)}
            placeholder="Try: elgnriat, rtmaes, listen, pla?er"
            autoFocus={autoFocus}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setLetters((value) => value.trim());
              }
            }}
          />
        </div>
        <p className="hint" id="letter-help">
          Results update as you type. Use <strong>?</strong> as a wildcard.
          {" "}{config.help}
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
          {mode !== "anagram" && <label>
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
          </label>}
        </div>

        <p className="solverAnnouncement" role="status" aria-live="polite" aria-atomic="true">
          {hasSearched ? `${solved.meta.returned} words found.` : "Enter at least two letters to find words."}
        </p>
        <section className="resultsPanel" aria-label="Word results">
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
                        <small aria-label={`${item.score} tile points`}>{item.score}</small>
                        {copied === item.word && <em>copied</em>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
        <p className="hint">{config.relatedText} <a href={config.relatedHref}>{config.relatedLabel}</a>.</p>
      </section>
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

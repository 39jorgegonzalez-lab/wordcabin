import React from "react";
import { createRoot } from "react-dom/client";
import "./analytics/bootstrap.js";

const DAILY_ROUTE_PREFIX = "/daily-word-challenge";

async function loadApplication(pathname = window.location.pathname) {
  const toolMode = pathname.replace(/\/$/, "") === "/anagram-solver" ? "anagram"
    : pathname.replace(/\/$/, "") === "/scrabble-word-finder" ? "tile-game" : null;
  if (toolMode) {
    const { WordSolver } = await import("./solver/WordSolver.jsx");
    return <WordSolver mode={toolMode} />;
  }
  if (
    pathname === DAILY_ROUTE_PREFIX ||
    pathname.startsWith(`${DAILY_ROUTE_PREFIX}/`)
  ) {
    const { DailyChallengeApp } = await import(
      "./daily/DailyChallengeApp.jsx"
    );
    return <DailyChallengeApp pathname={pathname} />;
  }

  const { SolverApp } = await import("./solver/SolverApp.jsx");
  return <SolverApp />;
}

const root = createRoot(document.getElementById("tool-root") || document.getElementById("root"));

loadApplication()
  .then((application) => root.render(application))
  .catch(() => {
    root.render(
      <main className="applicationError" role="alert">
        <h1>WordCabin could not load.</h1>
        <p>Please refresh the page and try again.</p>
        <a href="/">Return to WordCabin</a>
      </main>,
    );
  });

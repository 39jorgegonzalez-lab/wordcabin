import React from "react";
import { createRoot } from "react-dom/client";

const DAILY_ROUTE_PREFIX = "/daily-word-challenge";

async function loadApplication(pathname = window.location.pathname) {
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

const root = createRoot(document.getElementById("root"));

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

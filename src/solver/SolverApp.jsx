import React from "react";
import {
  Sparkles,
  Home,
  Filter,
  BookOpen,
} from "lucide-react";
import { ToolNavigation } from "./ToolNavigation.js";
import { WordSolver } from "./WordSolver.jsx";
import { AdSlot } from "../monetization/AdSlot.jsx";
import { DailyPromo } from "../daily/DailyPromo.jsx";
import "../styles.css";

export function SolverApp() {
  return (
    <main>
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

      <WordSolver autoFocus />

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
      <ToolNavigation />
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

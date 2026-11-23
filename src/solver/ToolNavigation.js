import { createElement } from "react";

const tools = [
  { href: "/word-unscrambler/", label: "Word Unscrambler", description: "Build useful words from mixed-up letters." },
  { href: "/anagram-solver/", label: "Anagram Solver", description: "Focus on rearrangements and full-length matches." },
  { href: "/scrabble-word-finder/", label: "Tile-Game Word Finder", description: "Explore playable options from a letter rack." },
];

// The homepage build and the interactive solver render the same navigation.
export function ToolNavigation() {
  return createElement(
    "section",
    { className: "explore", "aria-labelledby": "explore-title" },
    createElement("p", { className: "eyebrow" }, "Explore WordCabin"),
    createElement("h2", { id: "explore-title" }, "Choose the word tool that fits."),
    createElement("div", { className: "exploreLinks" }, tools.map(({ href, label, description }) =>
      createElement("a", { key: href, href },
        createElement("strong", null, label),
        createElement("span", null, description),
      )
    )),
  );
}

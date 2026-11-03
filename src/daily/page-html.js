import { DAILY_ROUTE_PREFIX, challengeRoute } from "./challenge-model.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function replaceMeta(shell, { title, description, robots, canonical, staticContent, structuredData = null }) {
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/>/, `<meta name="robots" content="${escapeHtml(robots)}" />`)
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${escapeHtml(canonical)}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, "")
    .replace('<div id="root"></div>', `<div id="root">${staticContent}</div>`);
  if (structuredData) {
    const json = JSON.stringify(structuredData).replaceAll("<", "\\u003c");
    html = html.replace("</head>", `    <script type="application/ld+json">${json}</script>\n  </head>`);
  }
  return html;
}

export function archiveStaticContent(published) {
  const links = [...published]
    .reverse()
    .map(
      (challenge) =>
        `<li><a href="${challengeRoute(challenge)}">Daily Word Challenge for ${escapeHtml(challenge.date)}</a></li>`,
    )
    .join("");
  return `<main><nav><a href="/">WordCabin home</a> · <a href="/#tool">Open solver</a></nav><h1>Daily Word Challenge archive</h1><p>Play WordCabin’s curated clue-driven word challenges.</p><ul>${links}</ul></main>`;
}

export function challengeStaticContent(challenge, navigation) {
  const previous = navigation.previous
    ? `<a rel="prev" href="${challengeRoute(navigation.previous)}">Previous challenge</a>`
    : "";
  const next = navigation.next
    ? `<a rel="next" href="${challengeRoute(navigation.next)}">Next challenge</a>`
    : "";
  return `<main><nav><a href="/">WordCabin home</a> · <a href="${DAILY_ROUTE_PREFIX}/">Challenge archive</a></nav><h1>Daily Word Challenge for ${escapeHtml(challenge.date)}</h1>${challenge.isRepeat ? "<p>Repeat challenge from the collection.</p>" : ""}<p>Unscramble the letters <strong>${escapeHtml(challenge.letters.toUpperCase())}</strong> using this clue: ${escapeHtml(challenge.clue)}</p><nav>${previous}${previous && next ? " · " : ""}${next}</nav></main>`;
}

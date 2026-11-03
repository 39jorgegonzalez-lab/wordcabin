import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { DAILY_CHALLENGES } from "../../src/daily/challenges.js";
import {
  DAILY_ROUTE_PREFIX,
  bogotaDateFromInstant,
  challengeRoute,
  getChallengeNavigation,
  getPublishedChallenges,
} from "../../src/daily/challenge-model.js";
import { runChallengeValidation } from "./validate-challenges.js";

import { replaceMeta, archiveStaticContent, challengeStaticContent } from "../../src/daily/page-html.js";
const SITE_ORIGIN = "https://wordcabin.com";

function assertShellAssets(shell, distDirectory) {
  const references = [...shell.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  if (references.length === 0) throw new Error("Built application shell contains no hashed asset references.");
  for (const reference of references) {
    const assetPath = path.join(distDirectory, reference.slice(1));
    if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
      throw new Error(`Built application shell references a missing asset: ${reference}`);
    }
  }
  return references;
}

export function generateDailyPages({
  distDirectory = path.resolve("dist"),
  instant = new Date(),
  logger = console,
} = {}) {
  runChallengeValidation({ instant, logger });
  const indexPath = path.join(distDirectory, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error(`Vite application shell is missing: ${indexPath}`);
  const shell = fs.readFileSync(indexPath, "utf8");
  const assets = assertShellAssets(shell, distDirectory);
  fs.mkdirSync(path.join(distDirectory, "_runtime"), { recursive: true });
  fs.writeFileSync(path.join(distDirectory, "_runtime", "daily-shell.txt"), shell);
  const canonicalDate = bogotaDateFromInstant(instant);
  const published = getPublishedChallenges(DAILY_CHALLENGES, canonicalDate);
  const dailyDirectory = path.join(distDirectory, "daily-word-challenge");
  fs.rmSync(dailyDirectory, { recursive: true, force: true });
  fs.mkdirSync(dailyDirectory, { recursive: true });

  const archiveCanonical = `${SITE_ORIGIN}${DAILY_ROUTE_PREFIX}/`;
  const archiveTitle = "Daily Word Challenge Archive | WordCabin";
  const archiveDescription = "Play WordCabin’s curated daily word challenges and review completed puzzles stored on this device.";
  const archiveStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "WordCabin Daily Word Challenge archive",
    itemListElement: published.map((challenge, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_ORIGIN}${challengeRoute(challenge)}`,
      name: `Daily Word Challenge for ${challenge.date}`,
    })),
  };
  fs.writeFileSync(
    path.join(dailyDirectory, "index.html"),
    replaceMeta(shell, {
      title: archiveTitle,
      description: archiveDescription,
      robots: "index, follow",
      canonical: archiveCanonical,
      staticContent: archiveStaticContent(published),
      structuredData: archiveStructuredData,
    }),
  );

  for (const challenge of published) {
    const routeDirectory = path.join(dailyDirectory, challenge.date);
    fs.mkdirSync(routeDirectory, { recursive: true });
    const title = `Daily Word Challenge — ${challenge.date} | WordCabin`;
    const description = `Solve WordCabin’s ${challenge.difficulty} daily word challenge for ${challenge.date} in ${challenge.maxAttempts} attempts or fewer.`;
    fs.writeFileSync(
      path.join(routeDirectory, "index.html"),
      replaceMeta(shell, {
        title,
        description,
        robots: "noindex, follow",
        canonical: `${SITE_ORIGIN}${challengeRoute(challenge)}`,
        staticContent: challengeStaticContent(challenge, getChallengeNavigation(published, challenge)),
      }),
    );
  }

  logger.log(
    `PASS: generated archive plus ${published.length} published dated challenge page(s) using ${assets.length} current hashed asset reference(s).`,
  );
  return { canonicalDate, published, assets, dailyDirectory };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateDailyPages();
}

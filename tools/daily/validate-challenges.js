import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { validateInventories } from "./validate-inventories.js";
import { SCHEDULE_END } from "../../src/daily/schedule.js";

import { DAILY_CHALLENGES } from "../../src/daily/challenges.js";
import {
  bogotaDateFromInstant,
  validateChallengeDataset,
} from "../../src/daily/challenge-model.js";
import { WORDS } from "../../src/data/words.js";

export function runChallengeValidation({ instant = new Date(), logger = console } = {}) {
  const canonicalDate = bogotaDateFromInstant(instant);
  const result = validateChallengeDataset(DAILY_CHALLENGES, WORDS, { canonicalDate });
  const fingerprint = createHash("sha256").update(JSON.stringify(DAILY_CHALLENGES)).digest("hex");
  if (fingerprint !== "0db4bc544c3512a4af522510fd65a7234af61a56a703a440de6da82f8044f09c") throw new Error("Immutable rotation v1 source changed; published puzzles must not change.");
  if (canonicalDate >= "2099-12-01") logger.warn(`WARNING: daily schedule reaches its supported horizon ${SCHEDULE_END}; extend through a versioned migration.`);
  if (!result.passed) {
    for (const error of result.errors) logger.error(`ERROR: ${error}`);
    throw new Error(`Daily challenge validation failed with ${result.errors.length} error(s).`);
  }
  logger.log(
    `PASS: ${DAILY_CHALLENGES.length} daily challenges validated against ${WORDS.length} production dictionary entries.`,
  );
  const inventories = validateInventories({today:canonicalDate});
  if (!inventories.passed) throw new Error(inventories.errors.join("\n"));
  const stock = inventories.status;
  logger.log(`PASS: ${stock.totalDistinct} distinct validated puzzles; ${stock.publishedDistinct} previously published, ${stock.unpublishedDistinct} unpublished; unique inventory through ${stock.uniqueThrough}.`);
  if (stock.warning) logger.warn(`WARNING: DAILY INVENTORY LOW — ${stock.unpublishedDistinct} unpublished unique puzzles remain; add a validated versioned batch before ${stock.uniqueThrough}. Labeled repeats follow exhaustion.`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runChallengeValidation();
}

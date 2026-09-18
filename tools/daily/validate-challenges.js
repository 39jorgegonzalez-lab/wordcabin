import { pathToFileURL } from "node:url";

import { DAILY_CHALLENGES } from "../../src/daily/challenges.js";
import {
  bogotaDateFromInstant,
  validateChallengeDataset,
} from "../../src/daily/challenge-model.js";
import { WORDS } from "../../src/data/words.js";

export function runChallengeValidation({ instant = new Date(), logger = console } = {}) {
  const canonicalDate = bogotaDateFromInstant(instant);
  const result = validateChallengeDataset(DAILY_CHALLENGES, WORDS, { canonicalDate });
  for (const warning of result.warnings) logger.warn(`WARNING: ${warning}`);
  if (!result.passed) {
    for (const error of result.errors) logger.error(`ERROR: ${error}`);
    throw new Error(`Daily challenge validation failed with ${result.errors.length} error(s).`);
  }
  logger.log(
    `PASS: ${DAILY_CHALLENGES.length} daily challenges validated against ${WORDS.length} production dictionary entries.`,
  );
  logger.log(
    `Inventory: ${result.inventory.futureCount} future unpublished challenge(s) after ${canonicalDate}.`,
  );
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runChallengeValidation();
}

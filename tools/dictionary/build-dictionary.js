import fs from "fs";
import path from "path";
import config from "./config.js";
import { discoverDictionary } from "./discover.js";
import { extractWords } from "./extract.js";
import { normalizeWords } from "./normalize.js";
import { runQA } from "./qa.js";
import { generateDictionary } from "./generate.js";

/*
WordCabin Dictionary Builder

Purpose:
Generate WordCabin's production dictionary automatically.

This script will eventually:

1. Import source word lists.
2. Normalize words.
3. Filter unwanted entries.
4. Remove duplicates.
5. Add metadata.
6. Generate src/data/words.js.
7. Produce QA reports.
*/

console.log("==================================");
console.log(" WordCabin Dictionary Builder");
console.log("==================================");
console.log("");
console.log("Status: Dictionary pipeline active.");
console.log("Current stages: discovery, extraction, normalization, QA, generation.");
console.log("");
console.log("After dictionary generation:");
console.log("- Run production build verification");
console.log("- Run solver tests");
console.log("- Produce dictionary reports");

// --------------------------------------------------
// Verify dictionary source location
// --------------------------------------------------

console.log("");
console.log("Checking dictionary source location...");

if (fs.existsSync(config.dictionarySources)) {
    console.log("✅ Dictionary source folder found.");
    console.log(config.dictionarySources);
} else {
    console.error("❌ Dictionary source folder NOT found.");
    console.error(config.dictionarySources);
    process.exit(1);
}

// --------------------------------------------------
// Scan dictionary source folder
// --------------------------------------------------

console.log("");
console.log("Scanning dictionary source...");

//
// Pipeline
//

const discoveryReport = discoverDictionary(config.dictionarySources);

console.log("");
console.log("==============================");
console.log("Discovery Report");
console.log("==============================");
console.log(discoveryReport);

// Pipeline Stage 2
const extractedWords = extractWords(discoveryReport, config);

console.log("");
console.log("==============================");
console.log("Extraction Result");
console.log("==============================");
console.log({
    sourceFile: extractedWords.sourceFile,
    sourceFileName: extractedWords.sourceFileName,
    sizeBytes: extractedWords.sizeBytes,
    wordCount: extractedWords.wordCount,
    sampleWords: extractedWords.sampleWords,
});
// Pipeline Stage 3
const normalizedResult = normalizeWords(extractedWords);

console.log("");
console.log("==============================");
console.log("Normalization Result");
console.log("==============================");
console.log({
    sourceFile: normalizedResult.sourceFile,
    inputWordCount: normalizedResult.inputWordCount,
    acceptedWordCount: normalizedResult.acceptedWordCount,
    rejectedWordCount: normalizedResult.rejectedWordCount,
    duplicateCount: normalizedResult.duplicateCount,
    sampleWords: normalizedResult.sampleWords,
    sampleRejectedWords: normalizedResult.sampleRejectedWords,
});
// Pipeline Stage 4
const qaResult = runQA(normalizedResult);

console.log("");
console.log("==============================");
console.log("QA Result");
console.log("==============================");
console.log(qaResult);

// Pipeline Stage 5
await generateDictionary(normalizedResult, qaResult, config);

console.log("");
console.log("==============================");
console.log("Generation Result");
console.log("==============================");
console.log("Generation completed successfully.");


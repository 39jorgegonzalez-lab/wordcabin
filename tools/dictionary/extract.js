// ------------------------------------------------------------
// WordCabin Dictionary Extraction Module
// ------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

function readLines(filePath) {
    const content = fs.readFileSync(filePath, "utf8");

    if (content.length === 0) {
        return [];
    }

    return content
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

export function extractWords(discoveryReport, config) {
    console.log("");
    console.log("==============================");
    console.log("Extraction Stage");
    console.log("==============================");

    if (!discoveryReport || !discoveryReport.root) {
        throw new Error("Extraction failed: discovery report is missing root path.");
    }

    if (!config || !config.sourceDictionaryFile) {
        throw new Error("Extraction failed: config.sourceDictionaryFile is missing.");
    }

    const sourceFile = config.sourceDictionaryFile;

    if (!fs.existsSync(sourceFile)) {
        throw new Error(`Extraction failed: source dictionary file not found at ${sourceFile}`);
    }

    const sourceStats = fs.statSync(sourceFile);

    if (!sourceStats.isFile()) {
        throw new Error(`Extraction failed: expected source dictionary path to be a file at ${sourceFile}`);
    }

    const words = readLines(sourceFile);

    const extractionReport = {
        sourceFile,
        sourceFileName: path.basename(sourceFile),
        sizeBytes: sourceStats.size,
        wordCount: words.length,
        sampleWords: words.slice(0, 40),
        words,
    };

    console.log("Source dictionary extraction report:");
    console.log(JSON.stringify(
        {
            sourceFile: extractionReport.sourceFile,
            sourceFileName: extractionReport.sourceFileName,
            sizeBytes: extractionReport.sizeBytes,
            wordCount: extractionReport.wordCount,
            sampleWords: extractionReport.sampleWords,
        },
        null,
        2
    ));

    return extractionReport;
}
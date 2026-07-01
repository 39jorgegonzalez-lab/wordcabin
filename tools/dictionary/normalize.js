// ------------------------------------------------------------
// WordCabin Dictionary Normalization Module
// ------------------------------------------------------------

function isValidWordCabinWord(word) {
    return /^[a-z]+$/.test(word);
}

export function normalizeWords(extractionResult) {
    console.log("");
    console.log("==============================");
    console.log("Normalization Stage");
    console.log("==============================");

    if (!extractionResult || !Array.isArray(extractionResult.words)) {
        throw new Error("Normalization failed: extraction result is missing words array.");
    }

    const rejectedWords = [];
    const acceptedWords = [];

    for (const rawWord of extractionResult.words) {
        const word = String(rawWord).trim();

        if (!isValidWordCabinWord(word)) {
            rejectedWords.push(word);
            continue;
        }

        acceptedWords.push(word);
    }

    const normalizedWords = [...new Set(acceptedWords)].sort();

    const normalizationReport = {
        sourceFile: extractionResult.sourceFile,
        inputWordCount: extractionResult.words.length,
        acceptedWordCount: normalizedWords.length,
        rejectedWordCount: rejectedWords.length,
        duplicateCount: acceptedWords.length - normalizedWords.length,
        sampleWords: normalizedWords.slice(0, 40),
        sampleRejectedWords: rejectedWords.slice(0, 40),
        words: normalizedWords,
    };

    console.log("Normalization report:");
    console.log(JSON.stringify(
        {
            sourceFile: normalizationReport.sourceFile,
            inputWordCount: normalizationReport.inputWordCount,
            acceptedWordCount: normalizationReport.acceptedWordCount,
            rejectedWordCount: normalizationReport.rejectedWordCount,
            duplicateCount: normalizationReport.duplicateCount,
            sampleWords: normalizationReport.sampleWords,
            sampleRejectedWords: normalizationReport.sampleRejectedWords,
        },
        null,
        2
    ));

    return normalizationReport;
}
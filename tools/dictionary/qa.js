// ------------------------------------------------------------
// WordCabin Dictionary QA Module
// ------------------------------------------------------------

function findInvalidWords(words) {
    return words.filter((word) => !/^[a-z]+$/.test(word));
}

function findDuplicateWords(words) {
    const seen = new Set();
    const duplicates = new Set();

    for (const word of words) {
        if (seen.has(word)) {
            duplicates.add(word);
        }

        seen.add(word);
    }

    return [...duplicates].sort();
}

function isSortedAlphabetically(words) {
    for (let index = 1; index < words.length; index += 1) {
        if (words[index - 1] > words[index]) {
            return false;
        }
    }

    return true;
}

export function runQA(normalizedResult) {
    console.log("");
    console.log("==============================");
    console.log("QA Stage");
    console.log("==============================");

    if (!normalizedResult || !Array.isArray(normalizedResult.words)) {
        throw new Error("QA failed: normalized result is missing words array.");
    }

    const words = normalizedResult.words;

    const invalidWords = findInvalidWords(words);
    const duplicateWords = findDuplicateWords(words);
    const sortedAlphabetically = isSortedAlphabetically(words);

    const requiredWords = [
        "a",
        "about",
        "cabin",
        "game",
        "letter",
        "puzzle",
        "solve",
        "word",
    ];

    const missingRequiredWords = requiredWords.filter((word) => !words.includes(word));

    const qaReport = {
        inputWordCount: words.length,
        invalidWordCount: invalidWords.length,
        duplicateWordCount: duplicateWords.length,
        sortedAlphabetically,
        requiredWordCount: requiredWords.length,
        missingRequiredWordCount: missingRequiredWords.length,
        sampleInvalidWords: invalidWords.slice(0, 40),
        sampleDuplicateWords: duplicateWords.slice(0, 40),
        missingRequiredWords,
        passed:
            invalidWords.length === 0 &&
            duplicateWords.length === 0 &&
            sortedAlphabetically === true &&
            missingRequiredWords.length === 0,
    };

    console.log("QA report:");
    console.log(JSON.stringify(qaReport, null, 2));

    if (!qaReport.passed) {
        throw new Error("QA failed: dictionary did not pass validation.");
    }

    return qaReport;
}
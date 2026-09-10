function findInvalidWords(words) {
    return words.filter(
        (word) =>
            typeof word !== "string" ||
            !/^[a-z]+$/.test(word)
    );
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
    for (
        let index = 1;
        index < words.length;
        index += 1
    ) {
        if (words[index - 1] > words[index]) {
            return false;
        }
    }

    return true;
}

export function runCandidateStructuralQA(
    normalizedResult
) {
    if (
        !normalizedResult ||
        !Array.isArray(normalizedResult.words)
    ) {
        throw new Error(
            "Candidate QA failed: normalized result must contain a words array."
        );
    }

    const words = normalizedResult.words;

    const invalidWords =
        findInvalidWords(words);

    const duplicateWords =
        findDuplicateWords(words);

    const sortedAlphabetically =
        isSortedAlphabetically(words);

    const emptyWordSet =
        words.length === 0;

    return {
        wordCount: words.length,
        emptyWordSet,
        invalidWordCount:
            invalidWords.length,
        duplicateWordCount:
            duplicateWords.length,
        sortedAlphabetically,
        sampleInvalidWords:
            invalidWords.slice(0, 40),
        sampleDuplicateWords:
            duplicateWords.slice(0, 40),
        passed:
            !emptyWordSet &&
            invalidWords.length === 0 &&
            duplicateWords.length === 0 &&
            sortedAlphabetically,
    };
}

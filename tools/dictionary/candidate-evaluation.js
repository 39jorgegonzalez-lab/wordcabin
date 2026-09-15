const DEFAULT_PROFILE = Object.freeze({
  id: "general-anagram",
  minimumLength: 2,
  maximumLength: 15,
});

function countByLength(words) {
  return words.reduce((counts, word) => {
    const key = String(word.length);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function evaluateCandidateWords({
  candidateWords,
  productionWords,
  profile = DEFAULT_PROFILE,
} = {}) {
  if (!Array.isArray(candidateWords) || !Array.isArray(productionWords)) {
    throw new Error(
      "Candidate evaluation requires candidateWords and productionWords arrays.",
    );
  }

  const productionSet = new Set(
    productionWords
      .map((entry) => (typeof entry === "string" ? entry : entry?.w))
      .filter(Boolean),
  );
  const inProfile = [];
  const outsideProfile = [];
  const existingWords = [];
  const novelWords = [];

  for (const word of candidateWords) {
    if (
      word.length < profile.minimumLength ||
      word.length > profile.maximumLength
    ) {
      outsideProfile.push(word);
      continue;
    }

    inProfile.push(word);
    (productionSet.has(word) ? existingWords : novelWords).push(word);
  }

  const overlapPercentage =
    inProfile.length === 0
      ? 0
      : Number(((existingWords.length / inProfile.length) * 100).toFixed(2));

  return {
    evaluationVersion: 1,
    profile: {
      id: profile.id,
      minimumLength: profile.minimumLength,
      maximumLength: profile.maximumLength,
    },
    candidateWordCount: candidateWords.length,
    inProfileWordCount: inProfile.length,
    outsideProfileWordCount: outsideProfile.length,
    existingWordCount: existingWords.length,
    novelWordCount: novelWords.length,
    overlapPercentage,
    lengthDistribution: countByLength(inProfile),
    sampleNovelWords: novelWords.slice(0, 100),
    sampleOutsideProfileWords: outsideProfile.slice(0, 100),
    productionMutationAllowed: false,
    promotionStatus: "not-evaluated-for-promotion",
  };
}

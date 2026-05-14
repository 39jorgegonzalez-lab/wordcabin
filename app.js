
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z]/g, "");
}

function sortLetters(str) {
  return normalize(str).split("").sort().join("");
}

function canBuildWord(input, word) {
  const inputCount = {};
  const wordCount = {};

  for (const ch of normalize(input)) {
    inputCount[ch] = (inputCount[ch] || 0) + 1;
  }

  for (const ch of normalize(word)) {
    wordCount[ch] = (wordCount[ch] || 0) + 1;
  }

  for (const ch in wordCount) {
    if (!inputCount[ch] || inputCount[ch] < wordCount[ch]) {
      return false;
    }
  }

  return true;
}

function findWords() {
  const input = document.getElementById("letters").value;

  const results = WORDS.filter(word => canBuildWord(input, word))
    .sort((a, b) => b.length - a.length || a.localeCompare(b));

  const resultsBox = document.getElementById("results");

  if (results.length === 0) {
    resultsBox.innerHTML = "<p>No words found.</p>";
    return;
  }

  resultsBox.innerHTML = results.map(w => `<div class="word-result">${w}</div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("solveBtn");
  if (btn) {
    btn.addEventListener("click", findWords);
  }
});

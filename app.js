
function unscramble(input) {
  const letters = input.toLowerCase().split('').sort().join('');
  return WORDS.filter(word => {
    const sorted = word.split('').sort().join('');
    return sorted.includes(letters) || letters.includes(sorted);
  }).sort((a,b) => b.length - a.length || a.localeCompare(b));
}

console.log("WordCabin upgraded logic loaded.");

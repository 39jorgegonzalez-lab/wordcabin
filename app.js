const scores = {a:1,e:1,i:1,o:1,u:1,l:1,n:1,s:1,t:1,r:1,d:2,g:2,b:3,c:3,m:3,p:3,f:4,h:4,v:4,w:4,y:4,k:5,j:8,x:8,q:10,z:10};

const el = id => document.getElementById(id);
const lettersEl = el('letters'), startsEl = el('starts'), containsEl = el('contains'), endsEl = el('ends'), lengthEl = el('length'), sortEl = el('sort');
const statusEl = el('status'), resultsEl = el('results'), bestEl = el('best');

document.getElementById('year').textContent = new Date().getFullYear();

function clean(value){ return (value || '').toLowerCase().replace(/[^a-z?]/g,''); }
function scoreWord(word){ return word.split('').reduce((sum,ch)=>sum+(scores[ch]||0),0); }

function canMake(word, letters){
  const counts = {};
  let wild = 0;
  for (const ch of letters) {
    if (ch === '?') wild++;
    else counts[ch] = (counts[ch] || 0) + 1;
  }
  for (const ch of word) {
    if (counts[ch]) counts[ch]--;
    else if (wild) wild--;
    else return false;
  }
  return true;
}

function solve(){
  const letters = clean(lettersEl.value);
  const starts = clean(startsEl.value).replace(/\?/g,'');
  const contains = clean(containsEl.value).replace(/\?/g,'');
  const ends = clean(endsEl.value).replace(/\?/g,'');
  const len = lengthEl.value ? Number(lengthEl.value) : null;

  if (!letters) {
    statusEl.textContent = 'Type some letters and the cabin will warm up the words.';
    resultsEl.innerHTML = '';
    bestEl.classList.add('hidden');
    return;
  }

  const maxLen = letters.length;
  let matches = WORDS
    .filter(w => w.length >= 2 && w.length <= maxLen)
    .filter(w => canMake(w, letters))
    .filter(w => !starts || w.startsWith(starts))
    .filter(w => !contains || w.includes(contains))
    .filter(w => !ends || w.endsWith(ends))
    .filter(w => !len || w.length === len)
    .map(w => ({word:w, score:scoreWord(w)}));

  const sort = sortEl.value;
  if (sort === 'az') matches.sort((a,b)=>a.word.localeCompare(b.word));
  else if (sort === 'length') matches.sort((a,b)=>b.word.length-a.word.length || b.score-a.score || a.word.localeCompare(b.word));
  else matches.sort((a,b)=>b.score-a.score || b.word.length-a.word.length || a.word.localeCompare(b.word));

  render(matches, letters);
}

function render(matches, letters){
  if (!matches.length) {
    statusEl.textContent = `No cabin words found for “${letters}” yet. Try fewer filters or add a wildcard.`;
    bestEl.classList.add('hidden');
    resultsEl.innerHTML = '';
    return;
  }

  statusEl.textContent = `${matches.length} word${matches.length === 1 ? '' : 's'} found. Fresh words, still warm.`;
  const best = matches[0];
  bestEl.classList.remove('hidden');
  bestEl.innerHTML = `Best cabin pick: <span>${best.word}</span> <small>(${best.score} pts)</small>`;

  const grouped = {};
  for (const item of matches) {
    const key = item.word.length;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  const lengths = Object.keys(grouped).map(Number).sort((a,b)=>b-a);
  resultsEl.innerHTML = lengths.map(length => `
    <section class="group">
      <h3>${length}-letter words</h3>
      <div class="words">
        ${grouped[length].map(item => `
          <span class="word-pill">
            <a href="https://www.dictionary.com/browse/${encodeURIComponent(item.word)}" target="_blank" rel="noopener">${item.word}</a>
            <span class="score">${item.score}</span>
            <button class="copy" data-copy="${item.word}" title="Copy ${item.word}">copy</button>
          </span>`).join('')}
      </div>
    </section>`).join('');
}

document.addEventListener('click', async (e)=>{
  if(e.target.matches('[data-example]')){
    lettersEl.value = e.target.dataset.example;
    solve();
  }
  if(e.target.matches('[data-copy]')){
    await navigator.clipboard.writeText(e.target.dataset.copy);
    e.target.textContent = 'copied';
    setTimeout(()=> e.target.textContent = 'copy', 900);
  }
});

['input','change'].forEach(evt => {
  [lettersEl, startsEl, containsEl, endsEl, lengthEl, sortEl].forEach(node => node.addEventListener(evt, solve));
});
document.getElementById('solveBtn').addEventListener('click', solve);
lettersEl.addEventListener('keydown', e => { if(e.key === 'Enter') solve(); });

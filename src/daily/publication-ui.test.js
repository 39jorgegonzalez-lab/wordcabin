import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { scheduledChallenge } from './schedule.js';
import { DAILY_STORAGE_KEY } from './storage.js';

// Real React DOM harness; does not claim visual or hosted browser coverage.
const dom = new JSDOM('<div id="root"></div>', {url:'https://wordcabin.test/'});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
Object.defineProperty(globalThis,'localStorage',{value:dom.window.localStorage,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const RealDate = Date;
let instant = '2026-11-03T04:59:59Z';
globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [instant])); } static now() { return RealDate.parse(instant); } };
let tick, cleared = false;
dom.window.setInterval = callback => {tick=callback;return 1;};
dom.window.clearInterval = () => {cleared=true;};
const React = await import('react');
const {createRoot} = await import('react-dom/client');
const server = await createServer({server:{middlewareMode:true},appType:'custom'});
const root = createRoot(document.getElementById('root'));
try {
  const {DailyPromo} = await server.ssrLoadModule('/src/daily/DailyPromo.jsx');
  await React.act(async()=>root.render(React.createElement(DailyPromo)));
  assert.equal(document.querySelector('.dailyPrimaryLink').getAttribute('href'),'/daily-word-challenge/2026-11-02/');
  assert.match(document.body.textContent,/repeats a seven-puzzle collection weekly/);
  instant='2026-11-03T05:00:00Z';
  await React.act(async()=>tick());
  assert.equal(document.querySelector('.dailyPrimaryLink').getAttribute('href'),'/daily-word-challenge/2026-11-03/');
  const challenge=scheduledChallenge('2026-11-03','2026-11-03');
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify({version:1,completions:{[challenge.id]:{completedAt:instant,attempts:2,solution:challenge.answer}}}));
  await React.act(async()=>window.dispatchEvent(new dom.window.StorageEvent('storage',{key:DAILY_STORAGE_KEY})));
  assert.match(document.body.textContent,/Completed on this device/);
  assert.equal(document.querySelector('.dailyPrimaryLink').textContent,'Play again');
  assert.match(document.body.textContent,/Current streak: 1/);
  localStorage.clear();
  await React.act(async()=>window.dispatchEvent(new dom.window.StorageEvent('storage',{key:null})));
  assert.doesNotMatch(document.body.textContent,/Completed on this device/);
  await React.act(async()=>root.unmount());
  assert.equal(cleared,true);
  console.log('PASS: actual DailyPromo DOM advances at Bogotá midnight, discloses repetition, synchronizes cross-tab completion/clear and cleans up timer');
} finally { globalThis.Date=RealDate; await server.close(); dom.window.close(); }

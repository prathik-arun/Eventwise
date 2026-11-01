'use strict';
// Run with: npm install && npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const logicTests = fs.readFileSync(path.join(__dirname, 'logic-tests.js'), 'utf8');
const MARKER = 'init();\n})();';

/** Loads the app in jsdom. With `withLogic`, the unit tests are injected into the app's own scope. */
function boot({ withLogic = false, geolocation, ai } = {}) {
  let src = html;
  if (withLogic) {
    assert.ok(src.includes(MARKER), 'script end marker not found');
    src = src.replace(MARKER, `${logicTests}\nwindow.__runTests=runTests;\n${MARKER}`);
  }
  return new JSDOM(src, {
    runScripts: 'dangerously',
    url: 'https://example.test/',
    beforeParse(w) {
      if (geolocation) w.navigator.geolocation = geolocation;
      if (ai) w.claude = { use: async (n) => (n === 'sample' ? ai : null) };
    },
  }).window;
}

const isoIn = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fill = (w, v) => {
  const $ = (s) => w.document.querySelector(s);
  $('#type').value = v.type || 'wedding';
  $('#type').dispatchEvent(new w.Event('change'));
  $('#date').value = v.date ?? isoIn(60);
  $('#guests').value = v.guests ?? '100';
  $('#budget').value = v.budget ?? '500000';
  if (v.name) $('#name').value = v.name;
  $('#f').dispatchEvent(new w.Event('submit', { cancelable: true }));
};
const tick = () => new Promise((r) => setTimeout(r, 30));

test('planning logic unit tests', () => {
  const results = boot({ withLogic: true }).__runTests();
  assert.ok(results.length >= 20);
  for (const r of results) assert.ok(r.ok, `failed: ${r.name}`);
});

test('empty form shows accessible errors and no plan', () => {
  const w = boot(), $ = (s) => w.document.querySelector(s);
  $('#f').dispatchEvent(new w.Event('submit', { cancelable: true }));
  assert.equal($('#out').hidden, true);
  assert.equal($('#date').getAttribute('aria-invalid'), 'true');
  assert.equal($('#e-guests').hidden, false);
});

test('every event type builds a plan whose budget adds up exactly', () => {
  const w = boot(), d = w.document;
  for (const o of [...d.querySelector('#type').options]) {
    fill(w, { type: o.value, budget: '400000' });
    const planned = [...d.querySelectorAll('#out tbody tr td:nth-child(3)')]
      .map((t) => Number(t.textContent.replace(/\D/g, '')));
    assert.equal(planned.reduce((a, b) => a + b, 0), 400000, o.value);
  }
});

test('user text is never parsed as HTML', () => {
  const w = boot();
  fill(w, { name: '<img src=x onerror=alert(1)>' });
  assert.equal(w.document.querySelector('#out img'), null);
  assert.match(w.document.querySelector('#res').textContent, /<img/);
});

test('"Use my location" fills the text box and builds map links around it', async () => {
  const w = boot({ geolocation: { getCurrentPosition: (ok) => ok({ coords: { latitude: 12.97163, longitude: 77.59456 } }) } });
  const d = w.document;
  fill(w, {});
  [...d.querySelectorAll('#out button')].find((b) => /location/.test(b.textContent)).click();
  await tick();
  assert.equal(d.querySelector('#area').value, '12.97, 77.59');
  assert.equal(d.querySelector('#venueLinks a').href, 'https://www.google.com/maps/search/Banquet%20Halls/@12.97,77.59,13z');
  [...d.querySelectorAll('#out button')].find((b) => /Search this area/.test(b.textContent)).click();
  assert.match(d.querySelector('#venueLinks a').href, /@12\.97,77\.59,13z$/, 'unchanged box keeps coordinates');
  d.querySelector('#area').value = 'Indiranagar, Bengaluru';
  [...d.querySelectorAll('#out button')].find((b) => /Search this area/.test(b.textContent)).click();
  assert.match(d.querySelector('#venueLinks a').href, /Banquet%20Halls%20in%20Indiranagar%2C%20Bengaluru$/);
});

test('denied location shows a helpful message', async () => {
  const w = boot({ geolocation: { getCurrentPosition: (_ok, err) => err({ code: 1 }) } });
  fill(w, {});
  [...w.document.querySelectorAll('#out button')].find((b) => /location/.test(b.textContent)).click();
  await tick();
  assert.match(w.document.querySelector('#status').textContent, /denied/);
  assert.equal(w.document.querySelector('#area').value, '');
});

test('plans are saved to history, reopened and deleted', () => {
  const w = boot(), d = w.document;
  fill(w, { name: 'Test party', type: 'birthday' });
  assert.equal(d.querySelectorAll('#hist li').length, 1);
  d.querySelector('#hist li button').click();
  assert.match(d.querySelector('#res').textContent, /Test party/);
  [...d.querySelectorAll('#hist li button')].find((b) => /Delete/.test(b.textContent)).click();
  assert.equal(d.querySelectorAll('#hist li').length, 0);
});

test('assistant answers via AI, and falls back offline', async () => {
  const w = boot({ ai: Object.assign(async () => ({ text: 'Cut 10 guests.' }), { json: async () => [] }) });
  await tick();
  fill(w, {});
  w.document.querySelector('#q').value = 'How to save?';
  w.document.querySelector('#askBtn').click();
  await tick();
  assert.match(w.document.querySelector('.msg.ai').textContent, /Cut 10 guests/);
  const offline = boot();
  fill(offline, {});
  offline.document.querySelector('#q').value = 'How to save?';
  offline.document.querySelector('#askBtn').click();
  await tick();
  assert.match(offline.document.querySelector('.msg.ai').textContent, /biggest costs/);
});

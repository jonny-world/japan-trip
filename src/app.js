/* Japan — travel companion. Vanilla JS, no runtime dependencies.
   Nothing about the trip lives in this file: dates, places and tickets all come from the encrypted bundle. */
'use strict';

const BUILD = '__VERSION__';
const TZ = 'Asia/Tokyo';
const app = document.getElementById('app');
let TRIP = null;
let IMAGES = {};
let META = { version: 'preview', builtAt: null, preview: true };
let REG = null;

/* ---------------- Icons ---------------- */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const I = {
  today: svg('<circle cx="12" cy="12" r="5.5" fill="currentColor" stroke="none"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  days: svg('<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/>'),
  bookings: svg('<path d="M3.5 7.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2.2a2.3 2.3 0 0 0 0 4.6v2.2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2.2a2.3 2.3 0 0 0 0-4.6z"/><path d="M14.5 7v10" stroke-dasharray="1.6 2"/>'),
  guide: svg('<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>'),
  flight: svg('<path d="M10.5 13.5 3 11l1.3-1.6 8 .8 5.2-5.4c.9-.9 2.3-1 3-.3.7.7.6 2.1-.3 3l-5.4 5.2.8 8L14 22l-2.5-7.5"/>'),
  train: svg('<path d="M2.5 15.5c0-4 3-7 8-7h3.2c4.3 0 7.8 3.1 7.8 7v.5H2.5z"/><path d="M14.5 8.5l2.5 4h4.3M6.5 12.5h4"/><path d="M4 19.5h16"/>'),
  car: svg('<path d="M3.5 16v-3.5l2-5h13l2 5V16z"/><path d="M3.5 12.5h17"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>'),
  ferry: svg('<path d="M4 14.5h16l-2.2 4H6.2z"/><path d="M7 14.5V10h9l2 4.5M10 10V7h4"/><path d="M2.5 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/>'),
  forwarding: svg('<rect x="6" y="6.5" width="12" height="14" rx="2"/><path d="M9.5 6.5V4h5v2.5M6 11.5h12"/>'),
  stay: svg('<path d="M3 18.5v-11M3 14.5h18v4M21 14.5v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.3" r="1.8"/>'),
  eat: svg('<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M15 3.5 10 11M19 4.5l-6 7"/>'),
  food: svg('<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M15 3.5 10 11M19 4.5l-6 7"/>'),
  drink: svg('<path d="M5 4.5h14l-7 8z"/><path d="M12 12.5v7M8 19.5h8"/>'),
  tea: svg('<path d="M4 9.5h14v3a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z"/><path d="M18 10.5h1a2.5 2.5 0 0 1 0 5h-1.5M4 21h14"/>'),
  coffee: svg('<path d="M4 9.5h14v3a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z"/><path d="M18 10.5h1a2.5 2.5 0 0 1 0 5h-1.5M9 3.5c-.8 1 .8 2 0 3M13 3.5c-.8 1 .8 2 0 3"/>'),
  see: svg('<path d="M2.5 5c6 1.2 13 1.2 19 0M4 8.8h16M7 6v15M17 6v15"/>'),
  activity: svg('<path d="M2.5 5c6 1.2 13 1.2 19 0M4 8.8h16M7 6v15M17 6v15"/>'),
  shop: svg('<path d="M5 8.5h14l-1 12H6z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>'),
  do: svg('<path d="m12 3.5 2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.8 5.4-.7z"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="2.4"'),
  prev: svg('<path d="m15 5-7 7 7 7"/>', 'stroke-width="2"'),
  next: svg('<path d="m9 5 7 7-7 7"/>', 'stroke-width="2"'),
  phone: svg('<path d="M5 3.5h3.5l1.5 4.5-2.3 1.4a11 11 0 0 0 6.9 6.9L16 14l4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.8 20 4 13.2 3.5 5.1A1.5 1.5 0 0 1 5 3.5z"/>'),
  map: svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  taxi: svg('<path d="M4 17v-3.5l2-5h12l2 5V17z"/><path d="M9.5 8.5 10 6h4l.5 2.5M4 13.5h16"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/>'),
  qr: svg('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2"/>'),
  open: svg('<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H10"/>'),
  copy: svg('<rect x="8" y="8" width="11.5" height="11.5" rx="2"/><path d="M15.5 8V5.5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H8"/>'),
  warn: svg('<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.3v.2"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="2"'),
  say: svg('<path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5h0a2 2 0 0 1-2-2z"/><path d="M9 10.5h6"/>'),
};
const kindIcon = (k) => I[k] || I.do;
// Colour families for kinds of thing: travel, stays, sights, food and drink, shopping.
const GROUP = { flight: 'go', train: 'go', ferry: 'go', car: 'go', forwarding: 'go', stay: 'stay', see: 'see', activity: 'see', do: 'see', eat: 'food', food: 'food', drink: 'food', tea: 'food', coffee: 'food', shop: 'shop' };
const kcls = (k) => `k-${GROUP[k] || 'see'}`;
const KIND = { flight: 'Flight', train: 'Train', ferry: 'Ferry', car: 'Car', forwarding: 'Luggage', stay: 'Stay', activity: 'Ticket', food: 'Table' };

/* ---------------- Utilities ---------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const DAY_MS = 86400000;
const parseDate = (d) => new Date(d + 'T00:00:00Z');
const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / DAY_MS);
const fmt = (d, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(parseDate(d));
const longDate = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = (d) => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' });
const dayMonth = (d) => fmt(d, { day: 'numeric', month: 'short' });
const weekdayShort = (d) => fmt(d, { weekday: 'short' });
const dayNum = (d) => fmt(d, { day: 'numeric' });
const mapsUrl = (q) => (/^https?:/.test(q) ? q : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
const telHref = (p) => `tel:${String(p).replace(/[^+\d]/g, '')}`;

const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const session = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { /* ignore */ } },
};

/* Time — Japan time, or a simulated moment for previewing before the trip. */
function nowJST() {
  const sim = session.get('jt-sim');
  if (sim && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(sim)) {
    const [d, t] = sim.split('T');
    return { date: d, minutes: toMinutes(t), simulated: true, label: `${shortDate(d)}, ${t}` };
  }
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')), simulated: false };
}
const SOFT = { early: 390, morning: 540, afternoon: 840, dusk: 990, evening: 1110 };
function toMinutes(t) {
  if (!t) return null;
  if (/^\d{1,2}:\d{2}$/.test(t)) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  return SOFT[String(t).toLowerCase()] ?? null;
}
const fmtMins = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);

const STATUS = {
  booked: ['booked', 'Booked'],
  'to-book': ['to-book', 'Not booked'],
  'not-booked': ['to-book', 'Not booked'],
  'walk-in': ['soft', 'Walk-in'],
  'pay-there': ['paythere', 'Booked · pay there'],
  check: ['warnb', 'Check'],
};
const badge = (s) => (STATUS[s] ? `<span class="badge ${STATUS[s][0]}">${STATUS[s][1]}</span>` : '');

/* ---------------- Trip helpers ---------------- */
const tripDays = () => TRIP.days.map((d) => d.date);
const findDay = (date) => TRIP.days.find((d) => d.date === date);
const B = (id) => TRIP.bookings.find((b) => b.id === id);
const G = (id) => TRIP.guides[id];
const city = (id) => TRIP.cities[id] || { name: id, ja: '' };
const isStay = (b) => b.kind === 'stay';
const stayForNight = (date) => TRIP.bookings.find((b) => isStay(b) && b.status !== 'check' && date >= b.date && date < b.endDate);
const whenText = (b) => `${shortDate(b.date)}${b.time ? ` · ${b.time}${b.end ? `–${b.end}` : ''}` : ''}`;
const qrSrc = (b, i) => IMAGES[`${b.id}#${i}`];

function defaultDate() {
  const { date } = nowJST();
  const days = tripDays();
  if (date < days[0]) return days[0];
  if (date > days[days.length - 1]) return days[days.length - 1];
  return date;
}

/* Where each plan item sits in the day, so the app can follow along. */
function timeline(day) {
  let last = null;
  return day.plan.map((it, i) => {
    const m = toMinutes(it.time);
    if (m !== null) last = m;
    return { it, i, start: m ?? last, hard: m !== null && /^\d/.test(it.time || '') };
  });
}
function nowNext(day) {
  const now = nowJST();
  if (now.date !== day.date) return null;
  const tl = timeline(day).filter((x) => x.start !== null);
  let cur = null, nxt = null;
  for (const x of tl) {
    if (x.start <= now.minutes) cur = x;
    else { nxt = x; break; }
  }
  const curEnd = cur?.it.end ? toMinutes(cur.it.end) : null;
  if (cur && curEnd !== null && curEnd < now.minutes && !nxt) cur = null;
  return { now, cur, nxt };
}

/* ---------------- Ticks ---------------- */
const doneSet = () => new Set(store.get('jt-done', []));
function toggleDone(key) {
  const s = doneSet();
  s.has(key) ? s.delete(key) : s.add(key);
  store.set('jt-done', [...s]);
  return s.has(key);
}

/* ---------------- Shared pieces ---------------- */
function tabbar(active) {
  const tabs = [['today', 'Today', '#/today'], ['days', 'Days', '#/days'], ['bookings', 'Bookings', '#/bookings'], ['guide', 'Guide', '#/guide']];
  return `<nav class="tabbar" aria-label="Sections">${tabs.map(([id, label, href]) => `<a href="${href}" ${active === id ? 'aria-current="page"' : ''}>${I[id]}<span>${label}</span></a>`).join('')}</nav>`;
}
/* ---------------- Navigation history ----------------
   Back goes to wherever you actually came from, at the same scroll position — not a fixed parent page.
   Each history entry gets an id; we keep the chain of ids, their hashes and scroll positions for this session. */
const NAV_KEY = 'jt-nav';
let nav = (() => {
  try { const n = JSON.parse(session.get(NAV_KEY)); if (n && Array.isArray(n.stack)) return n; } catch { /* fresh */ }
  return { top: 0, stack: [], pos: -1, y: {}, h: {} };
})();
let curIdx = null;
let replacing = false;
try { history.scrollRestoration = 'manual'; } catch { /* older browsers */ }

function trackNavigation() {
  if (curIdx !== null) nav.y[curIdx] = window.scrollY;
  const st = history.state && typeof history.state.jt === 'number' ? history.state.jt : null;
  const drop = (ids) => ids.forEach((id) => { delete nav.y[id]; delete nav.h[id]; });
  let idx, restored = false;
  if (st !== null && nav.stack.includes(st)) {
    idx = st; nav.pos = nav.stack.indexOf(st); restored = true;
  } else {
    idx = ++nav.top;
    try { history.replaceState({ jt: idx }, ''); } catch { /* ignore */ }
    if (replacing && nav.pos >= 0) { drop([nav.stack[nav.pos]]); nav.stack[nav.pos] = idx; }
    else { drop(nav.stack.splice(nav.pos + 1)); nav.stack.push(idx); nav.pos = nav.stack.length - 1; }
    if (nav.stack.length > 150) { const cut = nav.stack.length - 150; drop(nav.stack.splice(0, cut)); nav.pos -= cut; }
  }
  replacing = false;
  curIdx = idx;
  nav.h[idx] = location.hash || '#/today';
  session.set(NAV_KEY, JSON.stringify(nav));
  return restored ? nav.y[idx] || 0 : 0;
}
function go(href, replace) {
  if (!href || href === location.hash) return;
  if (replace) { replacing = true; location.replace(href); } else location.hash = href;
}
function labelFor(hash) {
  const [r, a] = hash.replace(/^#\/?/, '').split('/');
  if (r === '' || r === 'today') return 'Today';
  if (r === 'day') return findDay(a) ? shortDate(a) : 'Back';
  if (r === 'days') return 'Days';
  if (r === 'bookings') return 'Bookings';
  if (r === 'b') return B(a)?.title || 'Back';
  if (r === 'g') return G(a)?.title || 'Back';
  if (r === 'guide') return 'Guide';
  return 'Back';
}
// Back: to the previous screen if there is one, otherwise up to the section the page lives in.
function back(fallbackHref, fallbackLabel) {
  const prev = nav.pos > 0 ? nav.h[nav.stack[nav.pos - 1]] : null;
  return `<a class="back" href="${esc(prev || fallbackHref)}" ${prev ? 'data-back' : ''}>${I.prev.replace('<svg', '<svg width="16" height="16"')}<span>${esc(prev ? labelFor(prev) : fallbackLabel)}</span></a>`;
}
const recNote = (rec) => (rec ? `<span class="rec">Recommended${typeof rec === 'string' ? ` <i>“${esc(rec)}”</i>` : ''}</span>` : '');
function fact(label, value, cls = '') { return value ? `<div><dt>${esc(label)}</dt><dd class="${cls}">${value}</dd></div>` : ''; }
const copyable = (v) => `<button type="button" class="copy" data-copy="${esc(v)}">${esc(v)}${I.copy}</button>`;

/* ---------------- Today / day view ---------------- */
function hero(day, { isToday }) {
  const days = tripDays();
  const idx = days.indexOf(day.date);
  const c = city(day.city);
  const now = nowJST();
  const first = days[1] || days[0]; // the first day on the ground
  const n = diffDays(first, day.date) + 1;
  const count = day.date < first ? 'Departure day' : `Day ${n} of ${days.length - 1}`;
  const place = day.town ? `<small>${esc(day.town)}</small>` : '';
  const london = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
  let banner = '';
  if (isToday && !now.simulated && london < days[0]) {
    const left = diffDays(london, days[0]);
    banner = `<div class="hero-banner"><b>${left} ${left === 1 ? 'day' : 'days'} to go.</b> Showing the first day. <button type="button" class="linkish" data-sim="${first}T08:30">Preview the app as if it's ${esc(dayMonth(first))}</button></div>`;
  } else if (now.simulated && isToday) {
    banner = `<div class="hero-banner sim"><b>Previewing ${esc(now.label)}.</b>
      <label class="simrow"><input type="datetime-local" min="${days[0]}T00:00" max="${days[days.length - 1]}T23:59" value="${esc(session.get('jt-sim'))}" data-simpick aria-label="Preview time"></label>
      <button type="button" class="linkish" data-sim="">Back to real time</button></div>`;
  } else if (isToday && london > days[days.length - 1]) {
    banner = `<div class="hero-banner"><b>Welcome home.</b></div>`;
  }
  const prev = idx > 0 ? `#/day/${days[idx - 1]}` : '';
  const next = idx < days.length - 1 ? `#/day/${days[idx + 1]}` : '';
  // Stepping through days from a day page replaces it, so Back still returns to where you started.
  const rep = isToday ? '' : 'data-replace';
  return `<header class="hero">
    <div class="sun" aria-hidden="true"><span class="ja${c.ja.length > 2 ? ' long' : ''}">${esc(c.ja)}</span></div>
    <div class="hero-top">
      ${isToday ? `<span class="hero-date">${esc(longDate(day.date))}</span>` : `<span class="hero-lead">${back('#/days', 'Days')}<span class="hero-date">${esc(longDate(day.date))}</span></span>`}
      <span class="hero-nav">
        <button type="button" aria-label="Previous day" data-go="${prev}" ${rep} ${prev ? '' : 'disabled'}>${I.prev}</button>
        <button type="button" aria-label="Next day" data-go="${next}" ${rep} ${next ? '' : 'disabled'}>${I.next}</button>
      </span>
    </div>
    <div class="hero-body">
      <p class="hero-count">${count}</p>
      <h1>${esc(c.name)}${place}</h1>
      <p class="title">${esc(day.title)}</p>
      ${banner}
    </div>
  </header>`;
}

// A stay's confirmation only matters on the day you check in — later days (breakfast, check-out) don't link to it.
function bookingFor(it, day) {
  const b = it.b ? B(it.b) : null;
  return b && isStay(b) && day && day.date !== b.date ? null : b;
}
function itemHref(it, day) {
  const b = bookingFor(it, day);
  if (b) return `#/b/${b.id}`;
  if (it.g) return `#/g/${it.g}`;
  return '';
}
function itemStatus(it, day) {
  if (it.status) return it.status;
  const b = bookingFor(it, day);
  return b && ['booked', 'pay-there', 'check', 'not-booked'].includes(b.status) ? b.status : '';
}
// Google Maps link for a place: a search, or driving directions on the car days.
function placeUrl(m) {
  if (!m) return '';
  if (typeof m === 'string') return mapsUrl(m);
  const q = encodeURIComponent(m.q);
  return m.drive
    ? `https://www.google.com/maps/dir/?api=1&destination=${q}${m.id ? `&destination_place_id=${encodeURIComponent(m.id)}` : ''}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${q}${m.id ? `&query_place_id=${encodeURIComponent(m.id)}` : ''}`;
}

function nowCard(day) {
  const nn = nowNext(day);
  if (!nn || (!nn.cur && !nn.nxt)) return '';
  const row = (x, label) => {
    if (!x) return '';
    const it = x.it;
    const b = bookingFor(it, day);
    const href = itemHref(it, day);
    let when = label;
    if (label === 'Next' && it.time) when = x.hard ? `Next · ${esc(it.time)} · in ${fmtMins(x.start - nn.now.minutes)}` : `Next · ${esc(it.time)}`;
    else if (label === 'Now' && x.hard) when = `Now · since ${esc(it.time)}`;
    const actions = [];
    if (b?.tickets?.length) actions.push(`<button type="button" class="pill dark" data-qr="${esc(b.id)}">${I.qr} Ticket</button>`);
    else if (b?.online) actions.push(`<a class="pill dark" href="${esc(b.online.url)}">${I.open} E-ticket</a>`);
    if (it.taxi) actions.push(`<button type="button" class="pill" data-driver="${esc(it.taxi)}">${I.taxi} Show driver</button>`);
    const gid = it.g || b?.guide?.[0];
    if (gid) actions.push(`<a class="pill" href="#/g/${gid}">${I.guide} How to</a>`);
    const title = href ? `<a href="${href}">${esc(it.title)}<span class="chev" aria-hidden="true"> ›</span></a>` : esc(it.title);
    return `<div class="nn-row ${label === 'Now' ? 'is-now' : ''}"><p class="nn-label">${when}</p>
      <h3>${title}</h3>${label === 'Next' && it.note ? `<p class="nn-note">${esc(it.note)}</p>` : ''}
      ${actions.length ? `<div class="pills">${actions.join('')}</div>` : ''}</div>`;
  };
  return `<section class="nowcard" aria-label="Now and next">${row(nn.cur, 'Now')}${row(nn.nxt, 'Next')}</section>`;
}

function timelineItem(day, x, done, nn) {
  const it = x.it;
  const key = `${day.date}|${slug(it.title)}`;
  const isDone = done.has(key);
  const timeHtml = it.time ? `${esc(it.time)}${it.end ? `<span class="end">${esc(it.end)}</span>` : ''}` : '';
  const href = itemHref(it, day);
  const st = itemStatus(it, day);
  const b = bookingFor(it, day);
  const pin = it.pin === false ? null : it.map || (b?.place ? b.place.map || `${b.place.name} ${b.place.address || ''}` : null);
  const drive = !!it.map?.drive;
  const btns = [
    b?.tickets?.length ? `<button type="button" class="tl-qr" data-qr="${esc(b.id)}" aria-label="Show the ticket for ${esc(it.title)}">${I.qr}</button>` : '',
    it.taxi ? `<button type="button" class="tl-mini" data-driver="${esc(it.taxi)}" aria-label="Show the taxi driver where to go">${I.taxi}</button>` : '',
    pin ? `<a class="tl-mini" href="${esc(placeUrl(pin))}" aria-label="${drive ? 'Directions to' : 'Map of'} ${esc(it.title)}">${I.map}</a>` : '',
  ].filter(Boolean);
  // One icon per row. A ticket wins (the booking page has the map); then the taxi card; then the pin.
  const side = btns.length ? `<div class="tl-side">${btns[0]}</div>` : '';
  const cls = ['tl-item', kcls(it.kind), isDone ? 'done' : '', nn?.cur?.i === x.i ? 'now' : '', nn?.nxt?.i === x.i ? 'next' : '', href ? 'linked' : '', side ? 'has-side' : ''].join(' ');
  // Only flag the exceptions — "booked" is the normal state, so it gets no badge.
  const trail = it.trail && !href ? `<a class="trail" href="${esc(it.trail)}">Trail on AllTrails ›</a>` : '';
  const meta = [st && st !== 'booked' ? badge(st) : '', recNote(it.rec), trail].filter(Boolean).join('');
  const body = `<div class="tl-title">${esc(it.title)}${href ? '<span class="go" aria-hidden="true">›</span>' : ''}</div>
      ${it.note ? `<div class="tl-note">${esc(it.note)}</div>` : ''}
      ${meta ? `<div class="tl-meta">${meta}</div>` : ''}`;
  return `<li class="${cls}">
    <div class="tl-time tnum">${timeHtml}</div>
    <button type="button" class="tl-mark" data-tick="${esc(key)}" data-kind="${esc(it.kind)}" aria-pressed="${isDone}" aria-label="Mark ${esc(it.title)} as done">${isDone ? I.check : kindIcon(it.kind)}</button>
    ${href ? `<a class="tl-body" href="${href}">${body}</a>` : `<div class="tl-body">${body}</div>`}
    ${side}
  </li>`;
}

function ideaRow(x, day) {
  const q = x.map;
  return `<li class="${kcls(x.kind)}">${kindIcon(x.kind)}<div><div class="t">${esc(x.title)}</div>${x.note ? `<div class="n">${esc(x.note)}</div>` : ''}${x.rec ? `<div class="tl-meta">${recNote(x.rec)}</div>` : ''}</div>
    ${q ? `<a class="mapbtn" href="${esc(placeUrl(q))}" aria-label="Open ${esc(x.title)} in Google Maps">${I.map}</a>` : ''}</li>`;
}

function dayView(date, { isToday }) {
  const day = findDay(date);
  if (!day) return notFound();
  const done = doneSet();
  const nn = nowNext(day);
  const tonight = stayForNight(day.date);
  const plan = day.plan.length
    ? `<ul class="timeline">${timeline(day).map((x) => timelineItem(day, x, done, nn)).join('')}</ul>`
    : `<p class="empty">Nothing fixed. Wander.</p>`;
  // Coffee and tonight's bed: one quiet line each.
  const extras = [];
  if (day.coffee) {
    extras.push(`<a class="extra k-food" href="${esc(placeUrl(day.coffee.map || `${day.coffee.name} ${city(day.city).name}`))}">${I.coffee}<span class="ex-l">Coffee</span>
      <span class="ex-t">${esc(day.coffee.name)}${day.coffee.rec ? ` ${recNote(day.coffee.rec)}` : ''}${day.coffee.note ? `<span class="ex-n">${esc(day.coffee.note)}</span>` : ''}</span>${I.map}</a>`);
  }
  if (tonight) {
    const line = day.date === tonight.date && tonight.checkIn ? `Check in from ${esc(tonight.checkIn)}` : `Night ${diffDays(tonight.date, day.date) + 1} of ${tonight.nights}`;
    extras.push(`<a class="extra k-stay" href="#/b/${tonight.id}">${I.stay}<span class="ex-l">Tonight</span>
      <span class="ex-t">${esc(tonight.title)}<span class="ex-n">${line}</span></span><span class="chev" aria-hidden="true">›</span></a>`);
  }
  const ideas = day.ideas?.length ? `<details class="ideas-fold"><summary><span>If you feel like it</span><span class="count">${day.ideas.length}</span></summary>
    <ul class="ideas">${day.ideas.map((x) => ideaRow(x, day)).join('')}</ul></details>` : '';
  return `<main class="screen">${hero(day, { isToday })}
    ${isToday ? '<div class="status-line" id="offline-line" hidden><span class="dot"></span><span></span></div>' : ''}
    ${day.note ? `<div class="day-note">${I.warn}<span>${esc(day.note)}</span></div>` : ''}
    ${nowCard(day)}
    <section class="section"><h2>The plan</h2>${plan}</section>
    ${extras.length || ideas ? `<section class="section extras">${extras.join('')}${ideas}</section>` : ''}
  </main>${tabbar(isToday ? 'today' : 'days')}`;
}

/* ---------------- Days ---------------- */
function daysView() {
  const today = nowJST().date;
  const groups = [];
  for (const d of TRIP.days) {
    const last = groups[groups.length - 1];
    if (last && last.city === d.city) last.days.push(d); else groups.push({ city: d.city, days: [d] });
  }
  const span = (a, b) => (a === b ? dayMonth(a) : a.slice(0, 7) === b.slice(0, 7) ? `${dayNum(a)}–${dayMonth(b)}` : `${dayMonth(a)} – ${dayMonth(b)}`);
  return `<main class="screen">
    <div class="page-head"><h1>Days</h1><p>${esc(longDate(TRIP.meta.start))} – ${esc(longDate(TRIP.meta.end))}</p></div>
    ${groups.map((g) => {
      const c = city(g.city);
      return `<section class="leg">
        <div class="leg-head"><span class="ja">${esc(c.ja)}</span><h2>${esc(c.name)}</h2><span class="span">${esc(span(g.days[0].date, g.days[g.days.length - 1].date))}</span></div>
        ${g.days.map((d) => {
          const n = d.plan.filter((p) => ['booked', 'pay-there'].includes(bookingFor(p, d)?.status)).length;
          return `<a class="day-row${d.date === today ? ' today' : ''}" href="#/day/${d.date}">
            <div class="d"><b>${esc(dayNum(d.date))}</b><span>${esc(weekdayShort(d.date))}</span></div>
            <div><div class="t">${esc(d.title)}</div><div class="m">${d.town ? `${esc(d.town)} · ` : ''}${n ? `${n} booked` : 'No bookings'}${d.note ? ' · <span class="warn-text">Check</span>' : ''}</div></div>
            <span class="chev">›</span></a>`;
        }).join('')}
      </section>`;
    }).join('')}
  </main>${tabbar('days')}`;
}

/* ---------------- Bookings ---------------- */
const FILTERS = [['all', 'All'], ['travel', 'Travel'], ['stays', 'Stays'], ['tickets', 'Tickets'], ['food', 'Food']];
const inFilter = (b, f) => f === 'all' || (f === 'travel' && ['flight', 'train', 'ferry', 'car', 'forwarding'].includes(b.kind)) || (f === 'stays' && isStay(b)) || (f === 'tickets' && b.kind === 'activity') || (f === 'food' && b.kind === 'food');

function bookingsView(filter = 'all') {
  const key = (x) => x.date + (x.time || x.checkIn || '23:59');
  const list = TRIP.bookings.filter((b) => inFilter(b, filter)).sort((a, b) => key(a).localeCompare(key(b)));
  const qrCount = TRIP.bookings.reduce((n, b) => n + (b.tickets?.length || 0), 0);
  const byDate = {};
  for (const b of list) (byDate[b.date] ||= []).push(b);
  return `<main class="screen">
    <div class="page-head"><h1>Bookings</h1><p>${qrCount} QR tickets saved on this phone</p></div>
    <div class="chips" role="tablist">${FILTERS.map(([id, label]) => `<a role="tab" class="chip" href="#/bookings/${id}" data-replace aria-selected="${filter === id}">${label}</a>`).join('')}</div>
    ${Object.entries(byDate).map(([date, bs]) => `<section class="bk-day"><h2>${esc(longDate(date))}</h2>
      ${bs.map((b) => `<a class="bk-row ${kcls(b.kind)}" href="#/b/${b.id}">
        <span class="bk-time tnum">${esc(b.time || (isStay(b) ? b.checkIn || '' : ''))}</span>
        <span class="bk-icon">${kindIcon(b.kind)}</span>
        <span class="bk-main"><span class="bk-title">${esc(b.title)}</span><span class="bk-sub">${esc(isStay(b) ? `${b.nights} ${b.nights === 1 ? 'night' : 'nights'} · ${b.subtitle || ''}` : b.subtitle || '')}</span>
          ${b.status !== 'booked' || b.warning ? `<span class="tl-meta">${badge(b.warning ? 'check' : b.status)}</span>` : ''}</span>
        ${b.tickets?.length ? `<span class="bk-qr" aria-label="Has QR tickets">${I.qr}</span>` : '<span class="chev">›</span>'}
      </a>`).join('')}</section>`).join('') || '<p class="empty wrap">Nothing here.</p>'}
  </main>${tabbar('bookings')}`;
}

function ticketZone(b) {
  if (b.tickets?.length) {
    return `<section class="ticket-zone">
      <div class="qr-row">${b.tickets.map((t, i) => `<button type="button" class="qr-card" data-qr="${esc(b.id)}" data-i="${i}">
        <img src="${qrSrc(b, i)}" alt="QR code, ${esc(t.label)}" width="240" height="240">
        <span>${esc(t.label)}</span></button>`).join('')}</div>
      <p class="tz-hint">Tap to show full screen${b.tickets.length > 1 ? ' · one code each' : ''}</p>
    </section>`;
  }
  if (b.online) {
    return `<section class="ticket-zone online">
      <p class="tz-lead">${I.open}<span>${esc(b.show?.text || 'This ticket lives online.')}</span></p>
      <a class="btn" href="${esc(b.online.url)}">${esc(b.online.label)}</a>
      <p class="tz-hint">${esc(b.online.note || 'Needs signal')}</p>
    </section>`;
  }
  if (b.seats?.length) {
    return `<section class="ticket-zone seats">
      <div class="seat-row">${b.seats.map((s) => `<div class="seat"><span class="sl">Car</span><b>${esc(s.car)}</b><span class="sl">Seat</span><b>${esc(s.seat)}</b></div>`).join('')}</div>
      ${b.class ? `<p class="tz-hint">${esc(b.class)}</p>` : ''}
      ${b.show ? `<p class="tz-lead">${esc(b.show.text)}</p>` : ''}
    </section>`;
  }
  if (b.show || b.refs?.length) {
    const main = b.refs?.[0];
    return `<section class="ticket-zone desk">
      ${main ? `<p class="tz-label">${esc(main.label)}</p><p class="tz-ref">${esc(main.value)}</p>` : ''}
      ${b.who ? `<p class="tz-hint">Name on the booking: <b>${esc(b.who)}</b></p>` : ''}
      ${b.show ? `<p class="tz-lead">${esc(b.show.text)}</p>` : ''}
    </section>`;
  }
  return '';
}

function placeBlock(p, id, label) {
  if (!p) return '';
  const drv = p.addressJa || p.nameJa || p.phone;
  return `<div class="place">
    ${label ? `<p class="pl-label">${esc(label)}</p>` : ''}
    <p class="pl-name">${esc(p.name)}</p>
    ${p.address ? `<p class="pl-addr">${esc(p.address)}</p>` : ''}
    <div class="acts">
      <a class="act" href="${mapsUrl(p.map || `${p.name} ${p.address}`)}">${I.map}<span>Maps</span></a>
      ${drv ? `<button type="button" class="act" data-driver="${esc(id)}">${I.taxi}<span>Show driver</span></button>` : ''}
      ${p.phone ? `<a class="act" href="${telHref(p.phone)}">${I.phone}<span>Call</span></a>` : ''}
    </div>
  </div>`;
}

function guideBlock(id) {
  const g = G(id);
  if (!g) return '';
  return `<details class="guide-block"><summary><span>${esc(g.title)}</span><span class="gb-sum">${esc(g.summary)}</span></summary>
    ${stepsHtml(g)}<a class="more" href="#/g/${id}">Open full guide ›</a></details>`;
}

// What the ticket area at the top of a booking shows, so the facts below don't repeat it.
const zoneOf = (b) => (b.tickets?.length ? 'qr' : b.online ? 'online' : b.seats?.length ? 'seats' : b.show || b.refs?.length ? 'desk' : '');

function bookingView(id) {
  const b = B(id);
  if (!b) return notFound();
  const stay = isStay(b);
  const zone = zoneOf(b);
  const refs = b.refs || [];
  const mainRefInZone = zone === 'desk' && refs.length;
  const eyebrow = stay ? `Stay · ${b.nights} ${b.nights === 1 ? 'night' : 'nights'}` : `${KIND[b.kind] || ''} · ${whenText(b)}`;
  const arrive = b.arrive ? `${esc(b.arrive)}${b.arriveDate && b.arriveDate !== b.date ? ` · ${esc(shortDate(b.arriveDate))}` : ''}` : '';
  // Up front: only what you need at the desk or the gate.
  const key = [
    stay ? fact('Check in', `${esc(shortDate(b.date))}${b.checkIn ? `, from ${esc(b.checkIn)}` : ''}`) : '',
    stay ? fact('Check out', `${esc(shortDate(b.endDate))}${b.checkOut ? `, by ${esc(b.checkOut)}` : ''}`) : '',
    !stay && arrive ? fact(b.kind === 'car' ? 'Return' : 'Arrives', arrive) : '',
    refs[0] && !mainRefInZone ? fact(refs[0].label, copyable(refs[0].value)) : '',
    zone !== 'desk' ? fact('Name', b.who ? esc(b.who) : '') : '',
    fact('Pay there', b.payThere ? esc(b.payThere) : ''),
  ].join('');
  // Folded away: the paperwork.
  const more = [
    ...refs.slice(1).map((r) => fact(r.label, copyable(r.value))),
    mainRefInZone ? fact(refs[0].label, copyable(refs[0].value)) : '',
    fact('People', b.people ? String(b.people) : ''),
    ...(b.facts || []).map((f) => fact(f.label, esc(f.value))),
    fact('Paid', b.paid ? esc(b.paid) : ''),
    fact('Booked via', b.provider ? esc(b.provider) : ''),
    fact('Cancellation', b.cancel ? esc(b.cancel) : ''),
    fact('Email', b.place?.email ? `<a href="mailto:${esc(b.place.email)}">${esc(b.place.email)}</a>` : ''),
  ].join('');
  const docs = b.docs?.length ? `<div class="docs">${b.docs.map((d) => `<button type="button" class="doc" data-doc="${esc(d)}"><img src="${IMAGES[d]}" alt="Original booking voucher" loading="lazy"><span>Original voucher</span></button>`).join('')}</div>` : '';
  const places = placeBlock(b.place, b.id, b.place2 ? 'Pick up' : '') + (b.place2 ? placeBlock(b.place2, `${b.id}#2`, b.place2.label || 'Drop off') : '');
  const guides = (b.guide || []).map((g) => guideBlock(g)).join('');
  return `<main class="screen">
    <div class="page-head bk-head">${back('#/bookings', 'Bookings')}
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(b.title)}</h1>${b.subtitle ? `<p>${esc(b.subtitle)}</p>` : ''}
      ${b.status !== 'booked' ? `<div class="tl-meta">${badge(b.status)}</div>` : ''}
    </div>
    ${b.warning ? `<div class="day-note">${I.warn}<span>${esc(b.warning)}</span></div>` : ''}
    ${b.missing ? `<p class="missing">${esc(b.missing)}</p>` : ''}
    ${ticketZone(b)}
    ${key ? `<section class="section tight"><dl class="facts">${key}</dl></section>` : ''}
    ${places ? `<section class="section tight">${places}</section>` : ''}
    ${b.notes?.length ? `<section class="section"><h2>Good to know</h2><ul class="notes">${b.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>` : ''}
    ${guides ? `<section class="section"><h2>How to</h2>${guides}</section>` : ''}
    ${b.links?.length ? `<section class="section"><div class="acts wide">${b.links.map((l) => `<a class="act" href="${esc(l.url)}">${I.open}<span>${esc(l.label)}</span></a>`).join('')}</div></section>` : ''}
    ${more || docs ? `<section class="section"><details class="fold"><summary>Booking details</summary><dl class="facts">${more}</dl>${docs}</details></section>` : ''}
  </main>${tabbar('bookings')}`;
}

/* ---------------- Guides ---------------- */
function stepsHtml(g) {
  return `${g.taxi ? `<div class="acts taxi-act"><button type="button" class="act" data-driver="${esc(g.taxi)}">${I.taxi}<span>Show the taxi driver</span></button></div>` : ''}<ol class="steps">${g.steps.map((s) => `<li><p>${esc(s.t)}</p>${s.ja || s.sign ? `<span class="sign">${s.ja ? `<span class="sj" lang="ja">${esc(s.ja)}</span>` : ''}${s.sign ? `<span class="se">${esc(s.sign)}</span>` : ''}</span>` : ''}</li>`).join('')}</ol>
    ${g.alt ? `<p class="alt"><b>Another way.</b> ${esc(g.alt)}</p>` : ''}
    ${g.watch?.length ? `<ul class="watch">${g.watch.map((w) => `<li>${I.warn}<span>${esc(w)}</span></li>`).join('')}</ul>` : ''}`;
}
function guidePage(id) {
  const g = G(id);
  if (!g) return notFound();
  const used = TRIP.bookings.filter((b) => (b.guide || []).includes(id));
  return `<main class="screen">
    <div class="page-head">${back('#/guide', 'Guide')}<h1>${esc(g.title)}</h1><p>${esc(g.summary)}</p></div>
    <section class="section">${stepsHtml(g)}</section>
    ${used.length ? `<section class="section"><h2>Bookings on this route</h2>${used.map((b) => `<a class="card" href="#/b/${b.id}"><div class="row"><div><div class="eyebrow">${esc(whenText(b))}</div><h3>${esc(b.title)}</h3></div><span class="chev">›</span></div></a>`).join('')}</section>` : ''}
  </main>${tabbar('guide')}`;
}

function guideView() {
  const london = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
  const pre = london < TRIP.meta.start;
  const done = doneSet();
  const routes = [];
  for (const d of TRIP.days) for (const it of d.plan) {
    const ids = [it.g, ...(it.b ? B(it.b)?.guide || [] : [])].filter(Boolean);
    for (const g of ids) if (!routes.find((r) => r.g === g)) routes.push({ g, date: d.date });
  }
  const E = TRIP.essentials;
  const row = (g, lead) => `<a class="route-row" href="#/g/${g}"><span class="rr-date">${esc(lead)}</span><span class="rr-t">${esc(G(g)?.title)}</span><span class="chev">›</span></a>`;
  const open = TRIP.checklist?.filter((c) => !done.has(`check|${c.id}`)).length || 0;
  return `<main class="screen">
    <div class="page-head"><h1>Guide</h1><p>Getting around, phrases and help</p></div>
    ${pre && TRIP.checklist?.length ? `<section class="section"><h2>Before you fly${open ? ` <span class="aside">${open} to do</span>` : ''}</h2><ul class="checklist">${TRIP.checklist.map((c) => {
      const k = `check|${c.id}`; const on = done.has(k);
      return `<li class="${on ? 'done' : ''}"><button type="button" class="tl-mark" data-tick="${esc(k)}" data-kind="do" aria-pressed="${on}" aria-label="Mark done">${on ? I.check : I.warn}</button><div><div class="t">${esc(c.title)}</div><div class="n">${esc(c.text)}</div>${c.g ? `<a class="more" href="#/g/${c.g}">Step by step ›</a>` : ''}</div></li>`;
    }).join('')}</ul></section>` : ''}
    <section class="section"><h2>Trains</h2>
      ${pre ? row('suica-setup', 'Setup') : ''}${row('suica-riding', 'Suica')}
      <details class="fold"><summary>Train and taxi tips</summary><ul class="notes plain">${E.trains.map((t) => `<li>${esc(t.t)}</li>`).join('')}</ul></details>
    </section>
    <section class="section"><details class="fold"><summary>Every route, day by day <span class="aside">${routes.filter((r) => !r.g.startsWith('suica-')).length}</span></summary>${routes.filter((r) => !r.g.startsWith('suica-')).map((r) => row(r.g, dayMonth(r.date))).join('')}</details></section>
    <section class="section"><h2>Phrases</h2><ul class="phrases">${E.phrases.map((p, i) => `<li><button type="button" data-phrase="${i}"><span class="pe">${esc(p.en)}</span><span class="pj ja" lang="ja">${esc(p.ja)}</span></button></li>`).join('')}</ul></section>
    <section class="section"><h2>Emergency</h2><dl class="facts">${E.emergency.map((e) => fact(e.label, `<a href="${telHref(e.value)}">${esc(e.value)}</a>`, 'big tnum')).join('')}</dl></section>
    <section class="section"><h2>This app</h2>
      <div class="status-line flush" id="offline-line"><span class="dot"></span><span>Checking offline copy…</span></div>
      <p class="muted small">Version ${esc(META.version)}</p>
      <div class="btn-row"><button type="button" class="btn ghost" data-update>Check for updates</button></div></section>
  </main>${tabbar('guide')}`;
}

function notFound() {
  return `<main class="screen"><div class="page-head"><h1>Not here</h1><p>That page doesn't exist. <a href="#/today" style="color:var(--kin)">Go to today</a>.</p></div></main>${tabbar('')}`;
}

/* ---------------- Overlays ---------------- */
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* not supported */ }
}
function overlay(cls, html, onOpen) {
  const el = document.createElement('div');
  el.className = `overlay ${cls}`;
  el.setAttribute('role', 'dialog');
  el.innerHTML = `<button type="button" class="ov-close" aria-label="Close">${I.close}</button>${html}`;
  const close = () => { el.remove(); keepAwake(false); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  el.querySelector('.ov-close').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  onOpen?.(el, close);
  return el;
}
function showQR(id, start = 0) {
  const b = B(id);
  if (!b?.tickets?.length) return;
  let i = Math.min(start, b.tickets.length - 1);
  overlay('qr-ov', `<div class="qr-stage"><p class="qo-title">${esc(b.title)}</p><p class="qo-when">${esc(whenText(b))}</p>
    <img class="qo-img" alt=""><p class="qo-label"></p>
    ${b.tickets.length > 1 ? `<div class="qo-nav"><button type="button" data-step="-1" aria-label="Previous ticket">${I.prev}</button><span class="qo-count"></span><button type="button" data-step="1" aria-label="Next ticket">${I.next}</button></div>` : ''}
    <p class="qo-hint">Turn the screen brightness up if the scanner struggles.</p></div>`, (el) => {
    const draw = () => {
      el.querySelector('.qo-img').src = qrSrc(b, i);
      el.querySelector('.qo-img').alt = `QR code, ${b.tickets[i].label}`;
      el.querySelector('.qo-label').textContent = b.tickets[i].label;
      const c = el.querySelector('.qo-count'); if (c) c.textContent = `${i + 1} of ${b.tickets.length}`;
    };
    el.addEventListener('click', (e) => { const s = e.target.closest('[data-step]'); if (s) { i = (i + Number(s.dataset.step) + b.tickets.length) % b.tickets.length; draw(); } });
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => { if (x0 === null || b.tickets.length < 2) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { i = (i + (dx < 0 ? 1 : -1) + b.tickets.length) % b.tickets.length; draw(); } x0 = null; });
    draw(); keepAwake(true);
  });
}
function driverPlace(key) {
  if (key.startsWith('p:')) return TRIP.places?.[key.slice(2)];
  const [id, second] = key.split('#');
  const b = B(id);
  return second ? b?.place2 : b?.place;
}
function showDriver(key) {
  const p = driverPlace(key);
  if (!p) return;
  const ja = [p.nameJa, p.addressJa].filter(Boolean);
  const main = ja.length
    ? `<div class="drv-addr ja" lang="ja">${ja.map(esc).join('<br>')}</div>`
    : `<div class="drv-addr"><span class="drv-l">電話番号 · phone</span><span class="tnum">${esc(p.phone)}</span></div>`;
  overlay('driver', `<div class="drv">${main}
    <p class="drv-en">${esc(p.name)}${p.address ? `<br>${esc(p.address)}` : ''}</p>
    ${ja.length && p.phone ? `<p class="drv-en">電話 ${esc(p.phone)}</p>` : ''}
    ${!ja.length ? '<p class="drv-en">Drivers can set the satnav from the phone number.</p>' : ''}</div>`, () => keepAwake(true));
}
function showPhrase(i) {
  const p = TRIP.essentials.phrases[i];
  overlay('driver', `<div class="drv"><div class="drv-addr ja" lang="ja">${esc(p.ja)}</div><p class="drv-en">${esc(p.en)}<br><i>${esc(p.say)}</i></p></div>`);
}
function showDoc(key) {
  overlay('doc-ov', `<div class="doc-stage"><img src="${IMAGES[key]}" alt="Original booking voucher"></div>`);
}

/* ---------------- Router ---------------- */
function render() {
  const h = location.hash.replace(/^#\/?/, '');
  const [route, arg] = h.split('/');
  let html;
  switch (route) {
    case '': case 'today': html = dayView(defaultDate(), { isToday: true }); break;
    case 'day': html = dayView(arg, { isToday: false }); break;
    case 'days': html = daysView(); break;
    case 'bookings': html = bookingsView(FILTERS.some(([f]) => f === arg) ? arg : 'all'); break;
    case 'b': html = bookingView(arg); break;
    case 'g': html = guidePage(arg); break;
    case 'guide': html = guideView(); break;
    // Old links from the first version.
    case 'stays': html = bookingsView('stays'); break;
    case 'travel': html = bookingsView('travel'); break;
    case 'tickets': html = bookingsView('tickets'); break;
    case 'stay': case 'booking': html = bookingView(arg); break;
    default: html = notFound();
  }
  app.innerHTML = html;
  if (route === '' || route === 'today' || route === 'guide') updateOfflineLine();
}
function navigated() {
  const y = trackNavigation();
  render();
  window.scrollTo(0, y);
}

app.addEventListener('click', async (e) => {
  const t = e.target;
  const bk = t.closest('[data-back]');
  if (bk) { e.preventDefault(); history.back(); return; }
  const gobtn = t.closest('[data-go]');
  if (gobtn) { go(gobtn.dataset.go, gobtn.hasAttribute('data-replace')); return; }
  const rep = t.closest('a[data-replace]');
  if (rep) { e.preventDefault(); if (rep.getAttribute('href') !== location.hash) go(rep.getAttribute('href'), true); return; }
  const tick = t.closest('[data-tick]');
  if (tick) {
    e.preventDefault();
    const on = toggleDone(tick.dataset.tick);
    tick.setAttribute('aria-pressed', String(on));
    tick.closest('li')?.classList.toggle('done', on);
    tick.innerHTML = on ? I.check : (tick.dataset.kind === 'do' && tick.closest('.checklist') ? I.warn : kindIcon(tick.dataset.kind));
    return;
  }
  const qr = t.closest('[data-qr]');
  if (qr) { e.preventDefault(); showQR(qr.dataset.qr, Number(qr.dataset.i || 0)); return; }
  const drv = t.closest('[data-driver]');
  if (drv) { showDriver(drv.dataset.driver); return; }
  const ph = t.closest('[data-phrase]');
  if (ph) { showPhrase(Number(ph.dataset.phrase)); return; }
  const doc = t.closest('[data-doc]');
  if (doc) { showDoc(doc.dataset.doc); return; }
  const cp = t.closest('[data-copy]');
  if (cp) {
    try { await navigator.clipboard.writeText(cp.dataset.copy); toast('Copied'); } catch { toast('Couldn’t copy — press and hold to select'); }
    return;
  }
  if (t.closest('[data-update]')) {
    if (!REG) { toast('Updates only work in the installed app'); return; }
    toast('Checking…');
    try {
      await REG.update();
      if (!REG.installing && !REG.waiting) toast('You have the latest version');
      else toast('Downloading the update — the app will reload itself');
    } catch { toast('Couldn’t reach the internet — try again on wifi'); }
    return;
  }
  const sim = t.closest('[data-sim]');
  if (sim) { session.set('jt-sim', sim.dataset.sim || null); location.hash = '#/today'; render(); }
});
app.addEventListener('change', (e) => {
  if (e.target.matches('[data-simpick]') && e.target.value) { session.set('jt-sim', e.target.value.slice(0, 16)); render(); }
});
window.addEventListener('hashchange', navigated);
// Keep "now" honest while the app stays open.
setInterval(() => { const r = location.hash.replace(/^#\/?/, '').split('/')[0]; if ((r === '' || r === 'today') && !document.querySelector('.overlay')) { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 60000);

/* ---------------- Offline status ---------------- */
async function updateOfflineLine() {
  const el = document.getElementById('offline-line');
  if (!el) return;
  const builtAt = META.builtAt ? new Date(META.builtAt) : null;
  const when = builtAt ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }).format(builtAt) : '';
  // On Today the line only appears when something is wrong; the Guide tab always shows it.
  const set = (cls, text) => {
    el.className = `status-line ${cls}${el.classList.contains('flush') ? ' flush' : ''}`;
    el.querySelector('span:last-child').textContent = text;
    el.hidden = cls === 'ok' && el.closest('.screen')?.querySelector('.hero') !== null;
  };
  if (META.preview) { set('ok', 'Preview — not installed on this phone'); return; }
  if (!('serviceWorker' in navigator) || !('caches' in window)) { set('warn', 'This browser can’t save the app for offline use'); return; }
  try {
    const keys = await caches.keys();
    const ours = keys.find((k) => k === `japan-${META.version}`);
    const hit = ours && (await (await caches.open(ours)).match('data.bin', { ignoreSearch: true }));
    if (hit) set('ok', `Offline ready · data from ${when}`);
    else set('warn', 'Saving for offline — keep the app open on wifi for a moment');
  } catch { set('warn', 'Couldn’t check the offline copy'); }
}

/* ---------------- Crypto + storage ---------------- */
const idb = {
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('japan', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  },
  async get(k) { const db = await this.open(); return new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
  async set(k, v) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
};
const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');
function splitBundle(buf) {
  const u8 = new Uint8Array(buf);
  if (new TextDecoder().decode(u8.slice(0, 4)) !== 'JT01') throw new Error('bad-format');
  return { salt: u8.slice(4, 20), iv: u8.slice(20, 32), data: u8.slice(32) };
}
async function deriveKey(passphrase, salt, extractable) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase.normalize('NFKC').trim().toLowerCase()), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, extractable, ['decrypt']);
}
async function decryptBundle(key, parts) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: parts.iv }, key, parts.data);
  const stream = new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
}
async function saveKey(key, passphrase, salt) {
  try { await idb.set('key', { key, salt: hex(salt) }); return; } catch { /* fall back below */ }
  const raw = await crypto.subtle.exportKey('raw', await deriveKey(passphrase, salt, true));
  store.set('jt-key', { raw: hex(new Uint8Array(raw)), salt: hex(salt) });
}
async function loadKey(salt) {
  try { const rec = await idb.get('key'); if (rec && rec.salt === hex(salt)) return rec.key; } catch { /* try fallback */ }
  const fb = store.get('jt-key', null);
  if (fb && fb.salt === hex(salt)) return crypto.subtle.importKey('raw', new Uint8Array(fb.raw.match(/../g).map((h) => parseInt(h, 16))), 'AES-GCM', false, ['decrypt']);
  return null;
}

function unlockScreen(parts, onOpen) {
  app.innerHTML = `<main class="unlock">
    <div class="sun" aria-hidden="true"><span class="ja">日本</span></div>
    <h1>Japan</h1>
    <p>Enter your passphrase once and everything is saved on this phone for the trip.</p>
    <form autocomplete="off">
      <input type="password" name="pass" placeholder="Passphrase" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Passphrase" required>
      <p class="err" role="alert"></p>
      <button type="submit">Unlock</button>
    </form>
  </main>`;
  const form = app.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button'); const err = form.querySelector('.err'); const pass = form.pass.value;
    btn.disabled = true; btn.textContent = 'Unlocking…'; err.textContent = '';
    try {
      const key = await deriveKey(pass, parts.salt, false);
      const bundle = await decryptBundle(key, parts);
      await saveKey(key, pass, parts.salt);
      try { await navigator.storage?.persist?.(); } catch { /* optional */ }
      onOpen(bundle);
    } catch {
      err.textContent = 'That passphrase didn’t open the trip. Check the spelling and spaces.';
      btn.disabled = false; btn.textContent = 'Unlock';
    }
  });
}

/* ---------------- Boot ---------------- */
function open(bundle) {
  TRIP = bundle.trip;
  IMAGES = bundle.images || {};
  META = { ...META, ...bundle.meta, preview: !!bundle.meta?.preview };
  const seen = store.get('jt-version', null);
  if (seen && seen !== META.version && !META.preview) toast(`Updated · data from ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }).format(new Date(META.builtAt))}`);
  store.set('jt-version', META.version);
  // The font subset for the trip's Japanese text is only named inside the encrypted data.
  if (bundle.meta?.jaFont && !document.querySelector('link[data-jafont]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = bundle.meta.jaFont; l.dataset.jafont = '';
    document.head.appendChild(l);
  }
  navigated();
}
function toast(text) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
async function boot() {
  if (window.__BUNDLE__) { open(window.__BUNDLE__); return; }
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      REG = reg;
      reg.update?.();
      // iOS resumes home-screen apps instead of relaunching them, so check again whenever the app comes back to the front.
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update?.().catch(() => {}); });
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
    } catch { /* offline mode unavailable */ }
  }
  let parts;
  try {
    const res = await fetch(`data.bin?v=${BUILD}`);
    if (!res.ok) throw new Error(String(res.status));
    parts = splitBundle(await res.arrayBuffer());
  } catch {
    app.innerHTML = `<main class="unlock"><h1>Japan</h1><p>The trip data couldn’t be loaded. Open the app once on wifi so it can save everything to this phone.</p></main>`;
    return;
  }
  const key = await loadKey(parts.salt).catch(() => null);
  if (key) { try { open(await decryptBundle(key, parts)); return; } catch { /* key no longer matches */ } }
  unlockScreen(parts, open);
}
boot();

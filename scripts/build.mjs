#!/usr/bin/env node
// Builds the offline app into docs/ (published by GitHub Pages).
//   node scripts/build.mjs                 → encrypted build in docs/
//   node scripts/build.mjs --preview FILE  → one self-contained plaintext HTML for design review (never commit it)
// Plain trip data, tickets and the passphrase live in private/ and are never committed.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { createHash, randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'docs');
// Private data lives OUTSIDE the repository (a sibling folder), so nothing in it can ever be committed by mistake.
const PRIV = process.env.JT_PRIVATE
  || [join(ROOT, '..', 'japan-trip-private'), join(ROOT, 'private')].find((p) => existsSync(join(p, 'trip.json')))
  || join(ROOT, '..', 'japan-trip-private');
const args = process.argv.slice(2);
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;

const read = (p) => readFileSync(p, 'utf8');
const trip = JSON.parse(read(join(PRIV, 'trip.json')));

// ---- Sanity checks: fail loudly on broken data rather than shipping it.
const problems = [];
const bookingIds = new Set(trip.bookings.map((b) => b.id));
const guideIds = new Set(Object.keys(trip.guides || {}));
const dates = trip.days.map((d) => d.date);
for (let i = 1; i < dates.length; i++) if (dates[i] <= dates[i - 1]) problems.push(`days out of order at ${dates[i]}`);
for (const d of trip.days) {
  if (!trip.cities[d.city]) problems.push(`${d.date}: unknown city ${d.city}`);
  for (const it of d.plan || []) {
    if (it.b && !bookingIds.has(it.b)) problems.push(`${d.date}: unknown booking ${it.b}`);
    if (it.g && !guideIds.has(it.g)) problems.push(`${d.date}: unknown guide ${it.g}`);
    if (it.time && /^\d/.test(it.time) && !/^\d{2}:\d{2}$/.test(it.time)) problems.push(`${d.date}: bad time "${it.time}"`);
    if (it.shops && (it.b || it.g)) problems.push(`${d.date}: "${it.title}" has shops but opens a booking or guide, so the list can't be reached`);
    for (const s of it.shops || []) if (!s.name || (s.map && !s.map.q)) problems.push(`${d.date}: "${it.title}" has a shop without a name or map query`);
  }
}
for (const b of trip.bookings) for (const g of b.guide || []) if (!guideIds.has(g)) problems.push(`${b.id}: unknown guide ${g}`);
const MEAL_IDS = ['coffee', 'lunch', 'dinner', 'drinks'];
for (const p of trip.food || []) {
  if (!trip.cities[p.city]) problems.push(`food ${p.name}: unknown city ${p.city}`);
  if (!p.meals?.length || p.meals.some((m) => !MEAL_IDS.includes(m))) problems.push(`food ${p.name}: bad meals ${p.meals}`);
  for (const d of p.dates || []) if (!dates.includes(d)) problems.push(`food ${p.name}: date ${d} is not a trip day`);
}

// ---- QR codes: redrawn from each ticket's payload and round-trip checked (scripts/qr.py).
try { execFileSync('python3', [join(ROOT, 'scripts', 'qr.py'), PRIV], { stdio: 'inherit' }); } catch { problems.push('QR codes failed their round-trip check'); }
const qrIndex = existsSync(join(PRIV, 'tickets', 'qr', 'index.json')) ? JSON.parse(read(join(PRIV, 'tickets', 'qr', 'index.json'))) : {};

// ---- Images (QR codes, original vouchers) → data URIs inside the encrypted bundle.
const images = {};
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const embed = (key, rel) => {
  const p = join(PRIV, 'tickets', rel);
  if (!existsSync(p)) { problems.push(`missing image ${rel}`); return; }
  images[key] = `data:${mime[extname(p).toLowerCase()] || 'application/octet-stream'};base64,${readFileSync(p).toString('base64')}`;
};
for (const b of trip.bookings) {
  (b.tickets || []).forEach((t, i) => { if (t.qr) embed(`${b.id}#${i}`, (qrIndex[b.id] || [])[i] || ''); });
  for (const d of b.docs || []) embed(d, d);
}
for (const d of trip.essentials?.insurance?.docs || []) embed(d, d);
if (problems.length) { console.error('Data problems:\n  ' + problems.join('\n  ')); process.exit(1); }

// ---- Fonts: Latin families as normal, Shippori Mincho subset to the Japanese characters we use.
const appJs = read(join(SRC, 'app.js'));
const JA = /[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]/gu;
const chars = (s) => [...new Set(s.match(JA) || [])].sort().join('');
const jaChars = chars(JSON.stringify(trip) + appJs);
const SHIPPORI = (text) => `https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&display=swap&text=${encodeURIComponent(text)}`;
// Public files only name the characters the app's own interface uses. The trip's characters (place names,
// addresses) go inside the encrypted bundle and the app asks for that font after unlocking.
const jaFont = SHIPPORI(jaChars);
const FONT_CSS = [
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@400;500;700&display=swap',
  SHIPPORI(chars(appJs)),
];
const fontLinks = FONT_CSS.map((h) => `<link rel="stylesheet" href="${h.replace(/&/g, '&amp;')}">`).join('\n');

// ---- Version from content (not ciphertext), so identical data gives an identical version.
const css = read(join(SRC, 'app.css'));
const version = createHash('sha256').update(appJs + css + read(join(SRC, 'sw.js')) + JSON.stringify(trip) + JSON.stringify(images)).digest('hex').slice(0, 12);
const builtAt = new Date().toISOString();
const bundle = { meta: { version, builtAt, pulledAt: trip.meta.pulledAt, jaFont }, trip, images };

if (previewOut) {
  bundle.meta.preview = true;
  const html = read(join(SRC, 'index.html'))
    .replace('<!--FONTS-->', fontLinks)
    .replace('<!--CSS-->', `<style>\n${css}\n</style>`)
    .replace('<!--DATA-->', `<script>window.__BUNDLE__ = ${JSON.stringify(bundle).replace(/</g, '\\u003c')};</script>`)
    .replace('<!--JS-->', `<script>\n${appJs.replace('__VERSION__', version)}\n</script>`)
    .replace(/<link rel="(manifest|apple-touch-icon|icon)"[^>]*>\n/g, '');
  writeFileSync(previewOut, html);
  console.log(`Preview written to ${previewOut} (${(html.length / 1024).toFixed(0)} KB, version ${version})`);
  process.exit(0);
}

// ---- Encrypt: AES-256-GCM, key = PBKDF2-SHA256(passphrase, salt, 600k). Salt is fixed per trip so phones keep their key across updates.
const passFile = join(PRIV, 'passphrase.txt');
const passphrase = (process.env.TRIP_PASSPHRASE || (existsSync(passFile) ? read(passFile) : '')).normalize('NFKC').trim().toLowerCase();
if (passphrase.split(/\s+/).length < 4) { console.error('Set a passphrase of at least four words in private/passphrase.txt or TRIP_PASSPHRASE.'); process.exit(1); }
const saltFile = join(PRIV, 'salt.hex');
if (!existsSync(saltFile)) writeFileSync(saltFile, randomBytes(16).toString('hex'));
const salt = Buffer.from(read(saltFile).trim(), 'hex');
const key = pbkdf2Sync(passphrase, salt, 600000, 32, 'sha256');
const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(gzipSync(JSON.stringify(bundle), { level: 9 })), cipher.final(), cipher.getAuthTag()]);
const dataBin = Buffer.concat([Buffer.from('JT01'), salt, iv, ct]);

// ---- Write docs/.
mkdirSync(join(OUT, 'icons'), { recursive: true });
writeFileSync(join(OUT, 'data.bin'), dataBin);
writeFileSync(join(OUT, 'app.css'), css);
writeFileSync(join(OUT, 'app.js'), appJs.replace('__VERSION__', version));
copyFileSync(join(SRC, 'manifest.webmanifest'), join(OUT, 'manifest.webmanifest'));
writeFileSync(join(OUT, '.nojekyll'), '');
if (!existsSync(join(OUT, 'icons', 'icon.svg'))) copyFileSync(join(SRC, 'icons', 'icon.svg'), join(OUT, 'icons', 'icon.svg'));
for (const [name, size, pad] of [['icon-180.png', 180, 0], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 1]]) {
  const svg = pad ? read(join(SRC, 'icons', 'icon.svg')).replace('r="172"', 'r="150"').replace('font-size="128"', 'font-size="110"').replace('y="300"', 'y="294"') : read(join(SRC, 'icons', 'icon.svg'));
  const tmp = join(tmpdir(), `japan-${name}.svg`); // outside the repo, so nothing is left behind
  writeFileSync(tmp, svg);
  try { execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', join(OUT, 'icons', name), tmp]); }
  catch { if (!existsSync(join(OUT, 'icons', name))) throw new Error('rsvg-convert is needed to draw the app icons'); }
  execFileSync('rm', ['-f', tmp]);
}
const html = read(join(SRC, 'index.html'))
  .replace('<!--FONTS-->', fontLinks)
  .replace('<!--CSS-->', `<link rel="stylesheet" href="app.css?v=${version}">`)
  .replace('<!--DATA-->', '')
  .replace('<!--JS-->', `<script src="app.js?v=${version}" defer></script>`);
writeFileSync(join(OUT, 'index.html'), html);

const assets = ['index.html', `app.css?v=${version}`, `app.js?v=${version}`, `data.bin?v=${version}`, 'manifest.webmanifest',
  ...readdirSync(join(OUT, 'icons')).filter((f) => !f.startsWith('.')).map((f) => `icons/${f}`)];
writeFileSync(join(OUT, 'sw.js'), read(join(SRC, 'sw.js'))
  .replace('__VERSION__', version)
  .replace('__ASSETS__', JSON.stringify(assets, null, 2))
  .replace('__FONT_CSS__', JSON.stringify(FONT_CSS, null, 2)));

console.log(`Built version ${version} · data ${(dataBin.length / 1024).toFixed(0)} KB · ${Object.keys(images).length} images · ${trip.bookings.length} bookings · ${jaChars.length} Japanese characters`);

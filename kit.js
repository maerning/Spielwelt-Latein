/* Latein-Spielewelt – gemeinsame Bausteine für alle Spiele */
(function () {
const W = 1280, H = 720;
const FONT = '"Fredoka","Arial Rounded MT Bold","Trebuchet MS",sans-serif';
const K = window.K = { W, H, FONT };

/* ---------- Seite / Canvas ---------- */
const style = document.createElement('style');
style.textContent = `
html,body{margin:0;height:100%;background:#1d1530;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;font-family:${FONT}}
#wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
canvas{display:block;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.5);outline:none}
.kbtn{position:fixed;top:12px;width:46px;height:46px;border-radius:50%;border:3px solid #fff;background:rgba(0,0,0,.35);color:#fff;font-size:22px;cursor:pointer;z-index:5;display:flex;align-items:center;justify-content:center;text-decoration:none;font-family:inherit;padding:0}
#kmute{right:12px} #kfull{right:68px} #khome{left:12px}`;
document.head.appendChild(style);
const fl = document.createElement('link'); fl.rel = 'stylesheet';
fl.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap'; document.head.appendChild(fl);

const wrap = document.createElement('div'); wrap.id = 'wrap';
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.tabIndex = 0;
wrap.appendChild(cv); document.body.appendChild(wrap);
const ctx = cv.getContext('2d'); K.cv = cv; K.ctx = ctx;
K.scale = 1;
function fit() { const s = Math.min(innerWidth / W, innerHeight / H); K.scale = s; cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }
addEventListener('resize', fit); fit();

function mkBtn(id, html, title, onclick, href) {
  const b = document.createElement(href ? 'a' : 'button'); b.id = id; b.className = 'kbtn'; b.innerHTML = html; b.title = title;
  if (href) b.href = href; else b.onclick = e => { e.stopPropagation(); b.blur(); onclick(); };
  b.addEventListener('pointerdown', e => e.stopPropagation());
  document.body.appendChild(b); return b;
}
mkBtn('khome', '🏠', 'Zurück zur Spielewelt', null, 'index.html');
const muteBtn = mkBtn('kmute', '🔊', 'Ton an/aus', () => { K.audio(); K.muted = !K.muted; muteBtn.textContent = K.muted ? '🔇' : '🔊'; });
mkBtn('kfull', '⛶', 'Vollbild', () => {
  const d = document.documentElement;
  try { const r = !document.fullscreenElement ? (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d) : document.exitFullscreen(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
});
K.hideHome = () => document.getElementById('khome').style.display = 'none';

/* ---------- Eingabe ---------- */
K.onTap = null; K.onKey = null;
function focusMe() { try { window.focus(); cv.focus({ preventScroll: true }); } catch (_) {} }
addEventListener('load', focusMe);
cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') e.preventDefault();
  focusMe(); K.audio();
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  K.onTap && K.onTap(x, y, e);
});
window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  K.audio(); K.onKey && !e.repeat && K.onKey(e);
});
K.hit = (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

/* ---------- Bilder ---------- */
K.load = (map) => {
  const out = {};
  return Promise.all(Object.entries(map).map(([k, src]) => new Promise(res => {
    const im = new Image(); im.onload = () => { out[k] = im; res(); }; im.onerror = () => res(); im.src = src;
  }))).then(() => out);
};
K.drawCover = (im, x = 0, y = 0, w = W, h = H) => {
  if (!im) return; const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
  const iw = im.naturalWidth * s, ih = im.naturalHeight * s;
  ctx.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
};
K.drawH = (im, cx, by, h, flip = false, filter = null) => { // zentriert, Fußpunkt unten
  if (!im) return; const w = im.naturalWidth * h / im.naturalHeight;
  ctx.save(); ctx.translate(cx, by); if (flip) ctx.scale(-1, 1); if (filter) ctx.filter = filter;
  ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore(); return w;
};

/* ---------- Zeichnen ---------- */
K.rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
K.text = (t, x, y, size, col, o = {}) => {
  ctx.font = `${o.weight || 700} ${size}px ${FONT}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw || size * .22; ctx.strokeStyle = o.stroke; ctx.strokeText(t, x, y); }
  ctx.fillStyle = col; ctx.fillText(t, x, y);
};
K.fit = (t, maxW, size, weight = 700) => { ctx.font = `${weight} ${size}px ${FONT}`; const w = ctx.measureText(t).width; return w > maxW ? size * maxW / w : size; };
K.panel = (w, h, cy = H / 2, dim = true) => {
  if (dim) { ctx.fillStyle = 'rgba(20,10,40,.55)'; ctx.fillRect(0, 0, W, H); }
  K.rr(W / 2 - w / 2, cy - h / 2, w, h, 40); ctx.fillStyle = 'rgba(255,250,240,.97)'; ctx.fill();
  ctx.lineWidth = 9; ctx.strokeStyle = '#d4a017'; ctx.stroke();
};
K.title = (t, y, size = 80, col = '#ffd23f', stroke = '#7d0f1c') => K.text(t, W / 2, y, size, col, { stroke, sw: size * .17 });
K.blink = (t, y, size = 30, col = '#b3202f') => { if (Math.floor(performance.now() / 500) % 2 === 0) K.text(t, W / 2, y, size, col); };
// große Antwort-Taste. state: null | 'ok' | 'bad' | 'dim'
K.button = (b, label, state = null, opts = {}) => {
  const t = performance.now() / 1000;
  ctx.save();
  if (state === 'dim') ctx.globalAlpha = .4;
  const hover = opts.pulse ? 1 + Math.sin(t * 6) * .03 : 1;
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(hover, hover);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; K.rr(-b.w / 2 + 5, -b.h / 2 + 7, b.w, b.h, 24); ctx.fill();
  const g = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2);
  const c = state === 'ok' ? ['#b8f5c8', '#5fd38a'] : state === 'bad' ? ['#ffc4cc', '#ff7a8a'] : (opts.colors || ['#fffaf0', '#f1e2c0']);
  g.addColorStop(0, c[0]); g.addColorStop(1, c[1]);
  K.rr(-b.w / 2, -b.h / 2, b.w, b.h, 24); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = state === 'ok' ? '#1e9e57' : state === 'bad' ? '#d62839' : (opts.border || '#d4a017'); ctx.stroke();
  K.text(label, 0, 2, K.fit(label, b.w - 30, opts.size || 38), opts.textCol || '#3b2a1a');
  ctx.restore();
};
K.heart = (x, y, full, s = 1.25) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-18, -6, -10, -20, 0, -10); ctx.bezierCurveTo(10, -20, 18, -6, 0, 8);
  ctx.fillStyle = full ? '#ff4d6d' : 'rgba(80,80,80,.55)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
};
K.pill = (x, y, w, txt, col = '#ffd23f') => { // dunkle Pille mit Text (Punkte, Zeit)
  K.rr(x, y, w, 50, 25); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill();
  K.text(txt, x + w / 2, y + 26, 28, col, { stroke: 'rgba(0,0,0,.6)', sw: 5 });
};

/* ---------- Partikel ---------- */
let parts = [], floats = [];
K.puff = (x, y, col, n = 12, sp = 220) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = Math.random() * sp; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: .6 + Math.random() * .4, max: 1, col, r: 4 + Math.random() * 5, g: 500 }); } };
K.confetti = (x, y, n = 45) => {
  const cols = ['#ff4d6d', '#ffd23f', '#3ec1d3', '#7ae582', '#b388ff', '#ff9f1c'];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = 250 + Math.random() * 450;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2 + Math.random() * .6, max: 1.8, col: cols[i % 6], r: 5 + Math.random() * 5, g: 700, rect: true, rot: Math.random() * 6, vr: (Math.random() - .5) * 12 }); }
};
K.coins = (x, y, n = 30) => { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 1.8, v = 300 + Math.random() * 500; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.6, max: 1.6, col: '#f5b700', r: 9 + Math.random() * 5, g: 800, coin: true }); } };
K.float = (x, y, text, col, size = 38) => floats.push({ x, y, text, col, size, life: 1.1 });
K.drawFx = (dt) => {
  for (const q of parts) { q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; if (q.rot !== undefined) q.rot += q.vr * dt; }
  parts = parts.filter(q => q.life > 0);
  for (const q of parts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, q.life / q.max * 1.5)); ctx.fillStyle = q.col;
    if (q.rect) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillRect(-q.r, -q.r / 2, q.r * 2, q.r); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill(); if (q.coin) { ctx.strokeStyle = '#b37800'; ctx.lineWidth = 3; ctx.stroke(); } }
  }
  ctx.globalAlpha = 1;
  for (const f of floats) { f.y -= 70 * dt; f.life -= dt; ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2)); K.text(f.text, f.x, f.y, f.size, f.col, { stroke: '#fff', sw: 7 }); }
  floats = floats.filter(f => f.life > 0); ctx.globalAlpha = 1;
};
K.clearFx = () => { parts = []; floats = []; };

/* ---------- Ton ---------- */
let AC = null, master = null; K.muted = false;
K.audio = () => {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination); } catch (e) {} }
  if (AC && AC.state === 'suspended') AC.resume();
};
function tone(f, t0, dur, type = 'square', vol = .15, f2 = null) {
  if (!AC || K.muted) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .02);
}
const now = () => AC ? AC.currentTime : 0;
K.sfx = {
  tap() { const t = now(); tone(600, t, .06, 'square', .08); },
  jump() { const t = now(); tone(330, t, .18, 'square', .12, 780); },
  coin() { const t = now(); tone(988, t, .08, 'square', .1); tone(1319, t + .07, .18, 'square', .1); },
  right() { const t = now(); [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .08, .22, 'triangle', .22)); },
  wrong() { const t = now(); tone(220, t, .25, 'sawtooth', .15, 110); tone(160, t + .22, .35, 'sawtooth', .15, 80); },
  honk() { const t = now(); tone(420, t, .12, 'sawtooth', .14, 300); tone(420, t + .15, .16, 'sawtooth', .14, 280); },
  bonk() { const t = now(); tone(180, t, .15, 'square', .2, 60); tone(900, t, .05, 'triangle', .15); },
  level() { const t = now(); [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .11, .25, 'square', .12)); },
  win() { const t = now(); [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .14, .3, 'square', .13)); },
  click() { const t = now(); tone(1400, t, .03, 'square', .08); tone(700, t + .03, .05, 'square', .08); },
  unlock() { const t = now(); tone(300, t, .1, 'square', .15); tone(200, t + .1, .2, 'square', .15); [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + .35 + i * .09, .3, 'triangle', .2)); },
  tick() { const t = now(); tone(1800, t, .03, 'square', .05); },
  horn() { const t = now(); [392, 392, 523].forEach((f, i) => tone(f, t + i * .18, i === 2 ? .6 : .14, 'sawtooth', .12)); },
  pop() { const t = now(); tone(300, t, .08, 'sine', .25, 900); }
};
// Hintergrundmusik: K.music(melodie, bass, tempo) ; K.musicOn = true/false
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
let mel = null, bas = null, tempo = .16, step = 0, nextNote = 0; K.musicOn = false;
K.music = (m, b, tp = .16) => { mel = m; bas = b; tempo = tp; step = 0; nextNote = now() + .1; };
K.tempo = tp => tempo = tp;
K.MEL = {
  tarantella: [[76,0,79,76,74,0,72,0,74,76,77,76,74,0,0,0,72,0,74,72,71,0,69,0,71,72,74,72,71,0,0,0],[45,52,45,52,43,50,43,50,41,48,41,48,40,47,40,47]],
  marsch: [[67,0,67,72,0,72,76,0,74,72,74,0,71,0,67,0,69,0,69,72,0,72,74,0,76,74,72,0,72,0,0,0],[48,55,48,55,43,50,43,50,45,52,45,52,43,50,48,55]],
  geheim: [[64,0,67,0,71,0,69,67,64,0,0,0,62,0,64,0,65,0,64,62,60,0,0,0,59,0,62,0,64,0,0,0],[40,47,40,47,38,45,38,45,36,43,36,43,35,42,35,42]],
  froh: [[72,74,76,72,77,0,76,74,72,0,67,0,72,0,0,0,74,76,77,74,79,0,77,76,74,0,71,0,72,0,0,0],[48,55,52,55,50,57,53,57,47,55,50,55,48,55,52,55]]
};
setInterval(() => {
  if (!AC || K.muted || !K.musicOn || !mel) return;
  while (nextNote < AC.currentTime + .25) {
    if (nextNote < AC.currentTime) nextNote = AC.currentTime + .02;
    const m = mel[step % mel.length]; if (m) tone(midi(m), nextNote, tempo * 1.6, 'square', .04);
    if (step % 2 === 0) tone(midi(bas[(step / 2) % bas.length]), nextNote, tempo * 1.8, 'triangle', .08);
    nextNote += tempo; step++;
  }
}, 60);

/* ---------- Hilfen ---------- */
K.shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
K.pick = a => a[Math.random() * a.length | 0];
K.best = (key, v) => { try { const b = +localStorage.getItem(key) || 0; if (v !== undefined && v > b) { localStorage.setItem(key, v); return v; } return b; } catch (e) { return 0; } };
K.loop = (fn) => { let last = performance.now(); const f = (t) => { const dt = Math.min(.033, (t - last) / 1000); last = t; fn(dt, t / 1000); requestAnimationFrame(f); }; requestAnimationFrame(f); };
K.focused = () => document.hasFocus();

/* ---------- Wörter (Latein, richtig, falsch) ---------- */
K.WORDS = [
 ['elephantus','der Elefant','die Elster'], ['tigris','der Tiger','der Teller'], ['leopardus','der Leopard','der Lehrer'],
 ['panthera','der Panther','der Pantoffel'], ['camelus','das Kamel','die Kamera'], ['crocodilus','das Krokodil','der Kakao'],
 ['delphinus','der Delfin','der Dackel'], ['hyaena','die Hyäne','die Hose'], ['mus','die Maus','das Apfelmus'],
 ['draco','der Drache','der Dreck'], ['monstrum','das Monster','der Mond'], ['rosa','die Rose','die Rosine'],
 ['lilium','die Lilie','die Limo'], ['palma','die Palme','die Pfanne'], ['planta','die Pflanze','der Planet'],
 ['oliva','die Olive','die Oma'], ['fructus','die Frucht','der Frosch'], ['oleum','das Öl','die Eule'],
 ['sal','das Salz','der Saal'], ['cista','die Kiste','die Kasse'], ['fenestra','das Fenster','die Feder'],
 ['murus','die Mauer','die Möhre'], ['saccus','der Sack','die Socke'], ['tabula','die Tafel','die Tablette'],
 ['lampas','die Lampe','das Lamm'], ['corona','die Krone','die Kuh'], ['globus','der Globus','die Glocke'],
 ['papyrus','das Papier','der Papagei'], ['villa','die Villa','die Wolle'], ['familia','die Familie','die Fliege'],
 ['nomen','der Name','die Nudel'], ['nasus','die Nase','der Hase'], ['pirata','der Pirat','die Pizza'],
 ['gladiator','der Gladiator','der Gartenzwerg'], ['schola','die Schule','die Schokolade'], ['templum','der Tempel','das Trampolin'],
 ['palatium','der Palast','der Pudding'], ['pyramis','die Pyramide','der Pyjama'], ['theatrum','das Theater','der Tee'],
 ['circus','der Zirkus','der Kürbis'], ['arena','die Arena','die Ananas'], ['canalis','der Kanal','die Kanne'],
 ['insula','die Insel','das Insekt'], ['oceanus','der Ozean','der Ofen'], ['planeta','der Planet','das Plakat'],
 ['cometes','der Komet','die Kommode'], ['musica','die Musik','die Mütze'], ['numerus','die Nummer','die Nuss'],
 ['punctum','der Punkt','der Pinguin'], ['linea','die Linie','die Linse'], ['figura','die Figur','die Feige'],
 ['forma','die Form','die Farbe'], ['centrum','das Zentrum','die Zitrone'], ['problema','das Problem','das Pflaster'],
 ['fabula','die Fabel','die Fabrik'], ['longus','lang','laut'], ['perfectus','perfekt','pünktlich'],
 ['Roma','Rom','Rostock'], ['Italia','Italien','Indien'], ['Germania','Germanien','Grönland']
];
})();

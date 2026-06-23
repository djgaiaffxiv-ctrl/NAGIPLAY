'use strict';

const $ = (id) => document.getElementById(id);
const video = $('video');
const stage = $('stage');

/* ===================== Estado ===================== */
const state = {
  playlist: [],        // { path, name, ext, url }
  current: -1,
  loop: 'off',         // 'off' | 'one' | 'all'
  shuffle: false,
  subShown: true,
  subDelay: 0,         // segundos
  lastVolume: 0.8,
  aspect: 'default',
  speed: 1,
  playlistVisible: true,
  favoriteFolder: null
};

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4];

/* ===================== Iconos SVG (estilo línea, marca NAGI) ===================== */
const L = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor"';
const wrap = (inner, attr) => `<svg class="ic" viewBox="0 0 24 24" ${attr || ''}>${inner}</svg>`;
const ICONS = {
  play: wrap('<path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11.18-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14Z"/>', F),
  pause: wrap('<rect x="6.5" y="5" width="3.6" height="14" rx="1.4"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.4"/>', F),
  stop: wrap('<rect x="6" y="6" width="12" height="12" rx="3"/>', F),
  prev: wrap('<rect x="5.5" y="5.5" width="2.8" height="13" rx="1.4"/><path d="M19 6.3v11.4a1 1 0 0 1-1.54.84l-8.7-5.7a1 1 0 0 1 0-1.68l8.7-5.7A1 1 0 0 1 19 6.3Z"/>', F),
  next: wrap('<path d="M5 6.3v11.4a1 1 0 0 0 1.54.84l8.7-5.7a1 1 0 0 0 0-1.68l-8.7-5.7A1 1 0 0 0 5 6.3Z"/><rect x="15.7" y="5.5" width="2.8" height="13" rx="1.4"/>', F),
  volHigh: wrap('<path d="M4 9.5v5a1 1 0 0 0 1 1h2.6l4.1 3.3a1 1 0 0 0 1.63-.78V5.98a1 1 0 0 0-1.63-.78L7.6 8.5H5a1 1 0 0 0-1 1Z" fill="currentColor"/><path d="M16.4 8.9a4.5 4.5 0 0 1 0 6.2M18.9 6.6a8 8 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  volLow: wrap('<path d="M4 9.5v5a1 1 0 0 0 1 1h2.6l4.1 3.3a1 1 0 0 0 1.63-.78V5.98a1 1 0 0 0-1.63-.78L7.6 8.5H5a1 1 0 0 0-1 1Z" fill="currentColor"/><path d="M16.4 8.9a4.5 4.5 0 0 1 0 6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  volMute: wrap('<path d="M4 9.5v5a1 1 0 0 0 1 1h2.6l4.1 3.3a1 1 0 0 0 1.63-.78V5.98a1 1 0 0 0-1.63-.78L7.6 8.5H5a1 1 0 0 0-1 1Z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  loop: wrap('<path d="M17 4l3 3-3 3"/><path d="M20 7H9a5 5 0 0 0-5 5"/><path d="M7 20l-3-3 3-3"/><path d="M4 17h11a5 5 0 0 0 5-5"/>', L),
  loopOne: wrap('<path d="M17 4l3 3-3 3"/><path d="M20 7H9a5 5 0 0 0-5 5"/><path d="M7 20l-3-3 3-3"/><path d="M4 17h11a5 5 0 0 0 5-5"/><text x="12" y="15" font-size="8" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none">1</text>', L),
  subs: wrap('<rect x="3" y="5" width="18" height="14" rx="3.2"/><path d="M6.5 11h4M6.5 14.5h6.5M15 14.5h2.5M14.5 11h3"/>', L),
  cut: wrap('<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M8.1 7.3 20 16.6M8.1 16.7 20 7.4M8.5 12l3.5-2"/>', L),
  camera: wrap('<path d="M3 8.7A1.7 1.7 0 0 1 4.7 7H7l1.4-2.2a1 1 0 0 1 .85-.47h5.5a1 1 0 0 1 .85.47L17 7h2.3A1.7 1.7 0 0 1 21 8.7v8.6A1.7 1.7 0 0 1 19.3 19H4.7A1.7 1.7 0 0 1 3 17.3Z"/><circle cx="12" cy="13" r="3.3"/>', L),
  playlist: wrap('<path d="M4 7h16M4 12h16M4 17h9"/>', L),
  fullscreen: wrap('<path d="M4 9V5.6A1.6 1.6 0 0 1 5.6 4H9"/><path d="M15 4h3.4A1.6 1.6 0 0 1 20 5.6V9"/><path d="M20 15v3.4a1.6 1.6 0 0 1-1.6 1.6H15"/><path d="M9 20H5.6A1.6 1.6 0 0 1 4 18.4V15"/>', L),
  shuffle: wrap('<path d="M4 6h3.2l9.6 12H20"/><path d="M4 18h3.2l9.6-12H20"/><path d="M17 3l3 3-3 3"/><path d="M17 15l3 3-3 3"/>', L),
  plus: wrap('<path d="M12 5v14M5 12h14"/>', L),
  trash: wrap('<path d="M4 7h16M9.5 7V5.2a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.5 7l.9 11.5A1.7 1.7 0 0 0 9.1 20h5.8a1.7 1.7 0 0 0 1.7-1.5L17.5 7"/>', L)
};

function applyIcons() {
  const map = {
    btnPrev: 'prev', btnStop: 'stop', btnNext: 'next', btnSub: 'subs',
    btnShort: 'cut', btnSnap: 'camera', btnPlaylistToggle: 'playlist', btnFs: 'fullscreen',
    btnShuffle: 'shuffle', btnPlAdd: 'plus', btnPlClear: 'trash'
  };
  for (const [id, name] of Object.entries(map)) { const el = $(id); if (el) el.innerHTML = ICONS[name]; }
}

/* ===================== Utilidades ===================== */
function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return (h > 0 ? h + ':' : '') + mm + ':' + String(sec).padStart(2, '0');
}

function toFileUrl(p) {
  // Convertir ruta de Windows/POSIX a file:// válido.
  let norm = p.replace(/\\/g, '/');
  if (!norm.startsWith('/')) norm = '/' + norm;
  return 'file://' + encodeURI(norm).replace(/#/g, '%23').replace(/\?/g, '%3F');
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1100);
}

function osd(symbol) {
  const o = $('osd');
  o.textContent = symbol;
  o.classList.remove('flash');
  void o.offsetWidth; // reiniciar animación
  o.classList.add('flash');
}

/* ===================== Playlist ===================== */
async function addPaths(paths, { autoplay = true } = {}) {
  if (!paths || !paths.length) return;
  const stats = await window.nagi.statFiles(paths);
  const startLen = state.playlist.length;
  for (const s of stats) {
    if (!s.exists) continue;
    state.playlist.push({ path: s.path, name: s.name, ext: s.ext, url: toFileUrl(s.path) });
  }
  renderPlaylist();
  if (autoplay && (state.current < 0 || startLen === 0)) {
    playIndex(startLen);
  } else {
    toast(`${stats.filter((s) => s.exists).length} añadido(s) a la lista`);
  }
}

function renderPlaylist() {
  const ul = $('plItems');
  ul.innerHTML = '';
  state.playlist.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'pl-item' + (i === state.current ? ' playing' : '');
    li.innerHTML = `<span class="pl-idx">${i === state.current ? '♪' : i + 1}</span>` +
      `<span class="pl-name" title="${escapeHtml(item.path)}">${escapeHtml(item.name)}</span>` +
      `<span class="pl-rm" title="Quitar">✕</span>`;
    li.querySelector('.pl-name').addEventListener('click', () => playIndex(i));
    li.querySelector('.pl-idx').addEventListener('click', () => playIndex(i));
    li.querySelector('.pl-rm').addEventListener('click', (e) => { e.stopPropagation(); removeIndex(i); });
    ul.appendChild(li);
  });
  $('plEmpty').style.display = state.playlist.length ? 'none' : 'block';
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function removeIndex(i) {
  const wasCurrent = i === state.current;
  state.playlist.splice(i, 1);
  if (i < state.current) state.current--;
  else if (wasCurrent) {
    if (state.playlist.length === 0) { stopAll(); state.current = -1; }
    else playIndex(Math.min(state.current, state.playlist.length - 1));
  }
  renderPlaylist();
}

function clearPlaylist() {
  stopAll();
  state.playlist = [];
  state.current = -1;
  renderPlaylist();
  showWelcome(true);
}

function playIndex(i) {
  if (i < 0 || i >= state.playlist.length) return;
  state.current = i;
  const item = state.playlist[i];
  clearSubtitles();
  video.src = item.url;
  video.playbackRate = state.speed;
  video.play().catch(() => {});
  showWelcome(false);
  $('tbTitle').textContent = item.name + ' — NAGIPLAY';
  document.title = item.name + ' — NAGIPLAY';
  renderPlaylist();
  if (miniActive) { video.addEventListener('loadeddata', sendMiniMeta, { once: true }); sendMiniTick(); }
}

function next(manual = false) {
  if (!state.playlist.length) return;
  if (state.shuffle) {
    if (state.playlist.length === 1) { if (manual) playIndex(state.current); return; }
    let n;
    do { n = Math.floor(Math.random() * state.playlist.length); } while (n === state.current);
    playIndex(n);
    return;
  }
  if (state.current + 1 < state.playlist.length) playIndex(state.current + 1);
  else if (state.loop === 'all') playIndex(0);
  else if (manual) playIndex(0);
}

function prev() {
  if (!state.playlist.length) return;
  if (video.currentTime > 3) { video.currentTime = 0; return; }
  if (state.current - 1 >= 0) playIndex(state.current - 1);
  else playIndex(state.playlist.length - 1);
}

function stopAll() {
  video.pause();
  video.removeAttribute('src');
  video.load();
  $('tbTitle').textContent = 'NAGIPLAY';
  document.title = 'NAGIPLAY';
  updatePlayBtn();
}

/* ===================== Bienvenida ===================== */
function showWelcome(show) {
  $('welcome').classList.toggle('hidden', !show);
  stage.classList.toggle('playing-mode', !show);
}

/* ===================== Reproducción ===================== */
function playpause() {
  if (state.current < 0 && state.playlist.length) { playIndex(0); return; }
  if (!video.src) { openMedia(); return; }
  if (video.paused) { video.play(); osd('▶'); }
  else { video.pause(); osd('⏸'); }
}

function updatePlayBtn() {
  $('btnPlay').innerHTML = (video.paused || !video.src) ? ICONS.play : ICONS.pause;
}

function speedLabel(s) {
  const t = s.toString();
  return (t.includes('.') ? t : t + '.0') + '×';
}
function applySpeed(announce = true) {
  if (video.src) video.playbackRate = state.speed;
  $('btnSpeed').textContent = speedLabel(state.speed);
  if (announce) toast(state.speed === 1 ? 'Velocidad normal' : 'Velocidad ' + state.speed + 'x');
  persist();
}
function cycleSpeed(dir) {
  let idx = SPEEDS.indexOf(state.speed);
  if (idx < 0) idx = SPEEDS.indexOf(1);
  idx = Math.max(0, Math.min(SPEEDS.length - 1, idx + dir));
  state.speed = SPEEDS[idx];
  applySpeed();
}
function resetSpeed() {
  state.speed = 1;
  applySpeed();
}

function seekBy(sec) {
  if (!video.src || !isFinite(video.duration)) return;
  video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + sec));
  toast((sec > 0 ? '+' : '') + sec + 's');
}

function setVolume(v, announce = true) {
  v = Math.max(0, Math.min(1, v));
  video.volume = v;
  video.muted = v === 0;
  if (v > 0) state.lastVolume = v;
  $('volFill').style.width = (v * 100) + '%';
  $('btnMute').innerHTML = (video.muted || v === 0) ? ICONS.volMute : (v < 0.5 ? ICONS.volLow : ICONS.volHigh);
  if (announce) toast('Volumen ' + Math.round(v * 100) + '%');
  persist();
  sendMiniTick();
}

function toggleMute() {
  if (video.muted || video.volume === 0) setVolume(state.lastVolume || 0.8);
  else { setVolume(0, false); toast('Silencio'); }
}

function applyLoopVisual() {
  const btn = $('btnLoop');
  btn.classList.toggle('active', state.loop !== 'off');
  btn.innerHTML = state.loop === 'one' ? ICONS.loopOne : ICONS.loop;
  video.loop = state.loop === 'one';
}
function toggleLoop() {
  state.loop = state.loop === 'off' ? 'all' : state.loop === 'all' ? 'one' : 'off';
  applyLoopVisual();
  toast(state.loop === 'off' ? 'Repetir: no' : state.loop === 'one' ? 'Repetir: una' : 'Repetir: todo');
  persist();
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  $('btnShuffle').classList.toggle('active', state.shuffle);
  toast(state.shuffle ? 'Aleatorio activado' : 'Aleatorio desactivado');
  persist();
}

function setAspect(mode, announce = true) {
  state.aspect = mode;
  video.classList.remove('fit-contain', 'fit-cover', 'fit-fill');
  if (mode === 'contain') video.classList.add('fit-contain');
  else if (mode === 'cover') video.classList.add('fit-cover');
  else if (mode === 'fill') video.classList.add('fit-fill');
  if (announce) toast('Relación: ' + mode);
  persist();
}

/* ===================== Pantalla completa ===================== */
function toggleFullscreen() {
  window.nagi.setFullscreen();
}

/* ===================== Captura ===================== */
async function snapshot() {
  if (!video.src || !video.videoWidth) { toast('Nada que capturar'); return; }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');
  const base = (state.playlist[state.current]?.name || 'nagiplay').replace(/\.[^.]+$/, '');
  const saved = await window.nagi.saveSnapshot(dataUrl, `${base}-captura.png`);
  toast(saved ? 'Captura guardada' : 'Captura cancelada');
}

/* ===================== Subtítulos ===================== */
function clearSubtitles() {
  [...video.querySelectorAll('track')].forEach((t) => t.remove());
  if (clearSubtitles._url) { URL.revokeObjectURL(clearSubtitles._url); clearSubtitles._url = null; }
}

function srtToVtt(srt) {
  const body = srt
    .replace(/\r+/g, '')
    .replace(/^﻿/, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return 'WEBVTT\n\n' + body;
}

async function openSubtitle() {
  const p = await window.nagi.openSubtitle();
  if (!p) return;
  await loadSubtitlePath(p);
}

async function loadSubtitlePath(p) {
  const res = await window.nagi.readSubtitle(p);
  if (res.error) { toast('No se pudo leer el subtítulo'); return; }
  let vtt;
  if (res.ext === 'vtt') vtt = res.text.startsWith('WEBVTT') ? res.text : 'WEBVTT\n\n' + res.text;
  else if (res.ext === 'srt') vtt = srtToVtt(res.text);
  else { toast('Formato ' + res.ext + ' no soportado (usa .srt o .vtt)'); return; }

  clearSubtitles();
  const blob = new Blob([vtt], { type: 'text/vtt' });
  const url = URL.createObjectURL(blob);
  clearSubtitles._url = url;
  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = res.name;
  track.srclang = 'es';
  track.default = true;
  track.src = url;
  video.appendChild(track);
  track.addEventListener('load', () => {
    if (video.textTracks[0]) video.textTracks[0].mode = state.subShown ? 'showing' : 'hidden';
  });
  state.subShown = true;
  $('btnSub').classList.add('active');
  toast('Subtítulos: ' + res.name);
}

function toggleSub() {
  const tt = video.textTracks[0];
  if (!tt) { openSubtitle(); return; }
  state.subShown = !state.subShown;
  tt.mode = state.subShown ? 'showing' : 'hidden';
  $('btnSub').classList.toggle('active', state.subShown);
  toast(state.subShown ? 'Subtítulos visibles' : 'Subtítulos ocultos');
}

function shiftSubDelay(delta) {
  const tt = video.textTracks[0];
  if (!tt || !tt.cues) { toast('Sin subtítulos'); return; }
  state.subDelay += delta;
  for (const cue of tt.cues) { cue.startTime += delta; cue.endTime += delta; }
  toast('Desfase subtítulos: ' + state.subDelay.toFixed(2) + 's');
}

/* ===================== Barra de progreso ===================== */
const seekTrack = $('seekTrack');
function seekFromEvent(e) {
  const r = seekTrack.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  if (isFinite(video.duration)) video.currentTime = ratio * video.duration;
}
let seeking = false;
seekTrack.addEventListener('mousedown', (e) => { seeking = true; seekFromEvent(e); });
window.addEventListener('mousemove', (e) => {
  if (seeking) seekFromEvent(e);
  // tooltip al pasar el ratón
  const r = seekTrack.getBoundingClientRect();
  if (e.clientY >= r.top - 16 && e.clientY <= r.bottom + 16 && isFinite(video.duration)) {
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const tip = $('seekTip');
    tip.textContent = fmtTime(ratio * video.duration);
    tip.style.left = (ratio * r.width) + 'px';
  }
});
window.addEventListener('mouseup', () => { seeking = false; });

const volTrack = $('volTrack');
let volDragging = false;
function volFromEvent(e) {
  const r = volTrack.getBoundingClientRect();
  setVolume((e.clientX - r.left) / r.width, false);
}
volTrack.addEventListener('mousedown', (e) => { volDragging = true; volFromEvent(e); });
window.addEventListener('mousemove', (e) => { if (volDragging) volFromEvent(e); });
window.addEventListener('mouseup', () => { volDragging = false; });

/* ===================== Eventos de <video> ===================== */
video.addEventListener('timeupdate', () => {
  const d = video.duration;
  if (isFinite(d) && d > 0) {
    $('seekFill').style.width = (video.currentTime / d * 100) + '%';
    $('seekKnob').style.left = (video.currentTime / d * 100) + '%';
  }
  $('time').textContent = fmtTime(video.currentTime) + ' / ' + fmtTime(d);
  if (!$('shortSheet').hidden) $('trimPlay').style.left = trimPct(video.currentTime) + '%';
  if (miniActive) sendMiniTick();
});
video.addEventListener('progress', () => {
  if (video.buffered.length && isFinite(video.duration)) {
    const end = video.buffered.end(video.buffered.length - 1);
    $('seekBuffer').style.width = (end / video.duration * 100) + '%';
  }
});
video.addEventListener('play', () => { updatePlayBtn(); sendMiniTick(); });
video.addEventListener('pause', () => { updatePlayBtn(); sendMiniTick(); });
video.addEventListener('ended', () => {
  if (state.loop === 'one') { video.currentTime = 0; video.play(); return; }
  next(false);
});
video.addEventListener('error', () => {
  if (!video.src) return;
  const item = state.playlist[state.current];
  toast('No se pudo reproducir: ' + (item ? item.name : 'archivo'));
});
// Clic simple = play/pausa; doble clic = pantalla completa.
// El clic simple se retrasa lo suficiente (más que el umbral del doble clic del SO)
// para que un doble clic NO dispare también play/pausa.
let clickTimer = null;
function onStageClick(e) {
  if (e.target.closest('.controls') || e.target.closest('.welcome')) return; // botones tienen su lógica
  if (clickTimer) return;
  clickTimer = setTimeout(() => { clickTimer = null; playpause(); }, 280);
}
function onStageDblClick(e) {
  if (e.target.closest('.controls') || e.target.closest('.welcome')) return;
  clearTimeout(clickTimer);
  clickTimer = null;
  toggleFullscreen();
}
// Se escucha en el contenedor (stage) para cubrir también las bandas negras.
stage.addEventListener('click', onStageClick);
stage.addEventListener('dblclick', onStageDblClick);

/* ===================== Barra de controles auto-ocultar ===================== */
let hideTimer = null;
function showUI() {
  stage.classList.remove('hide-ui');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (!video.paused && video.src) stage.classList.add('hide-ui');
  }, 2800);
}
stage.addEventListener('mousemove', showUI);
stage.addEventListener('mouseleave', () => {
  if (!video.paused && video.src) stage.classList.add('hide-ui');
});

/* ===================== Menús ===================== */
const dropdowns = $('dropdowns');
let openMenu = null;
function closeMenus() {
  openMenu = null;
  dropdowns.hidden = true;
  document.querySelectorAll('.dropdown.open').forEach((d) => d.classList.remove('open'));
  document.querySelectorAll('.menu-btn.active').forEach((b) => b.classList.remove('active'));
}
function openMenuFor(name, btn) {
  closeMenus();
  openMenu = name;
  dropdowns.hidden = false;
  const dd = dropdowns.querySelector(`.dropdown[data-for="${name}"]`);
  dd.classList.add('open');
  btn.classList.add('active');
  const r = btn.getBoundingClientRect();
  dd.style.left = Math.min(r.left, window.innerWidth - dd.offsetWidth - 8) + 'px';
}
document.querySelectorAll('.menu-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = btn.dataset.menu;
    if (openMenu === name) closeMenus();
    else openMenuFor(name, btn);
  });
  btn.addEventListener('mouseenter', () => { if (openMenu && openMenu !== btn.dataset.menu) openMenuFor(btn.dataset.menu, btn); });
});
dropdowns.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-act]');
  if (!li) return;
  handleAction(li.dataset.act);
  closeMenus();
});
window.addEventListener('click', () => { if (openMenu) closeMenus(); });

/* ===================== Acciones ===================== */
async function openMedia() {
  const paths = await window.nagi.openMedia();
  addPaths(paths);
}
async function openFolder() {
  const paths = await window.nagi.openFolder();
  if (paths.length) addPaths(paths);
  else toast('Carpeta sin multimedia');
}

function handleAction(act) {
  switch (act) {
    case 'open-file': openMedia(); break;
    case 'open-folder': openFolder(); break;
    case 'clear-playlist': clearPlaylist(); break;
    case 'playpause': playpause(); break;
    case 'stop': stopAll(); break;
    case 'prev': prev(); break;
    case 'next': next(true); break;
    case 'speed-up': cycleSpeed(1); break;
    case 'speed-down': cycleSpeed(-1); break;
    case 'speed-reset': resetSpeed(); break;
    case 'mute': toggleMute(); break;
    case 'vol-up': setVolume(video.volume + 0.05); break;
    case 'vol-down': setVolume(video.volume - 0.05); break;
    case 'fullscreen': toggleFullscreen(); break;
    case 'snapshot': snapshot(); break;
    case 'aspect-default': setAspect('default'); break;
    case 'aspect-contain': setAspect('contain'); break;
    case 'aspect-cover': setAspect('cover'); break;
    case 'aspect-fill': setAspect('fill'); break;
    case 'open-sub': openSubtitle(); break;
    case 'toggle-sub': toggleSub(); break;
    case 'sub-delay-minus': shiftSubDelay(-0.25); break;
    case 'sub-delay-plus': shiftSubDelay(0.25); break;
    case 'toggle-playlist': togglePlaylist(); break;
    case 'always-on-top': toggleAlwaysOnTop(); break;
    case 'shortcuts': showShortcuts(); break;
    case 'about': showAbout(); break;
  }
}

/* ===================== Playlist visible ===================== */
function applyPlaylistVisible() {
  const pl = $('playlist');
  pl.classList.toggle('collapsed', !state.playlistVisible);
  $('btnPlaylistToggle').classList.toggle('active', state.playlistVisible);
}
function togglePlaylist() {
  state.playlistVisible = !state.playlistVisible;
  applyPlaylistVisible();
  persist();
}

let aot = false;
function toggleAlwaysOnTop() {
  aot = !aot;
  window.nagi.setAlwaysOnTop(aot);
  toast(aot ? 'Siempre visible: sí' : 'Siempre visible: no');
  persist();
}

/* ===================== Modales ===================== */
function openModal(html) {
  $('modalBody').innerHTML = html;
  $('modalWrap').hidden = false;
}
function closeModal() { $('modalWrap').hidden = true; }
$('modalClose').addEventListener('click', closeModal);
$('modalWrap').addEventListener('click', (e) => { if (e.target === $('modalWrap')) closeModal(); });

function showShortcuts() {
  const rows = [
    ['Espacio', 'Reproducir / Pausa'],
    ['F / doble clic', 'Pantalla completa'],
    ['Esc', 'Salir de pantalla completa'],
    ['← / →', 'Retroceder / Avanzar 5s'],
    ['Shift + ← / →', 'Saltar 1 minuto'],
    ['↑ / ↓', 'Subir / Bajar volumen'],
    ['M', 'Silenciar'],
    ['S', 'Detener'],
    ['N / P', 'Siguiente / Anterior'],
    ['+ / -', 'Más rápido / Más lento'],
    ['Ctrl + O', 'Abrir archivo'],
    ['Ctrl + F', 'Abrir carpeta'],
    ['Ctrl + S', 'Captura de fotograma'],
    ['L', 'Repetir'],
    ['0–9', 'Saltar al 0%–90%']
  ];
  openModal(
    '<h2>Atajos de teclado</h2>' +
    '<div class="sc-grid">' +
    rows.map((r) => `<span class="sc-key">${r[0]}</span><span class="sc-desc">${r[1]}</span>`).join('') +
    '</div>'
  );
}

function showAbout() {
  openModal(
    '<img src="nagi-mark.png" class="modal-logo" alt="NAGI" />' +
    '<h2>NAGI<b>PLAY</b></h2>' +
    '<p>Reproductor de video de <b>NAGI STUDIOS</b>. Inspirado en VLC: lista de reproducción, ' +
    'subtítulos (.srt/.vtt), velocidad variable, capturas, relación de aspecto y atajos completos.</p>' +
    '<p style="color:var(--muted)">Formatos: depende del códec del sistema (MP4/H.264, WebM, MKV/H.264, MOV…). ' +
    'Los contenedores antiguos (AVI/WMV) pueden no reproducirse.</p>' +
    '<p style="margin-top:16px;display:flex;align-items:center;gap:8px;opacity:.8">' +
    '<img src="nagi-mark.png" style="width:16px;height:16px"/> © 2026 NAGI STUDIOS</p>'
  );
}

/* ===================== Modo Short (recortar a MP4 con ffmpeg) ===================== */
const shortState = { in: 0, out: 0, fmt: 'original', frame: 'crop', exporting: false };

function openShort() {
  if (!video.src || !isFinite(video.duration) || video.duration <= 0) {
    toast('Carga un vídeo primero'); return;
  }
  shortState.in = 0;
  shortState.out = video.duration;
  shortState.fmt = 'original';
  shortState.frame = 'crop';
  document.querySelectorAll('#fmtChips .chip').forEach((c) => c.classList.toggle('active', c.dataset.fmt === 'original'));
  document.querySelectorAll('#frameChips .chip').forEach((c) => c.classList.toggle('active', c.dataset.frame === 'crop'));
  $('frameRow').hidden = true;
  $('shortProg').hidden = true;
  renderTrim();
  $('shortSheet').hidden = false;
}
function closeShort() {
  if (shortState.exporting) { window.nagi.cancelExport(); shortState.exporting = false; }
  $('shortSheet').hidden = true;
}

function trimPct(t) { return video.duration ? (t / video.duration * 100) : 0; }
function renderTrim() {
  const i = trimPct(shortState.in), o = trimPct(shortState.out);
  $('trimIn').style.left = i + '%';
  $('trimOut').style.left = o + '%';
  $('trimSel').style.left = i + '%';
  $('trimSel').style.width = (o - i) + '%';
  $('trimDimL').style.width = i + '%';
  $('trimDimR').style.width = (100 - o) + '%';
  $('trimInfo').textContent = fmtTime(shortState.in) + ' – ' + fmtTime(shortState.out) +
    ' · ' + fmtTime(Math.max(0, shortState.out - shortState.in));
}

function trimXToTime(clientX) {
  const r = $('trimTrack').getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  return ratio * (video.duration || 0);
}
let dragHandle = null;
$('trimIn').addEventListener('mousedown', (e) => { e.stopPropagation(); dragHandle = 'in'; });
$('trimOut').addEventListener('mousedown', (e) => { e.stopPropagation(); dragHandle = 'out'; });
$('trimTrack').addEventListener('mousedown', (e) => {
  if (dragHandle) return;
  const t = trimXToTime(e.clientX);
  // mover el extremo más cercano
  if (Math.abs(t - shortState.in) <= Math.abs(t - shortState.out)) { dragHandle = 'in'; }
  else { dragHandle = 'out'; }
  applyTrimDrag(e.clientX);
});
function applyTrimDrag(clientX) {
  let t = trimXToTime(clientX);
  if (dragHandle === 'in') {
    shortState.in = Math.max(0, Math.min(t, shortState.out - 0.1));
    video.currentTime = shortState.in;
  } else {
    shortState.out = Math.min(video.duration, Math.max(t, shortState.in + 0.1));
    video.currentTime = shortState.out;
  }
  renderTrim();
}
window.addEventListener('mousemove', (e) => { if (dragHandle) applyTrimDrag(e.clientX); });
window.addEventListener('mouseup', () => { dragHandle = null; });

$('setIn').addEventListener('click', () => {
  shortState.in = Math.min(video.currentTime, shortState.out - 0.1);
  if (shortState.in < 0) shortState.in = 0;
  renderTrim();
});
$('setOut').addEventListener('click', () => {
  shortState.out = Math.max(video.currentTime, shortState.in + 0.1);
  if (shortState.out > video.duration) shortState.out = video.duration;
  renderTrim();
});

$('fmtChips').addEventListener('click', (e) => {
  const c = e.target.closest('.chip'); if (!c) return;
  shortState.fmt = c.dataset.fmt;
  document.querySelectorAll('#fmtChips .chip').forEach((x) => x.classList.toggle('active', x === c));
  $('frameRow').hidden = shortState.fmt === 'original';
});
$('frameChips').addEventListener('click', (e) => {
  const c = e.target.closest('.chip'); if (!c) return;
  shortState.frame = c.dataset.frame;
  document.querySelectorAll('#frameChips .chip').forEach((x) => x.classList.toggle('active', x === c));
});

function buildShortArgs(inputPath, outPath) {
  const inSec = shortState.in;
  const dur = Math.max(0.1, shortState.out - shortState.in);
  const args = ['-y', '-ss', inSec.toFixed(3), '-i', inputPath, '-t', dur.toFixed(3)];
  const { fmt, frame } = shortState;

  let vf = null, fc = null;
  if (fmt !== 'original') {
    const W = 1080;
    const H = fmt === 'vertical' ? 1920 : 1080;
    if (frame === 'crop') {
      const cropExpr = fmt === 'vertical'
        ? "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)'"
        : "crop='min(iw,ih)':'min(iw,ih)'";
      vf = `${cropExpr},scale=${W}:${H}:flags=lanczos,setsar=1`;
    } else {
      fc = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=20:4[bg];` +
           `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease[fg];` +
           `[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]`;
    }
  }
  if (fc) { args.push('-filter_complex', fc, '-map', '[v]', '-map', '0:a?'); }
  else if (vf) { args.push('-vf', vf); }

  args.push(
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', outPath
  );
  return { args, dur };
}

async function exportShort() {
  if (shortState.exporting) return;
  const item = state.playlist[state.current];
  if (!item) { toast('No hay vídeo'); return; }
  if (shortState.out - shortState.in < 0.2) { toast('La selección es muy corta'); return; }

  const base = item.name.replace(/\.[^.]+$/, '');
  const suffix = '-recorte' + (shortState.fmt === 'vertical' ? '-9x16'
    : shortState.fmt === 'square' ? '-1x1' : '');
  const outPath = await window.nagi.pickSave({
    title: 'Guardar recorte',
    defaultPath: base + suffix + '.mp4',
    filters: [{ name: 'Vídeo MP4', extensions: ['mp4'] }]
  });
  if (!outPath) return;

  const { args, dur } = buildShortArgs(item.path, outPath);
  shortState.exporting = true;
  video.pause();
  $('shortProg').hidden = false;
  $('shortExport').disabled = true;
  $('shortBar').style.width = '0%';
  $('shortPct').textContent = '0%';

  const res = await window.nagi.ffmpegExport({ args, durationSec: dur });

  shortState.exporting = false;
  $('shortExport').disabled = false;
  $('shortProg').hidden = true;
  if (res && res.ok) {
    toast('Recorte guardado ✓');
    window.nagi.revealFile(outPath);
    $('shortSheet').hidden = true;
  } else if (res && res.error === 'cancelado') {
    toast('Exportación cancelada');
  } else {
    toast('Error al exportar el recorte');
    console.error('ffmpeg error:', res);
  }
}

$('btnShort').addEventListener('click', openShort);
$('shortClose').addEventListener('click', closeShort);
$('shortExport').addEventListener('click', exportShort);
$('shortCancel').addEventListener('click', () => window.nagi.cancelExport());
window.nagi.onExportProgress((v) => {
  $('shortBar').style.width = Math.round(v * 100) + '%';
  $('shortPct').textContent = Math.round(v * 100) + '%';
});

/* ===================== Botones de controles ===================== */
$('btnPlay').addEventListener('click', (e) => { e.stopPropagation(); playpause(); });
$('btnStop').addEventListener('click', stopAll);
$('btnPrev').addEventListener('click', prev);
$('btnNext').addEventListener('click', () => next(true));
$('btnMute').addEventListener('click', toggleMute);
$('btnSpeed').addEventListener('click', () => cycleSpeed(1));
$('btnSpeed').addEventListener('contextmenu', (e) => { e.preventDefault(); cycleSpeed(-1); });
$('btnLoop').addEventListener('click', toggleLoop);
$('btnSub').addEventListener('click', toggleSub);
$('btnSnap').addEventListener('click', snapshot);
$('btnFs').addEventListener('click', toggleFullscreen);
$('btnPlaylistToggle').addEventListener('click', togglePlaylist);
$('btnShuffle').addEventListener('click', toggleShuffle);
$('btnPlAdd').addEventListener('click', openMedia);
$('btnPlClear').addEventListener('click', clearPlaylist);

$('welcomeOpen').addEventListener('click', openMedia);
$('welcomeFolder').addEventListener('click', openFolder);

/* ===================== Carpeta favorita (botón ⭐) ===================== */
function folderName(p) { return p ? p.split(/[\\/]/).filter(Boolean).pop() : ''; }
function applyFavVisual() {
  const btn = $('btnFav');
  const set = !!state.favoriteFolder;
  btn.classList.toggle('set', set);
  btn.title = set
    ? 'Abrir: ' + state.favoriteFolder + '  (clic derecho para cambiar)'
    : 'Carpeta favorita — clic derecho para elegirla';
}
async function setFavorite() {
  const dir = await window.nagi.pickFolder();
  if (!dir) return;
  state.favoriteFolder = dir;
  applyFavVisual();
  persist();
  toast('⭐ Carpeta favorita: ' + folderName(dir));
}
async function openFavorite() {
  if (!state.favoriteFolder) { setFavorite(); return; }
  const files = await window.nagi.listFolderMedia(state.favoriteFolder);
  if (files === null) { toast('La carpeta favorita ya no existe'); return; }
  if (!files.length) { toast('La carpeta favorita no tiene multimedia'); return; }
  // Cargar el contenido de la carpeta favorita (reemplaza la lista actual).
  state.playlist = [];
  state.current = -1;
  addPaths(files);
  toast('⭐ ' + folderName(state.favoriteFolder) + ' (' + files.length + ')');
}
$('btnFav').addEventListener('click', openFavorite);
$('btnFav').addEventListener('contextmenu', (e) => { e.preventDefault(); setFavorite(); });

/* Window controls */
$('btnMin').addEventListener('click', () => {
  // Si hay algo cargado, acoplar al mini-reproductor; si no, minimizar normal.
  if (state.current >= 0 && video.src) enterMini();
  else window.nagi.minimize();
});
$('btnMax').addEventListener('click', () => window.nagi.maximize());
$('btnClose').addEventListener('click', () => window.nagi.close());

/* ===================== Drag & drop ===================== */
const dropOverlay = $('dropOverlay');
let dragDepth = 0;
window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; dropOverlay.classList.add('show'); });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('dragleave', (e) => { e.preventDefault(); if (--dragDepth <= 0) { dragDepth = 0; dropOverlay.classList.remove('show'); } });
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  dropOverlay.classList.remove('show');
  const paths = [...e.dataTransfer.files].map((f) => f.path).filter(Boolean);
  if (paths.length) addPaths(paths);
});

/* ===================== Atajos de teclado ===================== */
window.addEventListener('keydown', (e) => {
  if (!$('modalWrap').hidden && e.key === 'Escape') { closeModal(); return; }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const k = e.key;
  if (e.ctrlKey) {
    if (k === 'o' || k === 'O') { e.preventDefault(); openMedia(); }
    else if (k === 'f' || k === 'F') { e.preventDefault(); openFolder(); }
    else if (k === 's' || k === 'S') { e.preventDefault(); snapshot(); }
    return;
  }

  switch (k) {
    case ' ': e.preventDefault(); playpause(); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'Escape': window.nagi.setFullscreen(false); break;
    case 'ArrowRight': e.preventDefault(); seekBy(e.shiftKey ? 60 : 5); break;
    case 'ArrowLeft': e.preventDefault(); seekBy(e.shiftKey ? -60 : -5); break;
    case 'ArrowUp': e.preventDefault(); setVolume(video.volume + 0.05); break;
    case 'ArrowDown': e.preventDefault(); setVolume(video.volume - 0.05); break;
    case 'm': case 'M': toggleMute(); break;
    case 's': case 'S': stopAll(); break;
    case 'n': case 'N': next(true); break;
    case 'p': case 'P': prev(); break;
    case 'l': case 'L': toggleLoop(); break;
    case '+': case '=': cycleSpeed(1); break;
    case '-': case '_': cycleSpeed(-1); break;
    default:
      if (/^[0-9]$/.test(k) && isFinite(video.duration)) {
        video.currentTime = (parseInt(k, 10) / 10) * video.duration;
      }
  }
  showUI();
});

/* ===================== Ajustes persistentes ===================== */
let persistReady = false;
function persist() {
  if (!persistReady) return; // no guardar durante la carga inicial
  clearTimeout(persist._t);
  persist._t = setTimeout(() => {
    window.nagi.saveSettings({
      volume: state.lastVolume,
      muted: video.muted,
      loop: state.loop,
      shuffle: state.shuffle,
      speed: state.speed,
      aspect: state.aspect,
      playlistVisible: state.playlistVisible,
      alwaysOnTop: aot,
      favoriteFolder: state.favoriteFolder
    });
  }, 250);
}

async function loadSettings() {
  let s = {};
  try { s = (await window.nagi.loadSettings()) || {}; } catch { s = {}; }

  state.speed = SPEEDS.includes(s.speed) ? s.speed : 1;
  state.loop = ['off', 'one', 'all'].includes(s.loop) ? s.loop : 'off';
  state.shuffle = !!s.shuffle;
  state.aspect = ['default', 'contain', 'cover', 'fill'].includes(s.aspect) ? s.aspect : 'default';
  state.playlistVisible = s.playlistVisible !== false;
  state.favoriteFolder = (typeof s.favoriteFolder === 'string') ? s.favoriteFolder : null;
  state.lastVolume = (typeof s.volume === 'number') ? Math.max(0, Math.min(1, s.volume)) : 0.8;

  setVolume(state.lastVolume, false);
  if (s.muted) { video.muted = true; $('btnMute').textContent = '🔇'; }
  applyLoopVisual();
  $('btnShuffle').classList.toggle('active', state.shuffle);
  setAspect(state.aspect, false);
  applySpeed(false);
  applyPlaylistVisible();
  applyFavVisual();
  if (s.alwaysOnTop) { aot = true; window.nagi.setAlwaysOnTop(true); }

  persistReady = true;
}

/* ===================== Mini-reproductor ===================== */
let miniActive = false;

function captureArt() {
  try {
    if (video.videoWidth) {
      const s = 144;
      const c = document.createElement('canvas');
      c.width = s; c.height = s;
      const ctx = c.getContext('2d');
      const vw = video.videoWidth, vh = video.videoHeight;
      const scale = Math.max(s / vw, s / vh); // recorte "cover"
      const dw = vw * scale, dh = vh * scale;
      ctx.drawImage(video, (s - dw) / 2, (s - dh) / 2, dw, dh);
      return c.toDataURL('image/jpeg', 0.82);
    }
  } catch { /* */ }
  return null; // audio → el mini muestra el logo
}

function sendMiniMeta() {
  if (!miniActive) return;
  const item = state.playlist[state.current];
  window.nagi.playerState({
    type: 'meta',
    title: item ? item.name.replace(/\.[^.]+$/, '') : 'NAGIPLAY',
    sub: 'NAGIPLAY',
    art: captureArt()
  });
}
function sendMiniTick() {
  if (!miniActive) return;
  window.nagi.playerState({
    type: 'tick',
    playing: !video.paused && !!video.src,
    time: video.currentTime || 0,
    duration: isFinite(video.duration) ? video.duration : 0,
    volume: video.volume,
    muted: video.muted,
    loop: state.loop
  });
}

function enterMini() {
  miniActive = true;
  window.nagi.enterMini();
  sendMiniMeta();
  sendMiniTick();
}

window.nagi.onMiniCommand((msg) => {
  switch (msg.action) {
    case 'sync': sendMiniMeta(); break;
    case 'playpause': playpause(); break;
    case 'next': next(true); break;
    case 'prev': prev(); break;
    case 'mute': toggleMute(); break;
    case 'loop': toggleLoop(); break;
    case 'seek': if (isFinite(video.duration)) video.currentTime = msg.value * video.duration; break;
  }
  sendMiniTick();
});
window.nagi.onMiniExited(() => { miniActive = false; });

/* ===================== IPC desde main ===================== */
window.nagi.onOpenFiles((files) => addPaths(files));
window.nagi.onWindowState((st) => {
  // Pantalla completa inmersiva: ocultar barra de título y lista.
  document.body.classList.toggle('fs', !!st.fullscreen);
  if (st.fullscreen) showUI();
});

/* ===================== Init ===================== */
applyIcons();
updatePlayBtn();
loadSettings();

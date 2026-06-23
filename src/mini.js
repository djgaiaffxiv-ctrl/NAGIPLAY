'use strict';

const $ = (id) => document.getElementById(id);

/* Iconos (mismo estilo de línea que el reproductor principal) */
const L = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const Fa = 'fill="currentColor"';
const w = (inner, a) => `<svg class="ic" viewBox="0 0 24 24" ${a || ''}>${inner}</svg>`;
const IC = {
  play: w('<path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11.18-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14Z"/>', Fa),
  pause: w('<rect x="6.5" y="5" width="3.6" height="14" rx="1.4"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.4"/>', Fa),
  prev: w('<rect x="5.5" y="5.5" width="2.8" height="13" rx="1.4"/><path d="M19 6.3v11.4a1 1 0 0 1-1.54.84l-8.7-5.7a1 1 0 0 1 0-1.68l8.7-5.7A1 1 0 0 1 19 6.3Z"/>', Fa),
  next: w('<path d="M5 6.3v11.4a1 1 0 0 0 1.54.84l8.7-5.7a1 1 0 0 0 0-1.68l-8.7-5.7A1 1 0 0 0 5 6.3Z"/><rect x="15.7" y="5.5" width="2.8" height="13" rx="1.4"/>', Fa),
  volHigh: w('<path d="M4 9.5v5a1 1 0 0 0 1 1h2.6l4.1 3.3a1 1 0 0 0 1.63-.78V5.98a1 1 0 0 0-1.63-.78L7.6 8.5H5a1 1 0 0 0-1 1Z" fill="currentColor"/><path d="M16.4 8.9a4.5 4.5 0 0 1 0 6.2M18.9 6.6a8 8 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  volMute: w('<path d="M4 9.5v5a1 1 0 0 0 1 1h2.6l4.1 3.3a1 1 0 0 0 1.63-.78V5.98a1 1 0 0 0-1.63-.78L7.6 8.5H5a1 1 0 0 0-1 1Z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  expand: w('<path d="M4 9V5.6A1.6 1.6 0 0 1 5.6 4H9"/><path d="M15 4h3.4A1.6 1.6 0 0 1 20 5.6V9"/><path d="M20 15v3.4a1.6 1.6 0 0 1-1.6 1.6H15"/><path d="M9 20H5.6A1.6 1.6 0 0 1 4 18.4V15"/>', L),
  loop: w('<path d="M17 4l3 3-3 3"/><path d="M20 7H9a5 5 0 0 0-5 5"/><path d="M7 20l-3-3 3-3"/><path d="M4 17h11a5 5 0 0 0 5-5"/>', L),
  loopOne: w('<path d="M17 4l3 3-3 3"/><path d="M20 7H9a5 5 0 0 0-5 5"/><path d="M7 20l-3-3 3-3"/><path d="M4 17h11a5 5 0 0 0 5-5"/><text x="12" y="15" font-size="8" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none">1</text>', L)
};

$('mPrev').innerHTML = IC.prev;
$('mNext').innerHTML = IC.next;
$('mPlay').innerHTML = IC.play;
$('mMute').innerHTML = IC.volHigh;
$('mExpand').innerHTML = IC.expand;
$('mLoop').innerHTML = IC.loop;

// Al cargar, pedir al reproductor principal el estado actual (metadatos + tiempo).
window.nagi.miniCommand({ action: 'sync' });

let dur = 0, muted = false;

function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0;
  s = Math.floor(s);
  const m = Math.floor(s / 60), sec = s % 60;
  return m + ':' + String(sec).padStart(2, '0');
}

/* Comandos hacia el reproductor principal */
$('mPlay').addEventListener('click', () => window.nagi.miniCommand({ action: 'playpause' }));
$('mPrev').addEventListener('click', () => window.nagi.miniCommand({ action: 'prev' }));
$('mNext').addEventListener('click', () => window.nagi.miniCommand({ action: 'next' }));
$('mMute').addEventListener('click', () => window.nagi.miniCommand({ action: 'mute' }));
$('mLoop').addEventListener('click', () => window.nagi.miniCommand({ action: 'loop' }));
$('mExpand').addEventListener('click', () => window.nagi.exitMini());
$('art').addEventListener('click', () => window.nagi.exitMini());

const track = $('mTrack');
function seekFrom(e) {
  const r = track.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  window.nagi.miniCommand({ action: 'seek', value: ratio });
}
let seeking = false;
track.addEventListener('mousedown', (e) => { seeking = true; seekFrom(e); });
window.addEventListener('mousemove', (e) => { if (seeking) seekFrom(e); });
window.addEventListener('mouseup', () => { seeking = false; });

/* Estado recibido del reproductor principal */
window.nagi.onPlayerState((st) => {
  if (st.type === 'meta') {
    $('mTitle').textContent = st.title || 'NAGIPLAY';
    $('mSub').textContent = st.sub || 'NAGIPLAY';
    const img = $('artImg');
    if (st.art) { img.src = st.art; img.classList.remove('is-logo'); }
    else { img.src = 'nagi-mark.png'; img.classList.add('is-logo'); }
  } else if (st.type === 'tick') {
    dur = st.duration || 0;
    $('mPlay').innerHTML = st.playing ? IC.pause : IC.play;
    const ratio = dur > 0 ? (st.time / dur) : 0;
    $('mFill').style.width = (ratio * 100) + '%';
    $('mKnob').style.left = (ratio * 100) + '%';
    $('mCur').textContent = fmt(st.time);
    $('mRem').textContent = '-' + fmt(Math.max(0, dur - st.time));
    muted = st.muted || st.volume === 0;
    $('mMute').innerHTML = muted ? IC.volMute : IC.volHigh;
    const loop = st.loop || 'off';
    const mLoop = $('mLoop');
    mLoop.innerHTML = loop === 'one' ? IC.loopOne : IC.loop;
    mLoop.classList.toggle('on', loop !== 'off');
    mLoop.title = loop === 'off' ? 'Repetir: no' : loop === 'one' ? 'Repetir: una' : 'Repetir: todo';
  }
});

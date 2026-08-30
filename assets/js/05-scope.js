/* Background oscilloscope — draws behind the hero only. */
'use strict';

const scopeLayer = $('scopeLayer');
const scopeCanvas = $('scope');
const sctx = scopeCanvas.getContext('2d');

/* wave  : which shape is drawn
   freq  : cycles across the screen
   amp   : trace height
   warp  : morphs the shape — softens or squares off the edges,
           and sets the duty cycle on pulse
   glow  : phosphor intensity
   dual  : optional second offset trace. Off by default, so the
           scope shows a single waveform until you turn it on. */
const scope = { wave:'sine', freq:1.6, amp:0.34, warp:0, glow:0.5, dual:false, phase:0 };

let scopeW = 0, scopeH = 0;

function sizeScope(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  scopeW = window.innerWidth;
  scopeH = window.innerHeight;
  scopeCanvas.width  = Math.floor(scopeW * dpr);
  scopeCanvas.height = Math.floor(scopeH * dpr);
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeScope();

/* deterministic 1D value noise, so the trace is stable frame to frame */
function hash1(n){
  const s = Math.sin(n * 127.1) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

/* rough ECG: P wave, QRS complex, T wave */
function ecgAt(x){
  const g = (c, w, a) => a * Math.exp(-((x - c)/w) * ((x - c)/w));
  return g(0.16, 0.030, 0.16)
       - g(0.30, 0.013, 0.22)
       + g(0.35, 0.015, 1.00)
       - g(0.40, 0.017, 0.30)
       + g(0.62, 0.055, 0.28);
}

function waveValue(type, p, warp){
  if(type === 'noise'){
    const s = p * 22, i = Math.floor(s), f = s - i;
    return lerp(hash1(i), hash1(i + 1), f*f*(3 - 2*f)) * (0.55 + warp*0.45);
  }
  const x = ((p % 1) + 1) % 1;
  let v;
  switch(type){
    case 'square':   v = x < 0.5 ? 1 : -1; break;
    case 'triangle': v = x < 0.5 ? 4*x - 1 : 3 - 4*x; break;
    case 'saw':      v = 2*x - 1; break;
    case 'pulse':    v = x < (0.10 + warp*0.30) ? 1 : -1; break;
    case 'bounce':   v = Math.abs(Math.sin(x * Math.PI * 2)) * 2 - 1; break;
    case 'ecg':      v = ecgAt(x); break;
    default:         v = Math.sin(x * Math.PI * 2);
  }
  /* warp drives the shape toward a hard edge. Skipped where it already
     means something else (pulse duty) or would wreck the shape (ecg). */
  if(warp > 0.001 && type !== 'pulse' && type !== 'ecg'){
    v = Math.sign(v) * Math.pow(Math.abs(v), 1 - warp*0.72);
  }
  return v;
}

function drawScope(){
  const W = scopeW, H = scopeH, midY = H * 0.5;
  sctx.clearRect(0, 0, W, H);
  const { wave, freq, amp, warp, glow, phase, dual } = scope;
  const g = 0.35 + glow * 1.3;

  function trace(ampMul, phaseOff, alpha, widthMul){
    const pts = [];
    const step = wave === 'noise' ? 1 : Math.max(2, Math.floor(W / 520));
    for(let px = 0; px <= W; px += step){
      const p = (px / W) * freq * 2.2 + phase + phaseOff;
      pts.push([px, midY - waveValue(wave, p, warp) * (H * 0.24) * amp * ampMul]);
    }
    const path = () => {
      sctx.beginPath();
      for(let i = 0; i < pts.length; i++){
        i ? sctx.lineTo(pts[i][0], pts[i][1]) : sctx.moveTo(pts[i][0], pts[i][1]);
      }
      sctx.stroke();
    };
    sctx.lineJoin = 'round'; sctx.lineCap = 'round';
    sctx.strokeStyle = '#5FE3A0'; sctx.shadowColor = '#5FE3A0';
    sctx.globalAlpha = alpha*0.16*g; sctx.lineWidth = 14*widthMul; sctx.shadowBlur = 26*g; path();
    sctx.globalAlpha = alpha*0.40*g; sctx.lineWidth = 5*widthMul;  sctx.shadowBlur = 16*g; path();
    sctx.globalAlpha = Math.min(alpha*0.85*(0.7 + glow*0.6), 1);
    sctx.strokeStyle = '#D8FFE8';
    sctx.lineWidth = 1.5*widthMul; sctx.shadowBlur = 10*g; path();
    sctx.globalAlpha = 1; sctx.shadowBlur = 0;
  }

  if(dual) trace(0.55, 0.3, 0.4, 0.8);
  trace(1, 0, 1, 1);
}

/* ---------- knobs ---------- */
function makeKnob(el, { value = 0.5, onChange } = {}){
  let v = value;
  const ind = el.querySelector('.ind');
  const render = () => { ind.style.transform = `translateX(-50%) rotate(${lerp(-140,140,v)}deg)`; };
  const set = nv => { v = clamp(nv, 0, 1); render(); if(onChange) onChange(v); };
  set(v);
  let dragging = false, sy = 0, sx = 0, sv = 0;
  el.addEventListener('pointerdown', e => {
    dragging = true; sy = e.clientY; sx = e.clientX; sv = v;
    el.setPointerCapture(e.pointerId); e.preventDefault();
  });
  el.addEventListener('pointermove', e => {
    if(!dragging) return;
    set(sv + ((sy - e.clientY) + (e.clientX - sx)) * 0.007);
  });
  const stop = e => { dragging = false; try{ el.releasePointerCapture(e.pointerId); }catch(_){} };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
  el.addEventListener('wheel', e => { e.preventDefault(); set(v - Math.sign(e.deltaY)*0.05); }, { passive:false });
  el.addEventListener('keydown', e => {
    if(e.key === 'ArrowUp' || e.key === 'ArrowRight'){ set(v + 0.05); e.preventDefault(); }
    if(e.key === 'ArrowDown' || e.key === 'ArrowLeft'){ set(v - 0.05); e.preventDefault(); }
  });
}

makeKnob($('miniFreq'), { value:0.22, onChange:v => scope.freq = 0.5 + v*7 });
makeKnob($('miniAmp'),  { value:0.34, onChange:v => scope.amp  = 0.08 + v*0.75 });
makeKnob($('miniWarp'), { value:0.00, onChange:v => scope.warp = v });
makeKnob($('miniGlow'), { value:0.50, onChange:v => scope.glow = v });

/* ---------- shape selector ---------- */
$('scChips').addEventListener('click', e => {
  const b = e.target.closest('.sc-chip'); if(!b) return;
  Array.prototype.forEach.call($('scChips').children, x => {
    x.classList.remove('on');
    x.setAttribute('aria-pressed', 'false');
  });
  b.classList.add('on');
  b.setAttribute('aria-pressed', 'true');
  scope.wave = b.dataset.wave;
});

/* ---------- second trace toggle ---------- */
$('scDual').addEventListener('click', () => {
  scope.dual = !scope.dual;
  $('scDual').classList.toggle('on', scope.dual);
  $('scDual').setAttribute('aria-pressed', String(scope.dual));
});

/* ---------- minimize / restore ----------
   The pill always starts collapsed, on every screen size — it's a toy, not
   a control anyone needs on arrival, and at full width it covered a good
   chunk of the hero. It opens on click and stays open until it's closed
   again or you scroll away from the hero.

   The dot is part of .scope-ctl, which means 09-main.js still shows and
   hides the whole thing with the hero — it never trails down the page. */
const scopeCtlEl = $('scopeCtl');
const scMinBtn   = $('scMin');

let scopeMinimized = true;

function applyScopeMin(){
  scopeCtlEl.classList.toggle('is-min', scopeMinimized);
  scMinBtn.setAttribute('aria-expanded', String(!scopeMinimized));
  const label = scopeMinimized ? 'Show oscilloscope controls' : 'Hide oscilloscope controls';
  scMinBtn.setAttribute('aria-label', label);
  scMinBtn.title = label;
}
applyScopeMin();

scMinBtn.addEventListener('click', () => {
  scopeMinimized = !scopeMinimized;
  applyScopeMin();
});

/* Scrolling out of the hero puts it away again, so coming back to the top
   doesn't leave a panel open that you opened minutes ago and forgot. */
window.addEventListener('scroll', () => {
  if(scopeMinimized) return;
  if(!scopeCtlEl.classList.contains('show')){
    scopeMinimized = true;
    applyScopeMin();
  }
}, { passive:true });
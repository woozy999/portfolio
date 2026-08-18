/* Main animation loop. */
'use strict';

/* ================================================================
   MAIN LOOP
   ================================================================ */
const heroEl = document.querySelector('.hero');
const heroDisc = $('heroDisc'), heroSleeve = $('heroSleeve'), rigTilt = $('rigTilt');
const hint = $('unsleeveHint'), railHead = $('railHead'), navDisc = $('navDisc');
const scopeCtl = $('scopeCtl');
const woofers = Array.prototype.slice.call(document.querySelectorAll('.woof'));

let spin = 0, lastY = window.scrollY, vel = 0;
let mx = 0, my = 0, tmx = 0, tmy = 0;
let t0 = performance.now();
let ctlShown = false;

if(!reduceMotion){
  heroEl.addEventListener('mousemove', e => {
    const r = heroEl.getBoundingClientRect();
    tmx = ((e.clientX - r.left)/r.width  - 0.5) * 2;
    tmy = ((e.clientY - r.top) /r.height - 0.5) * 2;
  });
  heroEl.addEventListener('mouseleave', () => { tmx = 0; tmy = 0; });
}

function frame(now){
  const y = window.scrollY;
  const vh = window.innerHeight;
  const docH = document.documentElement.scrollHeight - vh;
  const dt = Math.min((now - t0)/1000, 0.05);
  t0 = now;
  const time = now/1000;

  const raw = y - lastY;
  lastY = y;
  vel = lerp(vel, raw, 0.12);
  spin += 0.3 + vel * 0.85;
  navDisc.style.transform = 'rotate(' + spin + 'deg)';

  /* ---- scope: hero only, fades out as you scroll away ---- */
  const heroRect = heroEl.getBoundingClientRect();
  const fadeSpan = Math.max(heroRect.height * 0.7, 1);
  const vis = clamp(heroRect.bottom / fadeSpan, 0, 1);
  scopeLayer.style.opacity = (vis * 0.55).toFixed(3);
  if(vis > 0.02){
    scope.phase += dt * scope.freq * 0.22;
    drawScope();
  }
  const wantCtl = vis > 0.35;
  if(wantCtl !== ctlShown){
    ctlShown = wantCtl;
    scopeCtl.classList.toggle('show', wantCtl);
  }

  /* ---- unsleeve ---- */
  const t = clamp(y / (vh * 0.38), 0, 1);
  const e = t*t*(3 - 2*t);
  heroDisc.style.transform   = 'translateX(' + (26 + e*118) + 'px) rotate(' + (spin*0.55) + 'deg)';
  heroSleeve.style.transform = 'translateX(' + (-e*30) + 'px) rotate(' + (-e*2.2) + 'deg)';
  hint.style.opacity = String(clamp(1 - t*2.2, 0, 1));

  mx = lerp(mx, tmx, 0.07);
  my = lerp(my, tmy, 0.07);
  rigTilt.style.transform = 'rotateY(' + (mx*7) + 'deg) rotateX(' + (-my*5) + 'deg) translateX(' + (mx*8) + 'px)';

  railHead.style.top = (docH > 0 ? clamp(y/docH, 0, 1) : 0) * 100 + '%';

  /* ---- woofers ---- */
  const pump = 1 + Math.sin(time * 2.4) * 0.012 + clamp(Math.abs(vel)/60, 0, 1) * 0.05;
  for(let i = 0; i < woofers.length; i++){
    woofers[i].style.transform = 'scale(' + (pump - i*0.004) + ')';
  }

  /* ---- sticky turntable ---- */
  if(!isMobileTT()){
    const r = ttScroll.getBoundingClientRect();
    const total = r.height - vh;
    if(total > 0){
      const p = clamp(-r.top/total, 0, 1);
      const inView = r.top < vh && r.bottom > 0;
      platterDisc.style.transform = 'rotate(' + (spin * (inView ? 1 : 0.35)) + 'deg)';
      platterArm.style.transform  = 'rotate(' + lerp(-30, -4, p) + 'deg)';
      setTrack(Math.floor(p * ttItems.length));
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

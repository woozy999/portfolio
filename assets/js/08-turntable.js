/* Sticky turntable / toolkit section. */
'use strict';

/* ================================================================
   TURNTABLE
   ================================================================ */
const ttScroll = $('ttScroll'), platterDisc = $('platterDisc'), platterArm = $('platterArm');
const ttSection = document.querySelector('.turntable-section');
const ttItems = Array.prototype.slice.call(document.querySelectorAll('.tt-item'));
let activeTT = -1;

function isMobileTT(){ return window.innerWidth <= 900 || reduceMotion; }

function setTrack(idx){
  idx = clamp(idx, 0, ttItems.length - 1);
  if(idx === activeTT) return;
  activeTT = idx;
  ttItems.forEach((el, i) => {
    const on = i === idx;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-pressed', String(on));
  });
  ttSection.style.setProperty('--tt-accent', ttItems[idx].dataset.accent);
  $('plNum').textContent = '0' + (idx + 1);
  $('plTxt').textContent = ttItems[idx].querySelector('h4').textContent;
  $('platterRpm').textContent = 'Track ' + (idx + 1) + ' of ' + ttItems.length;
  if(isMobileTT()){
    platterArm.classList.remove('no-tween');
    platterArm.style.setProperty('--arm-rot',
      lerp(-28, -6, idx/(ttItems.length - 1)).toFixed(2) + 'deg');
  }
}

ttItems.forEach((el, i) => {
  el.type = 'button';
  el.addEventListener('click', () => {
    if(isMobileTT()){ setTrack(i); return; }
    const r = ttScroll.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    if(total <= 0){ setTrack(i); return; }
    window.scrollTo({ top: window.scrollY + r.top + total * ((i + 0.5)/ttItems.length), behavior:'smooth' });
  });
});

function sizeTT(){
  if(!isMobileTT()){
    ttScroll.style.height = (window.innerHeight * 3.2) + 'px';
    platterArm.classList.add('no-tween');
  } else {
    ttScroll.style.height = 'auto';
    platterArm.classList.remove('no-tween');
  }
}
sizeTT();
setTrack(0);

/* ---------- deck parallax ----------
   A few degrees of lean toward the pointer. It's what makes the platter
   read as a physical object rather than a picture of one — the arm sits
   24px above the record in Z, so the two visibly shift against each other.
   Pointer only: on touch there's no hover to track, and the CSS tilt
   already stands the deck up on its own. */
const deckScene = $('deckScene'), deckTilt = $('deckTilt');
if(deckScene && deckTilt && !reduceMotion && window.matchMedia('(hover:hover)').matches){
  let deckRaf = null;
  const setDeck = (mx, my) => {
    deckTilt.style.setProperty('--deck-mx', mx.toFixed(3));
    deckTilt.style.setProperty('--deck-my', my.toFixed(3));
  };

  deckScene.addEventListener('pointermove', e => {
    if(deckRaf) return;
    deckRaf = requestAnimationFrame(() => {
      deckRaf = null;
      const r = deckScene.getBoundingClientRect();
      if(!r.width || !r.height) return;
      setDeck(
        clamp(((e.clientX - r.left) / r.width  - 0.5) * 2, -1, 1),
        clamp(((e.clientY - r.top)  / r.height - 0.5) * 2, -1, 1)
      );
    });
  });

  deckScene.addEventListener('pointerleave', () => {
    if(deckRaf){ cancelAnimationFrame(deckRaf); deckRaf = null; }
    setDeck(0, 0);
  });
}

/* single debounced resize handler for everything */
let resizeTimer = null;
window.addEventListener('resize', () => {
  sizeScope();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(sizeTT, 120);
});
/* Tracklist grid, player modal, full project view, scroll reveals. */
'use strict';

/* ================================================================
   TRACKLIST + MODALS
   ================================================================ */
const grid = $('trackGrid'), overlay = $('overlay');
const playerCard = $('playerCard'), fullOverlay = $('fullOverlay');
let current = null, loadTimer = null, lastFocus = null;

$('loadedCount').textContent = projects.filter(p => p.active).length + ' of ' + projects.length + ' loaded';

/* ================================================================
   THE RECEIVER FACE

   The 16 slots are the illuminated input selectors. Loaded projects
   light their lamp; empty ones stay dark and aren't clickable. Moving
   over a slot "tunes" the panel: the dial pointer slides to it, the bank
   lamp for its letter comes on, and the signal meter reads out. Clicking
   a lit one opens the project exactly as the old grid did.
   ================================================================ */
const receiver   = $('receiver');
const rcvPointer = $('rcvPointer');
const rcvTicks   = $('rcvTicks');
const rcvBanks   = $('rcvBanks');
const mtrSignal  = $('mtrSignal');
const mtrTuning  = $('mtrTuning');
const rcvInputs  = [];

/* project codes are A1..D4 — the letter is the bank */
const bankOf = code => String(code || '').charAt(0).toUpperCase();

projects.forEach((p, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'rcv-input ' + (p.active ? 'is-loaded' : 'is-empty');
  btn.style.setProperty('--accent', p.accent);
  btn.dataset.slot = String(i);
  btn.innerHTML =
    '<span class="ri-glow" aria-hidden="true"></span>' +
    '<span class="ri-top">' +
      '<span class="ri-bulb" aria-hidden="true"></span>' +
      '<span class="ri-code">' + p.code + '</span>' +
    '</span>' +
    '<span class="ri-name">' + (p.active ? p.track : 'No input') + '</span>' +
    '<span class="ri-strip" aria-hidden="true"></span>';

  if(!p.active){
    btn.disabled = true;
    btn.setAttribute('aria-label', 'Slot ' + p.code + ' — no input connected');
  } else {
    btn.setAttribute('aria-label', 'Select ' + p.code + ' — ' + p.track);
    btn.addEventListener('click', () => openPlayer(p, btn));
  }

  /* tuning follows the pointer and the keyboard alike */
  btn.addEventListener('pointerenter', () => tuneTo(i));
  btn.addEventListener('focus',        () => tuneTo(i));

  grid.appendChild(btn);
  rcvInputs.push(btn);
});

/* ---------- dial ticks ----------
   One major tick per slot plus minors between them, so the scale always
   matches however many projects are in 02-data.js. */
(function buildTicks(){
  if(!rcvTicks) return;
  const n = projects.length;
  if(!n) return;
  let html = '';
  for(let i = 0; i < n; i++){
    const pct = ((i + 0.5) / n) * 100;
    html += '<i class="maj" style="left:' + pct.toFixed(3) + '%"></i>';
    if(i % 2 === 0){
      html += '<b style="left:' + pct.toFixed(3) + '%">' + projects[i].code + '</b>';
    }
    if(i < n - 1){
      const mid = ((i + 1) / n) * 100;
      html += '<i class="min" style="left:' + mid.toFixed(3) + '%"></i>';
    }
  }
  /* appended, not assigned — the pointer is already a child of this
     container and innerHTML would detach the node rcvPointer points at */
  rcvTicks.insertAdjacentHTML('beforeend', html);
})();

/* ---------- tuning ---------- */
let cuedSlot = -1;

function setNeedle(el, deg){
  if(el) el.style.transform = 'translateX(-50%) rotate(' + deg.toFixed(2) + 'deg)';
}

function tuneTo(i){
  if(i === cuedSlot) return;
  cuedSlot = i;
  const p = projects[i];
  if(!p) return;

  rcvInputs.forEach((el, k) => el.classList.toggle('is-cued', k === i));

  /* pointer slides along the dial to the slot's tick */
  if(rcvPointer){
    rcvPointer.style.left = (((i + 0.5) / projects.length) * 100).toFixed(3) + '%';
  }

  /* bank lamps */
  if(rcvBanks){
    const b = bankOf(p.code);
    Array.prototype.forEach.call(rcvBanks.children, el => {
      el.classList.toggle('is-on', el.dataset.bank === b);
    });
  }

  /* a loaded slot reads strong signal and centres the tuning needle;
     an empty one drops to the noise floor and drifts off centre */
  if(p.active){
    setNeedle(mtrSignal, lerp(-6, 30, 0.55 + Math.random() * 0.45));
    setNeedle(mtrTuning, (Math.random() - 0.5) * 6);
  } else {
    setNeedle(mtrSignal, lerp(-34, -18, Math.random()));
    setNeedle(mtrTuning, (Math.random() < 0.5 ? -1 : 1) * (17 + Math.random() * 12));
  }

  /* the "tuned" lamp only lights on a slot that actually has an input */
  const tuned = document.querySelector('#rcvStatus [data-lamp="tuned"]');
  if(tuned) tuned.classList.toggle('is-on', !!p.active);
}

/* leaving the panel returns it to a resting idle */
if(receiver){
  receiver.addEventListener('pointerleave', () => {
    cuedSlot = -1;
    rcvInputs.forEach(el => el.classList.remove('is-cued'));
    if(rcvBanks){
      Array.prototype.forEach.call(rcvBanks.children, el => el.classList.remove('is-on'));
    }
    const tuned = document.querySelector('#rcvStatus [data-lamp="tuned"]');
    if(tuned) tuned.classList.remove('is-on');
    setNeedle(mtrTuning, 0);
  });
}

/* ---------- idle signal drift ----------
   A real signal meter never sits perfectly still. Nudging the needle on a
   slow timer (CSS handles the easing) is much cheaper than animating it
   frame by frame, and reads more like ballistics than a tween. */
if(!reduceMotion && mtrSignal){
  setInterval(() => {
    if(cuedSlot !== -1) return;                 // hands off while tuning
    if(!receiver || !isOnScreen(receiver)) return;
    setNeedle(mtrSignal, lerp(-30, -6, Math.random()));
  }, 1400);
}

/* ---------- the flicker ----------
   Warm gear doesn't dim on a schedule, so this doesn't either: a random
   gap, a random lamp, and occasionally the whole panel browning out. The
   class is removed on animationend so it can be re-triggered later. */
function isOnScreen(el){
  const r = el.getBoundingClientRect();
  return r.bottom > -80 && r.top < window.innerHeight + 80;
}

if(!reduceMotion && receiver){
  const flickerTargets = () => {
    const lamps = Array.prototype.slice.call(
      receiver.querySelectorAll('.rcv-lamp.is-on, .rcv-input.is-loaded'));
    return lamps;
  };

  const clearFlicker = e => {
    e.currentTarget.classList.remove('is-flicker', 'flk-slow');
    e.currentTarget.removeEventListener('animationend', clearFlicker);
  };

  function flickerOnce(){
    /* don't burn cycles animating something nobody is looking at */
    if(!document.hidden && isOnScreen(receiver)){
      const roll = Math.random();

      if(roll < 0.12){
        /* rare: the whole panel sags */
        receiver.classList.add('is-dip');
        setTimeout(() => receiver.classList.remove('is-dip'), 520);
      } else {
        const lamps = flickerTargets();
        if(lamps.length){
          /* usually one lamp, sometimes two at once */
          const hits = roll > 0.86 ? 2 : 1;
          for(let n = 0; n < hits; n++){
            const el = lamps[Math.floor(Math.random() * lamps.length)];
            if(el.classList.contains('is-flicker')) continue;
            el.classList.add('is-flicker');
            if(Math.random() < 0.35) el.classList.add('flk-slow');
            el.addEventListener('animationend', clearFlicker);
          }
        }
      }
    }
    /* 1.6s–7.2s until the next one */
    setTimeout(flickerOnce, 1600 + Math.random() * 5600);
  }
  setTimeout(flickerOnce, 2200 + Math.random() * 2600);
}

function lockScroll(on){
  document.body.style.overflow = on ? 'hidden' : '';
}

function openPlayer(p, sourceBtn){
  current = p;
  lastFocus = sourceBtn || document.activeElement;
  clearTimeout(loadTimer);
  playerCard.style.setProperty('--accent', p.accent);
  overlay.classList.add('is-open');
  playerCard.classList.remove('is-ready');
  playerCard.classList.add('is-loading');
  lockScroll(true);
  $('npLabel').textContent = 'Loading ' + p.code + ' · cueing up…';
  $('vinylLabel').textContent = p.code;
  $('playerTitle').textContent = p.track;
  $('playerReal').textContent = p.real;
  $('playerDesc').textContent = p.short;
  $('playerTags').innerHTML = p.tags.map(t => '<span>' + t + '</span>').join('');
  loadTimer = setTimeout(() => {
    playerCard.classList.remove('is-loading');
    playerCard.classList.add('is-ready');
    $('npLabel').textContent = 'Now playing · ' + p.code;
    $('closeModal').focus();
  }, 1050);
}

function closePlayer(){
  overlay.classList.remove('is-open');
  clearTimeout(loadTimer);
  if(!fullOverlay.classList.contains('is-open')){
    lockScroll(false);
    if(lastFocus) { try{ lastFocus.focus(); }catch(_){} }
  }
  setTimeout(() => playerCard.classList.remove('is-loading','is-ready'), 320);
}

$('closeModal').addEventListener('click', closePlayer);
$('anotherBtn').addEventListener('click', closePlayer);
overlay.addEventListener('click', e => { if(e.target === overlay) closePlayer(); });

$('viewFullBtn').addEventListener('click', () => {
  if(!current) return;
  const p = current;
  fullOverlay.style.setProperty('--accent', p.accent);
  $('fullCode').textContent  = 'Track ' + p.code;
  $('fullTitle').textContent = p.track;
  $('fullReal').textContent  = p.real;
  $('fullArt').style.setProperty('--accent', p.accent);
  $('fullProblem').textContent = p.problem;
  $('fullApproach').innerHTML  = p.approach.map(a => '<li>' + a + '</li>').join('');
  $('fullResult').textContent  = p.result;
  $('fullTags').innerHTML = p.tags.map(t => '<span>' + t + '</span>').join('');
  $('fullLink').href = p.link;
  overlay.classList.remove('is-open');
  clearTimeout(loadTimer);
  setTimeout(() => playerCard.classList.remove('is-loading','is-ready'), 320);
  fullOverlay.classList.add('is-open');
  lockScroll(true);
  fullOverlay.scrollTop = 0;
  $('fullClose').focus();
});

function closeFull(){
  fullOverlay.classList.remove('is-open');
  lockScroll(false);
  if(lastFocus){ try{ lastFocus.focus(); }catch(_){} }
}
$('fullClose').addEventListener('click', closeFull);
$('fullBack').addEventListener('click', closeFull);

document.addEventListener('keydown', e => {
  if(e.key !== 'Escape') return;
  if(fullOverlay.classList.contains('is-open')) closeFull();
  else if(overlay.classList.contains('is-open')) closePlayer();
});

/* ---------- reveal ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if(en.isIntersecting){ en.target.classList.add('is-visible'); io.unobserve(en.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, #trackGrid, #crate').forEach(el => io.observe(el));

/* The selector lamps come up one at a time, like a panel warming through.
   Set as inline delays rather than nth-child rules so the count can change
   in 02-data.js without touching CSS. */
rcvInputs.forEach((el, i) => {
  const d = (0.04 + i * 0.032).toFixed(3) + 's';
  /* opacity and transform lead in; the hover properties must stay at 0
     or the lift and glow would lag behind the cursor */
  el.style.transitionDelay = d + ', ' + d + ', 0s, 0s, 0s';
});
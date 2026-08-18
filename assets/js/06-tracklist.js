/* Tracklist grid, player modal, full project view, scroll reveals. */
'use strict';

/* ================================================================
   TRACKLIST + MODALS
   ================================================================ */
const grid = $('trackGrid'), overlay = $('overlay');
const playerCard = $('playerCard'), fullOverlay = $('fullOverlay');
let current = null, loadTimer = null, lastFocus = null;

$('loadedCount').textContent = projects.filter(p => p.active).length + ' loaded';

projects.forEach(p => {
  const btn = document.createElement('button');
  btn.className = 'track-btn';
  btn.type = 'button';
  btn.style.setProperty('--accent', p.accent);
  btn.innerHTML =
    '<span class="tb-shine"></span>' +
    '<span class="tb-top"><span class="tb-led"></span><span class="code">' + p.code + '</span></span>' +
    '<span class="title">' + (p.active ? p.track : '— empty slot —') + '</span>';
  if(!p.active){
    btn.disabled = true;
    btn.setAttribute('aria-label', 'Slot ' + p.code + ' — empty');
  } else {
    btn.addEventListener('click', () => openPlayer(p, btn));
  }
  grid.appendChild(btn);
});

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

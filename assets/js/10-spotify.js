/* Crate: genre filter, shuffle, rows, and the Spotify now-playing bar.
   Uses the Spotify iFrame API so one embed can be controlled from the page.
   Docs: https://developer.spotify.com/documentation/embeds/references/iframe-api

   HEADS UP: listeners who are not signed into Spotify Premium in this browser
   get a 30-second preview. That is Spotify's rule, not something the code can
   change. Everyone still sees the art, title and artist.

   Tracks are followed by object, not by index — the visible list is a filtered
   and shuffled subset of `crate`, so an index into one is meaningless in the
   other. */
'use strict';

const crateEl    = $('crate');
const genresEl   = $('crateGenres');
const shuffleBtn = $('crateShuffle');
const npBar      = $('npBar');

let spotifyController = null;   // set once the iFrame API is ready
let pendingTrack = null;        // a click that arrived before the API loaded
let currentTrack = null;        // the track object in the player right now
let visible = [];               // track objects currently rendered
let crateRows = [];             // DOM rows, parallel to `visible`
let activeGenre = 'all';
let crateRevealed = false;

const trackUri = id => 'spotify:track:' + id;

/* titles and artists go through innerHTML, so escape them —
   "R&B" or an apostrophe in a song name shouldn't break the markup */
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------------------------------------------------------------
   Genre tabs.

   The tab list builds itself: 'All' first, then anything listed in
   CRATE_GENRES (so you keep control of the order), then any genre
   found on a track that wasn't listed. Adding a track with a new
   genre is therefore all it takes — no second edit needed.
   --------------------------------------------------------------- */
const GENRE_LABELS = {
  all:'All', electronic:'Electronic', rnb:'R&B', rap:'Rap', jazz:'Jazz',
  reggae:'Reggae', dub:'Dub', soul:'Soul', funk:'Funk', disco:'Disco',
  house:'House', techno:'Techno', garage:'Garage', dnb:'DnB', ambient:'Ambient',
  rock:'Rock', indie:'Indie', punk:'Punk', metal:'Metal', pop:'Pop',
  blues:'Blues', gospel:'Gospel', country:'Country', latin:'Latin',
  afrobeats:'Afrobeats', classical:'Classical', lofi:'Lo-fi'
};

function labelFor(key){
  /* a label you set in CRATE_GENRES always wins */
  if(typeof CRATE_GENRES !== 'undefined' && Array.isArray(CRATE_GENRES)){
    const cfg = CRATE_GENRES.find(g => g && g.key === key);
    if(cfg && cfg.label) return cfg.label;
  }
  if(GENRE_LABELS[key]) return GENRE_LABELS[key];
  return String(key).charAt(0).toUpperCase() + String(key).slice(1);
}

function buildGenreList(){
  const list = [], seen = new Set();
  const push = key => {
    if(!key || seen.has(key)) return;
    seen.add(key);
    list.push({ key: key, label: labelFor(key) });
  };
  push('all');
  if(typeof CRATE_GENRES !== 'undefined' && Array.isArray(CRATE_GENRES)){
    CRATE_GENRES.forEach(g => { if(g) push(g.key); });
  }
  crate.forEach(t => push(t.genre));
  return list;
}

const GENRE_TABS = buildGenreList();

function genreLabel(key){
  const g = GENRE_TABS.find(x => x.key === key);
  return g ? g.label : labelFor(key);
}

/* ---------------------------------------------------------------
   Pools
   --------------------------------------------------------------- */
function poolFor(genre){
  return genre === 'all' ? crate.slice() : crate.filter(t => t.genre === genre);
}

/* Fisher–Yates, then take the first n */
function pickRandom(list, n){
  const a = list.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a.slice(0, n);
}

/* What "All" shows before anyone touches shuffle: your showcase set,
   in the order you wrote it.

   A track is part of the showcase if it has `featured: true`. If you
   haven't flagged any, the ones carrying a `note` are used instead —
   which is why the five you originally wrote show up without you
   editing anything. Failing both, it's just the first few in the array.

   Genres other than "All" always show their own tracks in array order. */
function defaultListFor(genre){
  const pool = poolFor(genre);
  if(genre !== 'all') return pool.slice(0, CRATE_DISPLAY_COUNT);

  const flagged = pool.filter(t => t.featured);
  if(flagged.length) return flagged.slice(0, CRATE_DISPLAY_COUNT);

  const noted = pool.filter(t => t.note);
  if(noted.length) return noted.slice(0, CRATE_DISPLAY_COUNT);

  return pool.slice(0, CRATE_DISPLAY_COUNT);
}

/* ---------------------------------------------------------------
   Genre buttons
   --------------------------------------------------------------- */
function buildGenres(){
  genresEl.innerHTML = '';
  GENRE_TABS.forEach(g => {
    const count = poolFor(g.key).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'genre-chip' + (g.key === activeGenre ? ' on' : '');
    btn.dataset.genre = g.key;
    btn.setAttribute('aria-pressed', String(g.key === activeGenre));
    btn.innerHTML = esc(g.label);
    if(count === 0){
      btn.disabled = true;
      btn.title = 'No ' + g.label + ' tracks in the crate yet';
    }
    btn.addEventListener('click', () => setGenre(g.key));
    genresEl.appendChild(btn);
  });
}

function setGenre(key){
  if(key === activeGenre) return;
  activeGenre = key;
  Array.prototype.forEach.call(genresEl.children, b => {
    const on = b.dataset.genre === key;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  syncShuffleButton();
  renderCrate({ shuffle: false });
}

/* Shuffle needs at least two tracks to have something to reorder.
   It works on "All" as well as on a single genre. */
function syncShuffleButton(){
  const pool = poolFor(activeGenre).length;
  const canShuffle = pool > 1;
  const what = activeGenre === 'all' ? 'the whole crate' : 'the ' + genreLabel(activeGenre) + ' crate';
  shuffleBtn.disabled = !canShuffle;
  shuffleBtn.title = canShuffle
    ? 'Shuffle ' + what
    : 'Add more tracks to shuffle ' + what;
}

/* ---------------------------------------------------------------
   Rows
   --------------------------------------------------------------- */
function renderCrate(opts){
  const shuffle = !!(opts && opts.shuffle);
  visible = shuffle
    ? pickRandom(poolFor(activeGenre), CRATE_DISPLAY_COUNT)   /* All = across every genre */
    : defaultListFor(activeGenre);

  crateEl.innerHTML = '';
  crateRows = [];

  if(!visible.length){
    const empty = document.createElement('div');
    empty.className = 'crate-empty';
    empty.textContent = 'Nothing in this crate yet.';
    crateEl.appendChild(empty);
  }

  visible.forEach(t => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'crate-row' + (t.id ? '' : ' no-track');
    row.setAttribute('aria-label',
      t.id ? 'Play ' + t.title + ' by ' + t.artist : t.title + ' by ' + t.artist);
    if(!t.id) row.disabled = true;   // no ID yet: still shown, just not clickable
    row.innerHTML =
      '<span class="cr-left">' +
        '<span class="cr-art' + (t.art ? '' : ' no-art') + '">' +
          (t.art ? '<img src="' + esc(t.art) + '" alt="" loading="lazy">' : '') +
          '<span class="cr-play">&#9654;</span>' +
        '</span>' +
        '<span class="cr-meta">' +
          '<span class="cr-name">' + esc(t.title) + '</span>' +
          '<span class="cr-artist">' + esc(t.artist) + '</span>' +
        '</span>' +
        '<span class="cr-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '</span>' +
      '<span class="cr-note">' + esc(t.note || genreLabel(t.genre)) + '</span>';
    if(t.id) row.addEventListener('click', () => playTrack(t));
    crateEl.appendChild(row);
    crateRows.push(row);
  });

  markPlayingRow();
  replayRevealIfSeen();
  loadArtFor(visible);
}

/* The rows animate in on first scroll. On later renders the observer has
   already fired, so restart the animation by hand to make filtering and
   shuffling feel like something happened. */
function replayRevealIfSeen(){
  if(!crateRevealed) return;
  crateEl.classList.remove('is-visible');
  void crateEl.offsetWidth;          // force reflow so the transition restarts
  crateEl.classList.add('is-visible');
}

/* ---------------------------------------------------------------
   Cover art. Only fetched for rows on screen, and cached on the
   track object so switching genres doesn't refetch.
   --------------------------------------------------------------- */
function applyArt(t){
  const i = visible.indexOf(t);
  if(i === -1 || !t.art) return;
  const box = crateRows[i] && crateRows[i].querySelector('.cr-art');
  if(!box || box.querySelector('img')) return;
  box.classList.remove('no-art');
  box.insertAdjacentHTML('afterbegin',
    '<img src="' + esc(t.art) + '" alt="" loading="lazy">');
}

function loadArtFor(list){
  list.forEach(async t => {
    if(!t.id) return;
    if(t.art){ applyArt(t); return; }
    if(t.artTried) return;            // don't hammer a URL that already failed
    t.artTried = true;
    try{
      const res = await fetch(
        'https://open.spotify.com/oembed?url=' +
        encodeURIComponent('https://open.spotify.com/track/' + t.id)
      );
      if(!res.ok) return;
      const data = await res.json();
      if(!data.thumbnail_url) return;
      t.art = data.thumbnail_url;
      applyArt(t);
      if(t === currentTrack) setBarArt(t);
    }catch(_){ /* offline, blocked, or CORS — placeholder stays */ }
  });
}

/* ---------------------------------------------------------------
   Now playing
   --------------------------------------------------------------- */
function markPlayingRow(){
  crateRows.forEach((r, i) => {
    r.classList.toggle('is-playing', currentTrack != null && visible[i] === currentTrack);
  });
}

function setBarArt(t){
  const art = $('npArt');
  if(t.art){ art.src = t.art; art.style.display = ''; }
  else { art.removeAttribute('src'); art.style.display = 'none'; }
}

function playTrack(t){
  if(!t || !t.id) return;
  currentTrack = t;

  $('npTitle').textContent = t.title;
  $('npArtist').textContent = t.artist;
  setBarArt(t);

  npBar.classList.add('show');
  document.body.classList.add('np-open');
  markPlayingRow();

  /* API not ready yet — remember the click and run it on 'ready' */
  if(!spotifyController){ pendingTrack = t; return; }

  spotifyController.loadUri(trackUri(t.id));
  /* loadUri does not autostart. Give the embed a moment to swap tracks,
     then start it. This still counts as a user gesture because it began
     with the click. */
  setTimeout(() => {
    try{ spotifyController.play(); }catch(_){}
  }, 400);
}

/* Step through the tracks the visitor can actually see, wrapping around
   and skipping anything without an ID. */
function step(delta){
  const playable = visible.filter(t => t.id);
  if(!playable.length) return;
  const at = playable.indexOf(currentTrack);
  const next = at === -1
    ? (delta > 0 ? 0 : playable.length - 1)
    : (at + delta + playable.length) % playable.length;
  playTrack(playable[next]);
}

function closeBar(){
  npBar.classList.remove('show');
  document.body.classList.remove('np-open');
  currentTrack = null;
  markPlayingRow();
  if(spotifyController){ try{ spotifyController.pause(); }catch(_){} }
}

$('npPrev').addEventListener('click', () => step(-1));
$('npNext').addEventListener('click', () => step(1));
$('npClose').addEventListener('click', closeBar);

shuffleBtn.addEventListener('click', () => {
  if(shuffleBtn.disabled) return;
  shuffleBtn.classList.add('spin');
  setTimeout(() => shuffleBtn.classList.remove('spin'), 600);
  renderCrate({ shuffle: true });
});

/* ---------------------------------------------------------------
   Spotify iFrame API bootstrap.
   The API script calls this global function when it finishes loading.
   --------------------------------------------------------------- */
window.onSpotifyIframeApiReady = IFrameAPI => {
  const mount = $('npEmbed');
  const first = crate.find(t => t.id);
  if(!first) return;              // no track IDs filled in yet — nothing to mount
  IFrameAPI.createController(
    mount,
    {
      width: '100%',
      height: 80,                 // 80 = Spotify's compact player
      uri: trackUri(first.id)
    },
    controller => {
      spotifyController = controller;

      controller.addListener('ready', () => {
        if(pendingTrack){
          const t = pendingTrack;
          pendingTrack = null;
          playTrack(t);
        }
      });

      /* Keep the row highlight in sync if someone pauses from the embed */
      controller.addListener('playback_update', e => {
        if(!e || !e.data || !currentTrack) return;
        const i = visible.indexOf(currentTrack);
        if(i !== -1 && crateRows[i]){
          crateRows[i].classList.toggle('is-playing', !e.data.isPaused);
        }
      });
    }
  );
};

/* ---------------------------------------------------------------
   Reveal on scroll. The observer in 06-tracklist.js ran while #crate
   was still empty, so an empty box could never cross its threshold.
   --------------------------------------------------------------- */
const crateIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if(!en.isIntersecting) return;
    en.target.classList.add('is-visible');
    crateRevealed = true;
    crateIO.unobserve(en.target);
  });
}, { threshold: 0.12 });

buildGenres();
syncShuffleButton();
renderCrate({ shuffle: false });   // the showcase set on first paint
crateIO.observe(crateEl);
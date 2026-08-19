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

/* ---- playback state ----
   `loadedUri`  what the embed actually has loaded right now
   `wantPlayUri` a URI we've asked for but haven't seen start yet
   `spLoadTimer` backstop in case the embed never fires 'ready'
   (named spLoadTimer, not loadTimer — 06-tracklist.js already owns that
   name at global scope and two `let` declarations would be a hard error) */
let loadedUri        = null;   // what the embed actually holds
let wantPlayUri      = null;   // asked for, not yet confirmed playing
let queuedUri        = null;   // picked while a load was already running
let loadInFlight     = false;
let spLoadTimer      = null;
let playIssued       = false;  // has play() been sent for the current load?
let isPlaying        = false;
let spotifyBlocked   = false;  // the embed never loaded — see the watchdog
let spWatchdog       = null;

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
  syncCdButtons();          // the skip buttons depend on what's on screen
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
      /* art usually lands after the click, so the bar and the CD deck both
         need a second pass once it arrives */
      if(t === currentTrack){ setBarArt(t); cdArt(t); }
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

/* ---------------------------------------------------------------
   THE CD DECK

   The unit in the left column of this section mirrors whatever the
   crate is doing: picking a track wipes the loading door across the
   bay, drops the disc in, spins it up and puts the cover art on it.
   Cover art often arrives after the click (it's fetched from oEmbed),
   so cdArt() is called again when it lands.

   Every function here no-ops if the deck isn't in the page, so the
   crate still works on its own if the markup is ever removed.
   --------------------------------------------------------------- */
const cdDeck = $('cdDeck');

/* level meter bars */
(function buildCdVu(){
  const vu = $('cdVu');
  if(!vu) return;
  for(let i = 0; i < 14; i++){
    const b = document.createElement('i');
    b.style.animationDuration = (0.5 + Math.random() * 0.85).toFixed(2) + 's';
    b.style.animationDelay = (-Math.random() * 1.4).toFixed(2) + 's';
    vu.appendChild(b);
  }
})();

function cdArt(t){
  if(!cdDeck) return;
  const img = $('cdArt');
  if(!img) return;
  if(t && t.art){
    img.src = t.art;
    cdDeck.classList.add('has-art');
  } else {
    img.removeAttribute('src');
    cdDeck.classList.remove('has-art');
  }
}

let cdDoorTimer = null;

function cdLoad(t){
  if(!cdDeck || !t) return;
  const title = $('cdTitle'), artist = $('cdArtist'), mode = $('cdMode');
  if(title)  title.textContent  = t.title  || '—';
  if(artist) artist.textContent = t.artist || '';
  if(mode)   mode.textContent   = 'Reading';

  /* run the door wipe, then reveal the disc behind it */
  cdDeck.classList.remove('is-loading');
  void cdDeck.offsetWidth;                 // restart the animation
  cdDeck.classList.add('is-loading');

  clearTimeout(cdDoorTimer);
  cdDoorTimer = setTimeout(() => {
    cdDeck.classList.remove('is-loading');
    if(mode) mode.textContent = 'Playing';
  }, 640);

  cdArt(t);
  cdDeck.classList.add('has-disc');
  if(spotifyBlocked){
    if(mode) mode.textContent = 'No signal';
    clearTimeout(cdDoorTimer);
    cdDeck.classList.remove('is-loading');
  } else {
    cdDeck.classList.add('is-spinning');
  }
  syncCdButtons();
}

/* paused, but the disc stays in the tray */
function cdStop(){
  if(!cdDeck) return;
  cdDeck.classList.remove('is-spinning');
  const mode = $('cdMode');
  if(mode) mode.textContent = 'Paused';
  syncCdButtons();
}

function cdResume(){
  if(!cdDeck || !cdDeck.classList.contains('has-disc')) return;
  cdDeck.classList.add('is-spinning');
  const mode = $('cdMode');
  if(mode) mode.textContent = 'Playing';
  syncCdButtons();
}

/* disc out, back to standby */
function cdEject(){
  if(!cdDeck) return;
  clearTimeout(cdDoorTimer);
  cdDeck.classList.remove('is-spinning', 'has-disc', 'has-art', 'is-loading');
  const title = $('cdTitle'), artist = $('cdArtist'), mode = $('cdMode'), img = $('cdArt');
  if(title)  title.textContent  = 'No disc';
  if(artist) artist.textContent = 'Pick a track from the crate';
  if(mode)   mode.textContent   = 'Standby';
  if(img)    img.removeAttribute('src');
  syncCdButtons();
}

/* ---- transport ----
   The three buttons on the deck drive the same player the crate rows and
   the now-playing bar do — there's one embed, so they all go through
   playTrack / step / the controller.

   Play with nothing loaded starts the first playable track that's on
   screen, so the button always does something rather than sitting dead. */
function cdFirstPlayable(){
  return visible.find(t => t.id) || crate.find(t => t.id) || null;
}

function cdTogglePlay(){
  if(!currentTrack){
    const first = cdFirstPlayable();
    if(first) playTrack(first);
    return;
  }
  /* The button reads its own icon, not `isPlaying`.

     `is-spinning` goes on the moment a track is picked; `isPlaying` only
     flips once the embed echoes a playback_update back, a second or so
     later. Since the icon is drawn from `is-spinning`, driving the action
     from `isPlaying` meant that during that gap the button showed a pause
     symbol and behaved like play. Same class, same source of truth. */
  if(cdDeck.classList.contains('is-spinning')){
    if(spotifyController){ try{ spotifyController.pause(); }catch(_){} }
    /* Cancel any start still queued behind a load, or hitting pause right
       after picking a track would be undone a moment later by 'ready'. */
    clearPlayWait();
    wantPlayUri = null;
    playIssued  = true;
    isPlaying   = false;
    cdStop();
    return;
  }
  /* resume — requestPlay's same-URI branch issues exactly one play() */
  requestPlay(trackUri(currentTrack.id));
  cdResume();
}

/* Keep the buttons' enabled state and the play/pause label honest. */
function syncCdButtons(){
  if(!cdDeck) return;
  const btn = $('cdBtnPlay'), prev = $('cdBtnPrev'), next = $('cdBtnNext');
  if(spotifyBlocked){
    [btn, prev, next].forEach(b => { if(b) b.disabled = true; });
    return;
  }
  const anyPlayable = !!cdFirstPlayable();
  if(btn){
    btn.disabled = !anyPlayable;
    /* same source of truth as the icon and the click handler */
    const showingPlaying = cdDeck.classList.contains('is-spinning');
    btn.setAttribute('aria-label', showingPlaying ? 'Pause' : 'Play');
  }
  /* skipping needs at least two tracks on screen to move between */
  const playable = visible.filter(t => t.id).length;
  if(prev) prev.disabled = playable < 2;
  if(next) next.disabled = playable < 2;
}

if(cdDeck){
  const bp = $('cdBtnPlay'), bpv = $('cdBtnPrev'), bnx = $('cdBtnNext');
  if(bp)  bp.addEventListener('click', cdTogglePlay);
  if(bpv) bpv.addEventListener('click', () => step(-1));
  if(bnx) bnx.addEventListener('click', () => step(1));
}

/* ---------------------------------------------------------------
   Starting playback.

   The old version fired loadUri() and then play() on a blind 400ms
   timer. That is a race: loadUri tears the iframe down and rebuilds it
   with the new track, and if play() lands mid-rebuild the embed either
   ignores it or starts the outgoing track for a beat and then dies when
   the new one finishes loading — which is the "cuts out after a couple
   of seconds instead of playing the 30-second preview" bug.

   The fix is to stop guessing. The embed fires 'ready' every time a URI
   finishes loading, so play() is called from there. The timer is only a
   backstop for the case where 'ready' never arrives, and it stands down
   the moment playback_update reports the track is actually rolling.
   --------------------------------------------------------------- */
function clearPlayWait(){
  if(spLoadTimer){ clearTimeout(spLoadTimer); spLoadTimer = null; }
}

function safePlay(){
  if(!spotifyController) return;
  try{ spotifyController.play(); }catch(_){}
}

/* Start the loaded track — AT MOST ONCE per load.

   This used to retry: play(), wait 700ms, play() again, up to three times,
   on the theory that the embed might not be ready for the first one. It is
   ready, and every extra play() seeks the preview back to zero — so the
   track stuttered through three fractions of a second before the last call
   finally stuck. That is the bug.
   
   `playIssued` is the latch. 'ready' and the backstop timer both funnel
   through here and whichever arrives first wins; the other does nothing. */
function startWhenLoaded(uri){
  if(wantPlayUri !== uri) return;          // superseded by a newer selection
  clearPlayWait();
  if(playIssued) return;                   // already asked — never ask twice
  if(isPlaying){ wantPlayUri = null; return; }
  playIssued = true;
  safePlay();
}

/* Hand a URI to the embed. Only ever called when nothing else is loading —
   overlapping loadUri calls are the thing that kills a preview mid-play. */
function doLoad(uri){
  loadedUri    = uri;
  wantPlayUri  = uri;
  isPlaying    = false;
  loadInFlight = true;
  playIssued   = false;
  clearPlayWait();
  spotifyController.loadUri(uri);
  /* Backstop only. The track normally starts from the playback_update
     that reports the new URI cued at position 0, which lands well inside
     this. 600ms because that is roughly what a human reads as "instant" —
     and because the old 1400ms here was, in practice, the thing actually
     starting every track after the first. */
  spLoadTimer = setTimeout(() => {
    loadInFlight = false;
    if(!flushQueuedLoad()) startWhenLoaded(uri);
  }, 600);
}

/* If a newer track was picked while a load was in flight, load it now. */
function flushQueuedLoad(){
  if(!queuedUri) return false;
  const q = queuedUri;
  queuedUri = null;
  if(q === loadedUri) return false;
  doLoad(q);
  return true;
}

function requestPlay(uri){
  if(loadedUri === uri && !loadInFlight){
    /* Same track already in the embed — clicking the row again resumes
       it, never reloads it. Reloading is what used to restart (and then
       stall) a preview that was playing perfectly well. */
    clearPlayWait();
    wantPlayUri = uri;
    /* A deliberate press on an already-loaded track: allow exactly one
       play(), and only if it isn't already running. */
    if(!isPlaying){ playIssued = true; safePlay(); }
    return;
  }

  /* No debounce here, deliberately. There used to be a 180ms wait before
     loadUri to coalesce rapid ‹ / › presses, but it charged that delay to
     every single play — including the ordinary case of clicking one row
     once, where there is nothing to coalesce.

     The queue below does the same job for free: while a load is in flight
     a newer pick just overwrites queuedUri and runs when the embed frees
     up, so mashing skip still only ever starts the track you land on. */
  if(loadInFlight){ queuedUri = uri; return; }
  doLoad(uri);
}

/* ---------------------------------------------------------------
   WHEN SPOTIFY NEVER LOADS

   Ad blockers, tracker-blocking browsers (Brave, Firefox strict) and
   Spotify CDN trouble all stop `iframe-api/v1` from arriving, in which
   case `onSpotifyIframeApiReady` is never called and there is no
   controller to drive. Without this the page pretends: the deck spins,
   the row lights up, the bar sits there, and no audio ever comes with
   nothing on screen to explain why.

   A watchdog gives it a generous window, then swaps the player for a
   direct link to the track on Spotify.
   --------------------------------------------------------------- */
function updateFallbackLink(){
  const a = $('npFallback');
  if(!a) return;
  const cta = a.querySelector('.npf-cta');
  if(currentTrack && currentTrack.id){
    a.href = 'https://open.spotify.com/track/' + currentTrack.id;
    a.setAttribute('aria-label', 'Open ' + currentTrack.title + ' on Spotify');
    if(cta) cta.textContent = 'Open in Spotify \u2197';
  } else {
    a.href = 'https://open.spotify.com/';
    a.setAttribute('aria-label', 'Open Spotify');
    if(cta) cta.textContent = 'Open Spotify \u2197';
  }
}

function spotifyUnavailable(){
  if(spotifyBlocked || spotifyController) return;
  spotifyBlocked = true;

  /* stand everything down — nothing is going to start */
  pendingTrack = null;
  queuedUri    = null;
  wantPlayUri  = null;
  isPlaying    = false;
  loadInFlight = false;
  clearPlayWait();

  document.body.classList.add('sp-blocked');
  crateRows.forEach(r => r.classList.remove('is-playing'));

  if(cdDeck){
    cdDeck.classList.remove('is-spinning', 'is-loading');
    const mode = $('cdMode'), artist = $('cdArtist');
    if(mode) mode.textContent = 'No signal';
    if(artist && !currentTrack) artist.textContent = 'Spotify player unavailable';
  }
  syncCdButtons();
  updateFallbackLink();
}

/* Generous — a slow connection shouldn't trip it. The controller callback
   clears it. */
spWatchdog = setTimeout(spotifyUnavailable, 8000);

function playTrack(t){
  if(!t || !t.id) return;
  currentTrack = t;

  $('npTitle').textContent = t.title;
  $('npArtist').textContent = t.artist;
  setBarArt(t);

  npBar.classList.add('show');
  document.body.classList.add('np-open');
  markPlayingRow();
  cdLoad(t);

  /* no player to drive — point them at Spotify instead of spinning */
  if(spotifyBlocked){
    updateFallbackLink();
    crateRows.forEach(r => r.classList.remove('is-playing'));
    return;
  }

  /* API not ready yet — remember the click and run it on 'ready' */
  if(!spotifyController){ pendingTrack = t; return; }

  requestPlay(trackUri(t.id));
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
  /* stand down any pending start, or the backstop timer would happily
     restart the track a second after the visitor closed the bar */
  clearPlayWait();
  wantPlayUri = null;
  queuedUri = null;
  isPlaying = false;
  playIssued = false;
  markPlayingRow();
  cdEject();
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
  loadedUri = trackUri(first.id);
  IFrameAPI.createController(
    mount,
    {
      width: '100%',
      height: 80,                 // 80 = Spotify's compact player
      uri: loadedUri
    },
    controller => {
      spotifyController = controller;
      clearTimeout(spWatchdog);       // it turned up after all

      /* 'ready' fires when the iframe mounts. Do NOT assume it fires again
         for each loadUri — the primary start signal is playback_update
         below. This is kept because it is the right hook for the very
         first track and for a click that landed before the API loaded. */
      controller.addListener('ready', () => {
        loadInFlight = false;

        if(pendingTrack){
          const t = pendingTrack;
          pendingTrack = null;
          queuedUri = null;
          playTrack(t);
          return;
        }
        /* a newer pick came in mid-load — do it now that the embed is free */
        if(flushQueuedLoad()) return;
        if(wantPlayUri) startWhenLoaded(wantPlayUri);
      });

      /* This listener does three jobs: it starts the track, it tracks
         whether we're playing, and it mirrors the embed's own transport
         onto the page. */
      controller.addListener('playback_update', e => {
        const d = e && e.data;
        if(!d) return;

        const starting = !!wantPlayUri;   // asked for, not yet rolling

        /* ---- THE START SIGNAL ----
           A freshly loaded track announces itself with a duration, a
           position of 0 and isPaused true. That is the earliest moment
           the embed genuinely has the new URI, and unlike 'ready' it
           arrives on every loadUri rather than only on the first mount.
           Starting from here is what makes a click feel immediate. */
        if(starting && !playIssued &&
           (d.duration || 0) > 0 && (d.position || 0) === 0 && d.isPaused){
          loadInFlight = false;
          if(!flushQueuedLoad()) startWhenLoaded(wantPlayUri);
          return;
        }

        /* isPaused is the running signal. Position is NOT — the embed
           reports 0 for the first updates of a fresh track. */
        const running = !d.isPaused;
        const changed = running !== isPlaying;
        isPlaying = running;
        if(changed) syncCdButtons();
        if(running && wantPlayUri){
          wantPlayUri = null;
          clearPlayWait();
        }

        /* Mirror the embed's own play/pause onto the deck — but not while
           a track is still starting up, or the paused report that comes
           with a freshly loaded URI would stop the disc we just spun up. */
        if(!starting || running){
          if(d.isPaused) cdStop(); else cdResume();
        }

        if(!currentTrack) return;
        const i = visible.indexOf(currentTrack);
        if(i !== -1 && crateRows[i]){
          crateRows[i].classList.toggle('is-playing', !d.isPaused);
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
syncCdButtons();
crateIO.observe(crateEl);
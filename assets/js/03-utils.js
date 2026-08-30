/* Shared helpers. */
'use strict';

const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
const lerp  = (a,b,t) => a + (b-a)*t;

/* ---------- email link ---------- */
$('emailLink').href = 'mailto:' + YOUR_EMAIL;
$('emailLink').textContent = YOUR_EMAIL + ' →';

/* ================================================================
   LINKS — the icon row on the record sleeve, and the row under
   "Let's talk". Both are built from LINKS / SLEEVE_LINKS in
   01-config.js so a URL is only ever written in one place.

   A link with no url is skipped rather than rendered dead, except
   `email`, which falls back to YOUR_EMAIL.
   ================================================================ */

/* Inline SVG, viewBox 0 0 24 24. Brand marks are the real filled logos —
   hand-drawn stroke approximations of LinkedIn and GitHub are exactly the
   thing people fail to recognise, which defeats the point of using an icon.
   The rest are stroke icons. `solid` picks which. */
const LINK_ICONS = {
  linkedin:{ solid:true, d:'M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z' },
  github:{ solid:true, d:'M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58l-.01-2.05c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3z' },
  resume:{ d:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4' },
  email:{ d:'M3.5 6.5h17v11h-17zM3.8 7 12 13.2 20.2 7' },
  discogs:{ d:'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z' }
};

function linkIcon(key){
  const ic = LINK_ICONS[key] || LINK_ICONS.resume;
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"' +
         (ic.solid ? ' class="ico-solid"' : '') + '><path d="' + ic.d + '"/></svg>';
}

/* Resolve a config entry to a usable href, or null to skip it. */
function linkHref(item){
  if(!item) return null;
  if(item.key === 'email') return 'mailto:' + (item.url || YOUR_EMAIL);
  return item.url ? item.url : null;
}

function activeLinks(){
  if(typeof LINKS === 'undefined' || !Array.isArray(LINKS)) return [];
  return LINKS.filter(l => l && linkHref(l));
}

/* mailto and same-origin files shouldn't open a new tab; external ones should */
function linkTarget(href){
  return /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
}

(function buildSleeveLinks(){
  const box = $('sleeveLinks');
  if(!box) return;
  const want = (typeof SLEEVE_LINKS !== 'undefined' && Array.isArray(SLEEVE_LINKS))
    ? SLEEVE_LINKS : ['linkedin', 'resume', 'email'];
  const items = want
    .map(k => activeLinks().find(l => l.key === k))
    .filter(Boolean);

  if(!items.length){ box.closest('.sleeve-links').style.display = 'none'; return; }

  /* tile + label, and data-key so the CSS can give each one its brand
     colour. The label is what makes it unmistakable at a glance — an icon
     alone still asks the visitor to decode it. */
  box.innerHTML = items.map(l => {
    const href = linkHref(l);
    return '<a class="sl-btn" data-key="' + l.key + '" href="' + href + '"' +
           linkTarget(href) + ' aria-label="' + l.label + '">' +
           '<span class="sl-tile">' + linkIcon(l.key) + '</span>' +
           '<span class="sl-label">' + l.label + '</span>' +
           '</a>';
  }).join('');
})();

(function buildSocialRow(){
  const box = $('socialRow');
  if(!box) return;
  const items = activeLinks();
  if(!items.length){ box.style.display = 'none'; return; }
  box.innerHTML = items.map(l => {
    const href = linkHref(l);
    return '<a class="soc-link" data-key="' + l.key + '" href="' + href + '"' +
           linkTarget(href) + '>' + linkIcon(l.key) +
           '<span>' + l.label + '</span></a>';
  }).join('');
})();
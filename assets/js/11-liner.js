/* THE LINER NOTES — build the gatefold, then open and close it on scroll.

   Content comes from `experience`, `skills`, `education` and `about` in
   02-data.js. The fold itself is one CSS custom property, --gf-open, that
   this file drives from the section's position in the viewport: 0 while
   the section is still coming up, 1 while it's sitting in the middle of
   the screen, back to 0 as it leaves. Every transform in 08-liner.css is
   expressed in terms of that number, so scrubbing the scrollbar backwards
   folds it shut exactly the way it opened. */
'use strict';

const gatefold = $('gatefold');
const linerSection = document.querySelector('.liner-section');

/* ---------------------------------------------------------------
   Build
   --------------------------------------------------------------- */

/* everything below goes through innerHTML, so escape it — an ampersand
   in a company name shouldn't be able to break the page */
function escL(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* A missing or empty block hides its own heading rather than leaving a
   bare title over nothing — so deleting, say, `education` from 02-data.js
   is a valid edit and not a broken layout. */
function hideBlockOf(el){
  const block = el && el.closest('.gf-block');
  if(block) block.style.display = 'none';
}

function buildExperience(){
  const box = $('gfExperience');
  if(!box) return;
  const list = (typeof experience !== 'undefined' && Array.isArray(experience)) ? experience : [];
  if(!list.length){
    box.innerHTML = '<p class="gf-ed-detail">Add your roles to <code>experience</code> in assets/js/02-data.js.</p>';
    return;
  }
  box.innerHTML = list.map(x => {
    const bullets = Array.isArray(x.bullets) ? x.bullets : [];
    const stack   = Array.isArray(x.stack)   ? x.stack   : [];
    const meta = [x.period, x.location].filter(Boolean)
      .map(escL).join('<i aria-hidden="true"></i>');
    return '' +
      '<article class="gf-entry' + (x.current ? ' is-current' : '') + '">' +
        (x.side ? '<span class="gf-entry-side">' + escL(x.side) + '</span>' : '') +
        '<h5 class="gf-role">' + escL(x.role) +
          (x.current ? '<span class="gf-now">On air</span>' : '') +
        '</h5>' +
        (x.company ? '<div class="gf-co">' + escL(x.company) + '</div>' : '') +
        (meta ? '<div class="gf-meta">' + meta + '</div>' : '') +
        (bullets.length
          ? '<ul class="gf-bullets">' +
              bullets.map(b => '<li>' + escL(b) + '</li>').join('') +
            '</ul>'
          : '') +
        (stack.length
          ? '<div class="gf-chips">' +
              stack.map(s => '<span class="gf-chip">' + escL(s) + '</span>').join('') +
            '</div>'
          : '') +
      '</article>';
  }).join('');
}

function buildSkills(){
  const box = $('gfSkills');
  if(!box) return;
  const list = (typeof skills !== 'undefined' && Array.isArray(skills)) ? skills : [];
  if(!list.length){ hideBlockOf(box); return; }
  box.innerHTML = list.map(g => {
    const items = Array.isArray(g.items) ? g.items : [];
    return '' +
      '<div class="gf-sgroup">' +
        '<span class="gf-sname">' + escL(g.group) + '</span>' +
        '<div class="gf-sitems">' +
          items.map(i => '<span class="gf-sitem">' + escL(i) + '</span>').join('') +
        '</div>' +
      '</div>';
  }).join('');
}

function buildEducation(){
  const box = $('gfEducation');
  if(!box) return;
  const list = (typeof education !== 'undefined' && Array.isArray(education)) ? education : [];
  if(!list.length){ hideBlockOf(box); return; }
  box.innerHTML = list.map(e => '' +
    '<div class="gf-ed">' +
      '<div class="gf-ed-cred">' + escL(e.credential) + '</div>' +
      (e.school ? '<div class="gf-ed-school">' + escL(e.school) + '</div>' : '') +
      (e.period ? '<div class="gf-ed-meta">' + escL(e.period) + '</div>' : '') +
      (e.detail ? '<div class="gf-ed-detail">' + escL(e.detail) + '</div>' : '') +
    '</div>').join('');
}

function buildAbout(){
  const box   = $('gfAbout');
  const facts = $('gfFacts');
  if(!box) return;
  const data  = (typeof about !== 'undefined' && about) ? about : null;
  const paras = data && Array.isArray(data.paras) ? data.paras : [];
  const rows  = data && Array.isArray(data.facts) ? data.facts : [];

  if(!paras.length && !rows.length){ hideBlockOf(box); return; }

  box.innerHTML = paras.map(p => '<p>' + escL(p) + '</p>').join('');
  if(facts){
    facts.innerHTML = rows.map(f =>
      '<dt>' + escL(f.k) + '</dt><dd>' + escL(f.v) + '</dd>').join('');
    if(!rows.length) facts.style.display = 'none';
  }
}

buildExperience();
buildSkills();
buildEducation();
buildAbout();

/* ---------------------------------------------------------------
   The fold
   --------------------------------------------------------------- */
if(gatefold && linerSection){

  /* Reduced motion gets the spread flat and static — the CSS already
     forces --gf-open:1, so there's nothing to drive. */
  if(reduceMotion){
    gatefold.style.setProperty('--gf-open', '1');
  } else {

    let gfShown = -1;          // last value written, so we skip no-op writes
    let gfTicking = false;     // one rAF in flight at a time

    /* smoothstep — no linear ramp, the fold eases at both ends */
    const smooth = t => t * t * (3 - 2 * t);

    function gfProgress(){
      /* Measured on the sleeve itself, not the section — the section
         includes the heading above it, and starting the fold off that
         would have the sleeve most of the way open before it's even on
         screen on a short desktop viewport. */
      const r  = gatefold.getBoundingClientRect();
      const vh = window.innerHeight;

      /* enter: shut until the top edge crosses 92% of the viewport,
                fully open half a screen later
         exit:  starts shutting as the bottom edge nears the top of the
                screen, shut by the time it's gone
         The smaller of the two is the open amount, which gives
         open-on-the-way-in and close-on-the-way-out from one expression. */
      const enter = clamp((vh * 0.92 - r.top)   / Math.max(vh * 0.50, 1), 0, 1);
      const exit  = clamp((r.bottom - vh * 0.02) / Math.max(vh * 0.45, 1), 0, 1);
      return smooth(Math.min(enter, exit));
    }

    function gfFrame(){
      const p = gfProgress();
      /* two decimals is under a pixel of difference on screen and stops
         this from writing a new style on every single frame */
      const v = Math.round(p * 100) / 100;
      if(v !== gfShown){
        gfShown = v;
        gatefold.style.setProperty('--gf-open', String(v));
      }
      gfTicking = false;
    }

    function gfRequest(){
      if(gfTicking) return;
      gfTicking = true;
      requestAnimationFrame(gfFrame);
    }

    /* Only listen while the section is anywhere near the screen. Off
       screen there is nothing to animate and no reason to run. */
    let gfNear = false;
    const gfIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        gfNear = en.isIntersecting;
        if(gfNear) gfRequest();
        else if(gfShown !== 0){
          gfShown = 0;
          gatefold.style.setProperty('--gf-open', '0');
        }
      });
    }, { rootMargin: '120% 0px 120% 0px' });
    gfIO.observe(linerSection);

    window.addEventListener('scroll', () => { if(gfNear) gfRequest(); }, { passive:true });
    window.addEventListener('resize', () => { if(gfNear) gfRequest(); });
    gfRequest();
  }
}
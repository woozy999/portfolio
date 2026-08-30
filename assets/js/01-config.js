/* Contact settings — set these two and the form works. */
'use strict';

/* ================================================================
   1. CONTACT SETTINGS — set these two and the form works.
   FORMSPREE_ENDPOINT: from https://formspree.io  e.g. 'https://formspree.io/f/abcdwxyz'
   YOUR_EMAIL: used for the mailto link and as the fallback.
   ================================================================ */
const FORMSPREE_ENDPOINT = '';
const YOUR_EMAIL = 'kyle.offenbacher@gmail.com';

/* ================================================================
   YOUR LINKS — these drive the icon row on the record sleeve in the
   hero AND the row under "Let's talk" in the contact section, so you
   set each URL once.

   Leave a `url` empty and that link is dropped from both places
   rather than rendering as a dead button.

   `key` picks the icon. Icons for github and discogs are still defined
   in 03-utils.js, so adding a line back here is all it takes to bring
   either one out again:
     { key:'github',  label:'GitHub',  url:'https://github.com/…' },
     { key:'discogs', label:'Discogs', url:'https://www.discogs.com/user/…' },
   ================================================================ */
const LINKS = [
  { key:'linkedin', label:'LinkedIn', url:'https://www.linkedin.com/in/kyle-offenbacher/' },
  { key:'resume',   label:'Resume',   url:'assets/resume.pdf' },
  { key:'email',    label:'Email',    url:'' }    /* blank = uses YOUR_EMAIL above */
];

/* Which of the above appear on the record sleeve in the hero. Keep this
   short — three is the sweet spot for a 240px sleeve. */
const SLEEVE_LINKS = ['linkedin', 'resume', 'email'];
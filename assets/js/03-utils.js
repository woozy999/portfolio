/* Shared helpers. */
'use strict';

const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
const lerp  = (a,b,t) => a + (b-a)*t;

/* ---------- email link ---------- */
$('emailLink').href = 'mailto:' + YOUR_EMAIL;
$('emailLink').textContent = YOUR_EMAIL + ' →';

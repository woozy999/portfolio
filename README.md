# kyleo.info — portfolio

Static site. No build step, no dependencies. Deployed with GitHub Pages
straight from the repository root.

## Structure

```
index.html                  entry point (GitHub Pages serves this)
.nojekyll                   tells Pages to serve files as-is
assets/
  css/
    01-base.css             custom properties, reset, typography, utilities
    02-chrome.css           stacking order, scope controls, nav, side rail
    03-hero.css             hero ambient layers, headline, unsleeve rig
    04-sections.css         section rhythm, tracklist, chassis, turntable, crate
    05-components.css       speakers, modals, contact form, footer
  js/
    01-config.js            YOUR EMAIL + FORM ENDPOINT — edit this
    02-data.js              YOUR PROJECTS — edit this
    03-utils.js             shared helpers
    04-ambient.js           sparkles, speaker bars
    05-scope.js             background oscilloscope
    06-tracklist.js         track grid, player modal, project view
    07-contact.js           contact form submission
    08-turntable.js         sticky toolkit section
    09-main.js              animation loop
```

**Load order matters.** The CSS files are numbered because later rules
depend on coming after earlier ones. The JS files are numbered because
later files use values defined in earlier ones. Keep the `<link>` and
`<script>` tags in `index.html` in numeric order.

## Editing your content

Almost everything you'll want to change lives in two files:

- `assets/js/01-config.js` — your email address and contact form endpoint
- `assets/js/02-data.js` — your projects

Your record crate is plain markup in `index.html`; search for
`EDIT THESE: your actual records`.

## Making the contact form send mail

Until you set an endpoint, the form opens the visitor's email app with
everything pre-filled — so it works out of the box.

To collect submissions instead:

1. Sign up at <https://formspree.io> and create a form.
2. Paste the endpoint into `FORMSPREE_ENDPOINT` in `assets/js/01-config.js`.

## Deploying

Commit everything to the repository root, then in the repo:
Settings → Pages → Deploy from a branch → `main` / `(root)`.

## The oscilloscope

The green trace behind the hero is drawn on a canvas — no audio is
produced or played. The control panel in the lower corner sets the shape
(sine, square, triangle, saw, pulse, rectified, heartbeat, noise) and
four parameters: frequency, amplitude, warp (drives the shape toward a
harder edge; sets duty cycle on pulse), and glow. `×2` adds a second
offset trace; it's off by default, so one waveform shows.

/* Ambient sparkles and speaker equalizer bars. */
'use strict';

/* ================================================================
   AMBIENT SPARKLES + SPEAKER BARS
   ================================================================ */
(function buildAmbient(){
  const box = $('sparkles');
  const kinds = ['', 'gold', 'mint'];
  for(let i=0;i<20;i++){
    const s = document.createElement('i');
    s.className = kinds[Math.floor(Math.random()*kinds.length)];
    const size = 1.5 + Math.random()*2.8;
    s.style.width = s.style.height = size+'px';
    s.style.left = Math.random()*100+'%';
    s.style.top  = (55 + Math.random()*50)+'%';
    s.style.animationDuration = (11 + Math.random()*14)+'s';
    s.style.animationDelay = (-Math.random()*24)+'s';
    box.appendChild(s);
  }
  for(let i=0;i<7;i++){
    const b = document.createElement('b');
    b.style.left = (5 + Math.random()*90)+'%';
    b.style.top  = (8 + Math.random()*80)+'%';
    b.style.animationDuration = (3.2 + Math.random()*4)+'s';
    b.style.animationDelay = (-Math.random()*7)+'s';
    box.appendChild(b);
  }
  const w = $('spkWaves');
  for(let i=0;i<9;i++){
    const b = document.createElement('i');
    b.style.animationDuration = (0.5 + Math.random()*0.9)+'s';
    b.style.animationDelay = (-Math.random()*1.2)+'s';
    w.appendChild(b);
  }
})();

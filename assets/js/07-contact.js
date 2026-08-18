/* Contact form submission. */
'use strict';

/* ================================================================
   CONTACT FORM
   ================================================================ */
const form = $('contactForm'), statusEl = $('formStatus'), submitBtn = $('submitBtn');
const SUBMIT_LABEL = submitBtn.textContent;

function setStatus(msg, kind){
  statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
  statusEl.innerHTML = msg ? '<span class="fs-dot"></span>' + msg : '';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('name').value.trim();
  const email = $('email').value.trim();
  const message = $('message').value.trim();

  if(!name || !email || !message){ setStatus('Please fill in every field.', 'err'); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ setStatus('That email address looks off.', 'err'); return; }
  if(form.querySelector('[name="_gotcha"]').value) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  setStatus('Sending…');

  if(!FORMSPREE_ENDPOINT){
    const subject = encodeURIComponent('Portfolio message from ' + name);
    const body = encodeURIComponent(message + '\n\n—\n' + name + '\n' + email);
    window.location.href = 'mailto:' + YOUR_EMAIL + '?subject=' + subject + '&body=' + body;
    submitBtn.disabled = false;
    submitBtn.textContent = SUBMIT_LABEL;
    setStatus('Opening your email app…', 'ok');
    return;
  }

  try{
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    });
    if(res.ok){
      form.reset();
      setStatus('Sent — thanks, I\'ll get back to you soon.', 'ok');
      submitBtn.textContent = 'Sent ✓';
      setTimeout(() => { submitBtn.textContent = SUBMIT_LABEL; submitBtn.disabled = false; }, 2600);
    } else {
      let msg = 'Something went wrong.';
      try{
        const data = await res.json();
        if(data && data.errors) msg = data.errors.map(x => x.message).join(', ');
      }catch(_){}
      setStatus(msg + ' You can also email ' + YOUR_EMAIL + ' directly.', 'err');
      submitBtn.textContent = SUBMIT_LABEL; submitBtn.disabled = false;
    }
  }catch(err){
    setStatus('Couldn\'t reach the server. Email ' + YOUR_EMAIL + ' directly.', 'err');
    submitBtn.textContent = SUBMIT_LABEL; submitBtn.disabled = false;
  }
});

(function(){
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // mobile menu
  var btn = document.getElementById('menuBtn'), nav = document.getElementById('nav');
  btn.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.addEventListener('click', function(e){
    if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  });

  // services dropdown (desktop)
  var group = document.querySelector('.nav-group'), drop = document.querySelector('.nav-drop');
  if (group && drop) {
    drop.addEventListener('click', function(e){
      e.stopPropagation();
      var open = group.classList.toggle('open');
      drop.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', function(e){
      if (!group.contains(e.target)) { group.classList.remove('open'); drop.setAttribute('aria-expanded','false'); }
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && group.classList.contains('open')) { group.classList.remove('open'); drop.setAttribute('aria-expanded','false'); drop.focus(); }
    });
  }

  // reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }

  // count-up stats
  var counters = document.querySelectorAll('[data-count]');
  function run(el){
    var end = +el.dataset.count, plain = el.hasAttribute('data-plain');
    var start = plain ? end - 8 : 0, t0 = null, dur = 1100;
    function step(t){
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ run(en.target); co.unobserve(en.target); } });
    }, {threshold:.6});
    counters.forEach(function(c){ co.observe(c); });
  }

  // billing toggle
  var opts = document.querySelectorAll('.bill-opt');
  opts.forEach(function(o){
    o.addEventListener('click', function(){
      var mode = o.dataset.bill;
      opts.forEach(function(x){ var on = x === o; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      document.querySelectorAll('.support strong').forEach(function(s){
        s.classList.add('flip');
        setTimeout(function(){
          s.textContent = mode === 'year' ? s.dataset.y : s.dataset.m;
          s.nextElementSibling.textContent = mode === 'year' ? '/ year (2 months free)' : '/ month';
          s.classList.remove('flip');
        }, reduce ? 0 : 180);
      });
    });
  });

  // image fallback
  document.querySelectorAll('img').forEach(function(img){
    img.addEventListener('error', function(){ img.style.minHeight = '200px'; img.alt = img.alt || 'Image unavailable'; });
  });

  // quote form
  var form = document.getElementById('quoteForm');
  if (form) {
    var svc = document.getElementById('qService'), tf = document.getElementById('tenderFields');
    var tenderInputs = tf.querySelectorAll('input');
    var err = document.getElementById('formErr');
    function isTender(){ return svc.value === 'Tender Preparation' || svc.value === 'Prequalification'; }
    function syncTender(){
      var on = isTender();
      tf.hidden = !on;
      tenderInputs.forEach(function(i){ i.required = on; if (!on) i.removeAttribute('aria-invalid'); });
    }
    svc.addEventListener('change', syncTender); syncTender();
    form.addEventListener('input', function(e){ if (e.target.getAttribute('aria-invalid') && e.target.checkValidity()) e.target.removeAttribute('aria-invalid'); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (form.website.value) return; // spam trap
      var bad = [];
      form.querySelectorAll('input,select,textarea').forEach(function(f){
        if (f.name === 'website') return;
        if (!f.checkValidity()) { f.setAttribute('aria-invalid','true'); bad.push(f); } else f.removeAttribute('aria-invalid');
      });
      if (bad.length) {
        err.textContent = 'Please fill in the highlighted fields' + (bad.some(function(f){return f.type==='email' && f.value;}) ? ' (check the email address)' : '') + '.';
        err.hidden = false; bad[0].focus(); return;
      }
      err.hidden = true;
      var d = {}; new FormData(form).forEach(function(v,k){ d[k] = String(v).trim(); });
      var lines = [
        'Hello Payron, I would like a quote.', '',
        'Name: ' + d.name, 'Company: ' + d.company, 'Phone: ' + d.phone, 'Email: ' + d.email,
        'Service: ' + d.service
      ];
      if (isTender()) lines.push('Tender number: ' + d.tender_no, 'Procuring entity: ' + d.entity, 'Submission deadline: ' + d.deadline);
      lines.push('', 'What I need: ' + d.need);
      if (d.doc) lines.push('Document / LPO link: ' + d.doc);
      if (d.source) lines.push('Heard about you via: ' + d.source);
      var msg = lines.join('\n');
      var waUrl = 'https://wa.me/254718639705?text=' + encodeURIComponent(msg);
      var mailUrl = 'mailto:info@payronagency.co.ke?subject=' + encodeURIComponent('Quote request: ' + d.service + ' - ' + d.company) + '&body=' + encodeURIComponent(msg);

      var btn = document.getElementById('qSubmit');
      function done(ok){
        document.querySelectorAll('#qThanks .qwa').forEach(function(a){ a.href = waUrl; });
        document.getElementById('qMail').href = mailUrl;
        document.getElementById('qOkNote').hidden = !ok;
        document.getElementById('qFailNote').hidden = ok;
        if (ok) document.getElementById('qEmailEcho').textContent = d.email;
        form.hidden = true;
        var th = document.getElementById('qThanks'); th.hidden = false; th.focus();
      }
      // Send to the Tender Tracker; fall back to WhatsApp if it can't be reached
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint || !window.fetch) { window.open(waUrl, '_blank', 'noopener'); done(false); return; }
      btn.disabled = true; btn.textContent = 'Sending...';
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function(){ if (ctl) ctl.abort(); }, 20000);
      fetch(endpoint, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(d), signal: ctl ? ctl.signal : undefined})
        .then(function(r){ return r.json(); })
        .then(function(j){
          clearTimeout(timer);
          if (j && j.ok) { done(true); return; }
          btn.disabled = false; btn.textContent = 'Send request';
          if (j && /^(phone|email|missing|tender|service)$/.test(j.error)) {
            err.textContent = 'Please check your details' + (j.error === 'phone' ? ' (phone number)' : j.error === 'email' ? ' (email address)' : '') + ' and try again.';
            err.hidden = false; return;
          }
          done(false);
        })
        .catch(function(){ clearTimeout(timer); btn.disabled = false; btn.textContent = 'Send request'; done(false); });
    });
  }


  // tender alerts sign-up
  document.querySelectorAll('.alerts-form').forEach(function(f){
    var err = f.querySelector('.form-err'), btn = f.querySelector('button[type=submit]'), ok = f.querySelector('.alerts-done');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.website.value) return;
      var bad = [];
      f.querySelectorAll('input').forEach(function(i){ if (i.name === 'website') return; if (!i.checkValidity()) { i.setAttribute('aria-invalid','true'); bad.push(i); } else i.removeAttribute('aria-invalid'); });
      if (bad.length) { err.textContent = 'Please fill in the highlighted fields and tick the box.'; err.hidden = false; bad[0].focus(); return; }
      err.hidden = true;
      var d = { website:'', name:f.name.value.trim(), phone:f.phone.value.trim(), company:f.company.value.trim(), email:'', service:'Tender Alerts', source:'Other',
        need:'TENDER ALERTS SIGN-UP (weekly on WhatsApp, consent given). Supplies: ' + f.supplies.value.trim() };
      var waMsg = 'Hello Payron, please add me to your weekly tender alerts.\nName: ' + d.name + '\nCompany: ' + (d.company || '-') + '\nI supply: ' + f.supplies.value.trim();
      function fin(){ f.querySelectorAll('.f2,.fld,.consent,button').forEach(function(x){ x.hidden = true; }); ok.hidden = false; ok.focus(); }
      btn.disabled = true; btn.textContent = 'Sending...';
      fetch(f.getAttribute('data-endpoint'), {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(d)})
        .then(function(r){ return r.json(); })
        .then(function(j){
          if (j && j.ok) return fin();
          btn.disabled = false; btn.textContent = 'Send me tender alerts';
          err.textContent = j && j.error === 'phone' ? 'Please check your WhatsApp number.' : 'Something went wrong. Please try again or message us on WhatsApp.'; err.hidden = false;
        })
        .catch(function(){ window.open('https://wa.me/254718639705?text=' + encodeURIComponent(waMsg), '_blank', 'noopener'); fin(); });
    });
  });


  // generic sign-up forms (training etc.)
  document.querySelectorAll('.signup-form').forEach(function(f){
    var err = f.querySelector('.form-err'), btn = f.querySelector('button[type=submit]'), ok = f.querySelector('.alerts-done'), label = btn.textContent;
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.website.value) return;
      var bad = [];
      f.querySelectorAll('input,select').forEach(function(i){ if (i.name === 'website') return; if (!i.checkValidity()) { i.setAttribute('aria-invalid','true'); bad.push(i); } else i.removeAttribute('aria-invalid'); });
      if (bad.length) { err.textContent = 'Please fill in the highlighted fields.'; err.hidden = false; bad[0].focus(); return; }
      err.hidden = true;
      var svc = f.getAttribute('data-service'), extra = [];
      f.querySelectorAll('input,select').forEach(function(i){ if (['website','name','phone','company'].indexOf(i.name) === -1 && i.value) extra.push((i.closest('label').querySelector('span') || {textContent:i.name}).textContent.replace('*','').trim() + ': ' + i.value); });
      var d = { website:'', name:f.name.value.trim(), phone:f.phone.value.trim(), company:f.company.value.trim() || '(individual)', email:'', service:svc, source:'Other', need: svc.toUpperCase() + ' REQUEST. ' + extra.join(' | ') };
      function fin(){ f.querySelectorAll('.f2,.fld,button').forEach(function(x){ x.hidden = true; }); ok.hidden = false; ok.focus(); }
      btn.disabled = true; btn.textContent = 'Sending...';
      fetch(f.getAttribute('data-endpoint'), {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(d)})
        .then(function(r){ return r.json(); })
        .then(function(j){ if (j && j.ok) return fin(); btn.disabled = false; btn.textContent = label; err.textContent = j && j.error === 'phone' ? 'Please check your phone number.' : 'Something went wrong. Please try again or message us on WhatsApp.'; err.hidden = false; })
        .catch(function(){ window.open('https://wa.me/254718639705?text=' + encodeURIComponent('Hello Payron. ' + d.need + ' Name: ' + d.name), '_blank', 'noopener'); fin(); });
    });
  });


  // review form (posts to intake as form:'review')
  document.querySelectorAll('.review-form').forEach(function(f){
    var err = f.querySelector('.form-err'), btn = f.querySelector('button[type=submit]'), ok = f.querySelector('.alerts-done'), label = btn.textContent;
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.website.value) return;
      var r = f.querySelector('input[name=rating]:checked');
      if (!r) { err.textContent = 'Please choose a star rating.'; err.hidden = false; f.querySelector('input[name=rating]').focus(); return; }
      if (!f.service.value) { f.service.setAttribute('aria-invalid','true'); err.textContent = 'Please choose what we helped you with.'; err.hidden = false; f.service.focus(); return; }
      f.service.removeAttribute('aria-invalid'); err.hidden = true;
      var d = { website:'', form:'review', rating:Number(r.value), service:f.service.value, comment:f.comment.value.trim(), name:f.name.value.trim(), company:f.company.value.trim(), share:f.share.checked };
      function fin(){ f.querySelectorAll('.f2,.fld,.consent,button').forEach(function(x){ x.hidden = true; }); if (d.rating >= 4) ok.querySelector('.rv-google').hidden = false; ok.hidden = false; ok.focus(); }
      btn.disabled = true; btn.textContent = 'Sending...';
      fetch(f.getAttribute('data-endpoint'), {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(d)})
        .then(function(x){ return x.json(); })
        .then(function(j){ if (j && j.ok) return fin(); btn.disabled = false; btn.textContent = label; err.textContent = 'Something went wrong. Please try again or message us on WhatsApp.'; err.hidden = false; })
        .catch(function(){ btn.disabled = false; btn.textContent = label; err.textContent = 'Could not send. Please check your connection and try again.'; err.hidden = false; });
    });
  });

  // client stories (approved reviews only; section stays hidden if there are none)
  var stories = document.getElementById('client-stories');
  if (stories && window.fetch) {
    fetch(stories.getAttribute('data-endpoint') + '?reviews=1')
      .then(function(x){ return x.json(); })
      .then(function(j){
        var list = (j && j.reviews) || []; if (!list.length) return;
        var grid = stories.querySelector('.stories-grid');
        list.forEach(function(rv){
          var c = document.createElement('figure'); c.className = 'story';
          var st = document.createElement('div'); st.className = 'story-stars'; st.setAttribute('aria-label', rv.rating + ' out of 5 stars'); st.textContent = '★★★★★'.slice(0, rv.rating);
          var q = document.createElement('blockquote'); q.textContent = rv.comment;
          var cap = document.createElement('figcaption'); cap.textContent = rv.service + ' client';
          c.appendChild(st); c.appendChild(q); c.appendChild(cap); grid.appendChild(c);
        });
        stories.hidden = false;
      }).catch(function(){});
  }

  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
})();

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

      // Optional: send to the Tender Tracker web app when an endpoint is configured
      var endpoint = form.getAttribute('data-endpoint');
      if (endpoint) {
        try { fetch(endpoint, {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(d)}); } catch (x) {}
      }
      window.open(waUrl, '_blank', 'noopener');
      document.getElementById('qWaAgain').href = waUrl;
      document.getElementById('qMail').href = mailUrl;
      form.hidden = true;
      var th = document.getElementById('qThanks'); th.hidden = false; th.focus();
    });
  }

  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
})();

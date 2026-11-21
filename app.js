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
    if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  });

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

  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
})();

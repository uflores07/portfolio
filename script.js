(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress ruler */
  var progressFill = document.querySelector('.progress-fill');
  function updateProgress() {
    var scrollTop = root.scrollTop || document.body.scrollTop;
    var height = root.scrollHeight - root.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Scroll-reveal sheets + active nav sheet indicator */
  var sections = document.querySelectorAll('section[data-reveal]');
  var navLinks = document.querySelectorAll('.nav a');

  function setActiveNav(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      },
      { threshold: 0.12 }
    );
    sections.forEach(function (s) { revealObserver.observe(s); });

    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.target.id) setActiveNav(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  } else {
    sections.forEach(function (s) { s.classList.add('in-view'); });
  }

  /* Cursor coordinate HUD + subtle grid parallax (pointer devices only) */
  var supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hud = document.querySelector('.coord-hud');
  var hudX = hud ? hud.querySelector('.coord-x') : null;
  var hudY = hud ? hud.querySelector('.coord-y') : null;

  if (supportsHover && !reduceMotion) {
    window.addEventListener(
      'mousemove',
      function (e) {
        if (hudX && hudY) {
          hudX.textContent = 'X ' + String(e.clientX).padStart(4, '0');
          hudY.textContent = 'Y ' + String(e.clientY).padStart(4, '0');
        }
        var px = (e.clientX / window.innerWidth - 0.5) * 12;
        var py = (e.clientY / window.innerHeight - 0.5) * 12;
        root.style.setProperty('--grid-shift-x', px.toFixed(1) + 'px');
        root.style.setProperty('--grid-shift-y', py.toFixed(1) + 'px');
      },
      { passive: true }
    );
  } else if (hud) {
    hud.style.display = 'none';
  }
})();

(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress bar */
  var progressFill = document.querySelector('.progress-fill');
  function updateProgress() {
    var scrollTop = root.scrollTop || document.body.scrollTop;
    var height = root.scrollHeight - root.clientHeight;
    progressFill.style.width = (height > 0 ? (scrollTop / height) * 100 : 0) + '%';
  }
  if (progressFill) {
    document.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* Scroll reveal + active nav LED */
  var revealSections = document.querySelectorAll('section[data-reveal]');
  var navSections = document.querySelectorAll('main section[id]');
  var nav = document.querySelector('.nav');
  var navLinks = document.querySelectorAll('.nav a');

  function setActiveNav(id) {
    navLinks.forEach(function (a) {
      var isActive = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', isActive);
      // on narrow screens the nav scrolls sideways; keep the lit link visible
      if (isActive && nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({ left: a.offsetLeft - nav.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  // interest pages mark their nav link active in the HTML; bring it into view on narrow screens
  var presetActive = document.querySelector('.nav a.active');
  if (presetActive && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = presetActive.offsetLeft - nav.offsetLeft - 16;
  }

  /* Staggered entrances: number the children of each list */
  document.querySelectorAll('.skill-grid, .log-list, .project-grid, .board-modules, .gallery').forEach(function (list) {
    list.setAttribute('data-stagger', '');
    Array.prototype.forEach.call(list.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  /* Heading decode: scramble each section heading, then resolve it left to right */
  var GLYPHS = '0123456789ABCDEF#%&*<>/';
  function decode(el) {
    var original = el.textContent;
    el.setAttribute('aria-label', original);
    var start = null;
    var duration = 650;
    function step(now) {
      if (start === null) start = now;
      var progress = Math.min(1, (now - start) / duration);
      var revealed = Math.floor(progress * original.length);
      var out = original.slice(0, revealed);
      for (var i = revealed; i < original.length; i++) {
        var ch = original[i];
        out += ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = original;
    }
    requestAnimationFrame(step);
  }

  function onReveal(section) {
    section.classList.add('in-view');
    if (!reduceMotion) section.querySelectorAll('h2').forEach(decode);
  }

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          onReveal(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealSections.forEach(function (s) { revealObserver.observe(s); });

    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveNav(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    navSections.forEach(function (s) { navObserver.observe(s); });
  } else {
    revealSections.forEach(function (s) { s.classList.add('in-view'); });
  }

  /* Boot line typing */
  var boot = document.querySelector('.boot-line');
  if (boot) {
    var bootText = boot.querySelector('.boot-text');
    var fullText = bootText.textContent;
    if (reduceMotion) {
      boot.classList.add('done');
    } else {
      bootText.textContent = '';
      var typed = 0;
      (function typeNext() {
        typed++;
        bootText.textContent = fullText.slice(0, typed);
        if (typed < fullText.length) {
          setTimeout(typeNext, 25 + Math.random() * 40);
        } else {
          setTimeout(function () { boot.classList.add('done'); }, 300);
        }
      })();
    }
  }

  initCircuit();
  initModules();
  initLightbox();

  /* Interest modules: fire a pulse down the trace, then open the module's page */
  function initModules() {
    var board = document.querySelector('.board');
    if (!board) return;

    board.querySelectorAll('.module-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (reduceMotion || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        var mod = link.closest('.module');
        board.classList.add('is-firing');
        mod.classList.add('is-firing');
        setTimeout(function () { window.location.href = link.href; }, 420);
      });
    });

    // coming back via the back button restores the page from cache; clear the lit state
    window.addEventListener('pageshow', function () {
      board.classList.remove('is-firing');
      board.querySelectorAll('.module.is-firing').forEach(function (m) { m.classList.remove('is-firing'); });
    });
  }

  /* Gallery lightbox (interest pages) */
  function initLightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-open'));
    if (!items.length) return;

    // discourage saving photos: block the right-click menu and dragging on gallery images
    ['contextmenu', 'dragstart'].forEach(function (type) {
      document.addEventListener(type, function (e) {
        if (e.target.closest('.gallery-item, .lightbox')) e.preventDefault();
      });
    });

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lightbox-prev" aria-label="Previous photo">&lsaquo;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lightbox-next" aria-label="Next photo">&rsaquo;</button>';
    document.body.appendChild(box);

    var img = box.querySelector('img');
    var caption = box.querySelector('figcaption');
    var closeBtn = box.querySelector('.lightbox-close');
    var prevBtn = box.querySelector('.lightbox-prev');
    var nextBtn = box.querySelector('.lightbox-next');
    var current = 0;

    function show(i) {
      current = (i + items.length) % items.length;
      var item = items[current];
      var thumb = item.querySelector('img');
      img.src = item.getAttribute('data-full') || thumb.src;
      img.alt = thumb ? thumb.alt : '';
      caption.textContent = item.getAttribute('data-caption') || '';
      prevBtn.hidden = nextBtn.hidden = items.length < 2;
    }

    function open(i) {
      show(i);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      items[current].focus();
    }

    items.forEach(function (item, i) {
      item.addEventListener('click', function () { open(i); });
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(current - 1); });
    nextBtn.addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        var focusable = [closeBtn, prevBtn, nextBtn].filter(function (b) { return !b.hidden; });
        var idx = focusable.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? idx - 1 : idx + 1;
        focusable[(next + focusable.length) % focusable.length].focus();
      }
    });

    var touchX = null;
    box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* Hero circuit board: procedurally routed traces with travelling signal pulses */
  function initCircuit() {
    var hero = document.querySelector('.hero');
    var canvas = document.querySelector('.circuit-bg');
    if (!hero || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');

    var GRID = 28;
    var COPPER = '232, 150, 74';
    var SIGNAL = '72, 240, 143';
    var BG = '#0a0c0b';
    var DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

    var w = 0, h = 0;
    var traces = [], pulses = [], ripples = [];
    var mouse = { x: 0, y: 0, active: false };
    var rafId = null, visible = true;
    var lastFrame = 0, lastSpawn = 0, lastHoverSpawn = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function generate() {
      traces = [];
      pulses = [];
      var cols = Math.floor(w / GRID) + 1;
      var rows = Math.floor(h / GRID) + 1;
      var ox = (w - (cols - 1) * GRID) / 2;
      var oy = (h - (rows - 1) * GRID) / 2;
      var used = new Uint8Array(cols * rows);
      var target = Math.max(30, Math.min(90, Math.round((cols * rows) / 16)));
      var attempts = 0;

      function toPx(p) { return { x: ox + p[0] * GRID, y: oy + p[1] * GRID }; }

      while (traces.length < target && attempts < target * 6) {
        attempts++;
        var c = Math.floor(Math.random() * cols);
        var r = Math.floor(Math.random() * rows);
        if (used[r * cols + c]) continue;

        var d = Math.floor(Math.random() * 4) * 2; // start orthogonal
        var cells = [[c, r]];
        var corners = [[c, r]];
        var vias = [];
        used[r * cols + c] = 1;

        var steps = Math.floor(rand(4, 16));
        for (var s = 0; s < steps; s++) {
          var diagonal = d % 2 === 1;
          if (s > 1 && Math.random() < (diagonal ? 0.45 : 0.18)) {
            d = (d + (Math.random() < 0.5 ? 1 : 7)) % 8; // turn 45 degrees
            corners.push([c, r]);
            if (Math.random() < 0.3) vias.push([c, r]);
          }
          var nc = c + DIRS[d][0];
          var nr = r + DIRS[d][1];
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || used[nr * cols + nc]) break;
          c = nc;
          r = nr;
          used[r * cols + c] = 1;
          cells.push([c, r]);
        }
        corners.push([c, r]);

        var pts = [];
        corners.forEach(function (p) {
          var px = toPx(p);
          var prev = pts[pts.length - 1];
          if (!prev || prev.x !== px.x || prev.y !== px.y) pts.push(px);
        });

        if (cells.length < 4 || pts.length < 2) {
          cells.forEach(function (p) { used[p[1] * cols + p[0]] = 0; });
          continue;
        }

        var segs = [], len = 0;
        for (var i = 1; i < pts.length; i++) {
          var sl = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
          segs.push(sl);
          len += sl;
        }

        traces.push({
          pts: pts, segs: segs, len: len,
          vias: vias.map(toPx),
          glow: 0, flashA: 0, flashB: 0
        });
      }
    }

    function distToTrace(t, x, y) {
      var best = Infinity;
      for (var i = 1; i < t.pts.length; i++) {
        var a = t.pts[i - 1], b = t.pts[i];
        var dx = b.x - a.x, dy = b.y - a.y;
        var l2 = dx * dx + dy * dy;
        var k = l2 ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / l2)) : 0;
        var px = a.x + k * dx - x, py = a.y + k * dy - y;
        var d2 = px * px + py * py;
        if (d2 < best) best = d2;
      }
      return Math.sqrt(best);
    }

    function pointAt(t, dist) {
      if (dist <= 0) return t.pts[0];
      for (var i = 0; i < t.segs.length; i++) {
        if (dist <= t.segs[i]) {
          var a = t.pts[i], b = t.pts[i + 1], k = dist / t.segs[i];
          return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
        }
        dist -= t.segs[i];
      }
      return t.pts[t.pts.length - 1];
    }

    function spawnPulse(t, fromEnd) {
      if (pulses.length > 40) return;
      pulses.push({ t: t, d: fromEnd ? t.len : 0, dir: fromEnd ? -1 : 1, speed: rand(70, 150) });
    }

    function glowDot(x, y, radius, alpha) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, 'rgba(' + SIGNAL + ',' + alpha + ')');
      g.addColorStop(1, 'rgba(' + SIGNAL + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawPad(p, alpha, flash) {
      if (flash > 0.02) glowDot(p.x, p.y, 14, flash * 0.6);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = BG;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = flash > 0.02
        ? 'rgba(' + SIGNAL + ',' + Math.min(1, 0.35 + flash) + ')'
        : 'rgba(' + COPPER + ',' + Math.min(1, alpha + 0.12) + ')';
      ctx.stroke();
    }

    function render(dt) {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      traces.forEach(function (t) {
        var target = mouse.active ? Math.max(0, 1 - distToTrace(t, mouse.x, mouse.y) / 150) : 0;
        t.glow += (target - t.glow) * Math.min(1, dt * 8);
        var alpha = 0.2 + t.glow * 0.55;

        ctx.lineWidth = 1.4 + t.glow * 0.6;
        ctx.strokeStyle = 'rgba(' + COPPER + ',' + alpha + ')';
        ctx.beginPath();
        ctx.moveTo(t.pts[0].x, t.pts[0].y);
        for (var i = 1; i < t.pts.length; i++) ctx.lineTo(t.pts[i].x, t.pts[i].y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(' + COPPER + ',' + Math.min(1, alpha + 0.1) + ')';
        t.vias.forEach(function (v) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });

        t.flashA = Math.max(0, t.flashA - dt * 1.8);
        t.flashB = Math.max(0, t.flashB - dt * 1.8);
        drawPad(t.pts[0], alpha, t.flashA);
        drawPad(t.pts[t.pts.length - 1], alpha, t.flashB);
      });

      for (var p = pulses.length - 1; p >= 0; p--) {
        var pulse = pulses[p];
        pulse.d += pulse.dir * pulse.speed * dt;
        if (pulse.d < 0 || pulse.d > pulse.t.len) {
          if (pulse.dir > 0) pulse.t.flashB = 1; else pulse.t.flashA = 1;
          pulses.splice(p, 1);
          continue;
        }
        for (var k = 6; k >= 1; k--) {
          var tp = pointAt(pulse.t, pulse.d - pulse.dir * k * 5);
          ctx.fillStyle = 'rgba(' + SIGNAL + ',' + (0.55 * (1 - k / 7)) + ')';
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, 2.2 - k * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        var head = pointAt(pulse.t, pulse.d);
        glowDot(head.x, head.y, 12, 0.5);
        ctx.fillStyle = 'rgba(210, 255, 228, 0.95)';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      for (var q = ripples.length - 1; q >= 0; q--) {
        var rp = ripples[q];
        rp.r += dt * 160;
        rp.a -= dt * 1.4;
        if (rp.a <= 0) { ripples.splice(q, 1); continue; }
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(' + SIGNAL + ',' + rp.a + ')';
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function frame(now) {
      rafId = requestAnimationFrame(frame);
      if (now - lastFrame < 1000 / 50) return;
      var dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      if (now - lastSpawn > 260 && traces.length && pulses.length < 18) {
        lastSpawn = now;
        spawnPulse(traces[Math.floor(Math.random() * traces.length)], Math.random() < 0.5);
      }
      render(dt);
    }

    function start() {
      if (rafId === null && !reduceMotion && visible && !document.hidden) {
        lastFrame = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }

    function stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function size(force) {
      var rect = hero.getBoundingClientRect();
      // ignore small height changes (mobile URL bar) so the board doesn't reshuffle while scrolling
      if (!force && Math.abs(rect.width - w) < 2 && Math.abs(rect.height - h) < 120) return;
      w = rect.width;
      h = rect.height;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      generate();
      render(0);
    }

    function localPoint(e) {
      var rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    size(true);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { size(false); }, 150);
    });

    if (reduceMotion) return;

    hero.addEventListener('mousemove', function (e) {
      var pt = localPoint(e);
      mouse.x = pt.x;
      mouse.y = pt.y;
      mouse.active = true;

      var now = performance.now();
      if (now - lastHoverSpawn > 420) {
        var best = null, bestD = 70;
        traces.forEach(function (t) {
          var dd = distToTrace(t, pt.x, pt.y);
          if (dd < bestD) { bestD = dd; best = t; }
        });
        if (best) {
          lastHoverSpawn = now;
          spawnPulse(best, Math.random() < 0.5);
        }
      }
    });

    hero.addEventListener('mouseleave', function () { mouse.active = false; });

    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      var pt = localPoint(e);
      ripples.push({ x: pt.x, y: pt.y, r: 4, a: 0.9 });

      var candidates = traces.map(function (t) {
        var a = t.pts[0], b = t.pts[t.pts.length - 1];
        var dA = Math.hypot(a.x - pt.x, a.y - pt.y);
        var dB = Math.hypot(b.x - pt.x, b.y - pt.y);
        return { t: t, d: Math.min(dA, dB), fromEnd: dB < dA };
      }).sort(function (m, n) { return m.d - n.d; });

      candidates.slice(0, 10).forEach(function (c, i) {
        if (i >= 4 && c.d > 180) return;
        if (c.fromEnd) c.t.flashB = 1; else c.t.flashA = 1;
        spawnPulse(c.t, c.fromEnd);
      });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(hero);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    start();
  }
})();

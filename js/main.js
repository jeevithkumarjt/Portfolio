/* ============================================================
   MAIN SCRIPT — Jeevith Kumar R / Portfolio
   ------------------------------------------------------------
   Zero dependencies. Vanilla DOM + IntersectionObserver + rAF.
   Motion system:
     • preloader → hero reveal sequence
     • scroll reveals (opacity / translate / scale), once only
     • counters + SVG ring progress on intersect
     • floating nav glass transition + scrollspy
     • reading progress + back-to-top FAB
     • custom soft cursor (fine pointers, no reduced motion)
     • magnetic buttons + ripple feedback
     • floating-label form with inline validation → mailto
   Every feature degrades gracefully:
     • prefers-reduced-motion  → static, fully visible
     • no pointer                 → cursor/magnetic off
     • no backdrop-filter         → handled in CSS
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     00. Utilities
     ---------------------------------------------------------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function observeOnce(els, onIn) {
    if (!('IntersectionObserver' in window)) {
      els.forEach(onIn);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        onIn(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }


  /* ----------------------------------------------------------
     01. Theme toggle (persisted, system-aware)
         Initial attribute is set by a tiny inline script in
         <head> to avoid a flash of the wrong theme.
     ---------------------------------------------------------- */
  (function theme() {
    var btn = $('#themeToggle');
    var metaTheme = $('meta[name="theme-color"]');
    if (!btn) return;

    function apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      if (metaTheme) {
        metaTheme.setAttribute('content', theme === 'dark' ? '#0a0b10' : '#f6f6f3');
      }
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }

    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
      apply(next);
    });

    apply(document.documentElement.getAttribute('data-theme') || 'light');
  })();


  /* ----------------------------------------------------------
     02. Preloader → hero reveal
     ---------------------------------------------------------- */
  (function preloader() {
    var pre = $('.preloader');
    var hero = $('.hero');
    if (!pre) { if (hero) hero.classList.add('is-ready'); return; }

    function reveal() {
      pre.classList.add('is-done');
      document.body.classList.remove('is-locked');
      if (hero) hero.classList.add('is-ready');
    }

    if (reduceMotion) {
      pre.classList.add('is-done');
      if (hero) hero.classList.add('is-ready');
      document.body.classList.remove('is-locked');
      return;
    }

    document.body.classList.add('is-locked');
    var min = new Promise(function (r) { setTimeout(r, 750); });
    var loaded = new Promise(function (r) {
      if (document.readyState === 'complete') r();
      else window.addEventListener('load', r, { once: true });
    });
    // Safety net: never trap the user behind the loader.
    setTimeout(reveal, 3200);
    Promise.all([min, loaded]).then(reveal);

    // bfcache restore: never leave the loader/scroll-lock on screen.
    window.addEventListener('pageshow', function () {
      if (!pre.classList.contains('is-done')) reveal();
    });
  })();


  /* ----------------------------------------------------------
     03. Cross-page transition overlay
         Applied only to same-origin internal pages.
     ---------------------------------------------------------- */
  (function pageTransition() {
    var overlay = $('.page-overlay');
    if (!overlay || reduceMotion) return;

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
      if (/^(mailto:|tel:|https?:|javascript:)/i.test(href)) return;
      if (/\.html(?:#[^#]*)?$/i.test(href)) {
        e.preventDefault();
        overlay.classList.add('is-active');
        setTimeout(function () { window.location.href = href; }, 320);
      }
    });

    // Clear the transition overlay on every entry, including bfcache
    // restore when the previous page's DOM is brought back as-is.
    window.addEventListener('pageshow', function () {
      overlay.classList.remove('is-active');
      document.body.classList.remove('is-locked');
    });
  })();


  /* ----------------------------------------------------------
     04. Soft custom cursor (fine pointer + no reduced motion)
     ---------------------------------------------------------- */
  (function cursor() {
    if (!finePointer || reduceMotion) return;
    var dot = $('.cursor-dot');
    var ring = $('.cursor-ring');
    if (!dot || !ring) return;

    var tx = 0, ty = 0, rx = 0, ry = 0, raf = null;

    function loop() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      if (!raf) { loop(); }
    }, { passive: true });

    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('a, button, input, textarea, [data-magnetic], .project, .skill-card, .about-card, .contact-tile');
      if (!t) return;
      if (t.matches('input, textarea')) ring.classList.add('is-text');
      else ring.classList.add('is-hover');
    });
    document.addEventListener('pointerout', function (e) {
      var t = e.target.closest('a, button, input, textarea, [data-magnetic], .project, .skill-card, .about-card, .contact-tile');
      if (!t) return;
      ring.classList.remove('is-hover', 'is-text');
    });
    document.addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { ring.classList.remove('is-down'); });
  })();


  /* ----------------------------------------------------------
     05. Floating nav + burger + anchor handling
     ---------------------------------------------------------- */
  (function nav() {
    var header = $('#siteHeader');
    var burger = $('#navBurger');
    var menu = $('#mobileMenu');

    function closeMenu() {
      if (!burger || !menu) return;
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
    }

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = !menu.classList.contains('is-open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        menu.classList.toggle('is-open', open);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // Close the mobile menu when an anchor is chosen.
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a) closeMenu();
    });

    // Scroll-driven glass transition for the floating nav.
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();


  /* ----------------------------------------------------------
     06. Reading progress + back-to-top FAB
     ---------------------------------------------------------- */
  (function progress() {
    var bar = $('#readingProgress i');
    var backTop = $('#backTop');
    var backRing = $('#backTopRing');

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      if (backTop) backTop.classList.toggle('is-visible', window.scrollY > 480);
      if (backRing) backRing.style.strokeDashoffset = String(125.6 * (1 - p));
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });

    if (backTop) {
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
    update();
  })();


  /* ----------------------------------------------------------
     07. Scrollspy — active nav state
     ---------------------------------------------------------- */
  (function scrollspy() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('[data-nav]');
    if (!links.length) return;
    var sections = $$('section[id]');

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        links.forEach(function (link) {
          var on = link.getAttribute('href') === id;
          link.classList.toggle('is-active', on);
          if (on) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-38% 0px -55% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  })();


  /* ----------------------------------------------------------
     08. Hero word split (masked line reveal)
     ---------------------------------------------------------- */
  (function heroSplit() {
    var title = $('#heroTitle');
    if (!title || reduceMotion) return;

    title.querySelectorAll('.line').forEach(function (line) {
      var gradient = line.hasAttribute('data-gradient')
        ? line.getAttribute('data-gradient').split(',').map(function (s) { return parseInt(s, 10); })
        : [];
      var words = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      words.forEach(function (word, i) {
        var wrap = document.createElement('span');
        wrap.className = 'word';
        var inner = document.createElement('span');
        inner.className = 'wi';
        inner.textContent = word;
        if (gradient.indexOf(i) !== -1) inner.classList.add('gradient');
        wrap.appendChild(inner);
        wrap.style.setProperty('--d', (0.12 + i * 0.05) + 's');
        line.appendChild(wrap);
        if (i < words.length - 1) line.appendChild(document.createTextNode(' '));
      });
    });
  })();


  /* ----------------------------------------------------------
     09. Scroll reveals — [data-reveal] and [data-reveal-group]
     ---------------------------------------------------------- */
  (function reveal() {
    var singles = $$('[data-reveal]');
    var groups = $$('[data-reveal-group]');

    observeOnce(singles, function (el) { el.classList.add('is-in'); });

    groups.forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--d', (i * 0.09) + 's');
      });
      observeOnce([group], function (el) { el.classList.add('is-in'); });
    });
  })();


  /* ----------------------------------------------------------
     10. Skill bars — animate once on intersect (via .is-in)
     ---------------------------------------------------------- */
  (function skillBars() {
    observeOnce($$('.skill-card'), function (el) { el.classList.add('is-in'); });
  })();


  /* ----------------------------------------------------------
     11. Impact rings + counters
     ---------------------------------------------------------- */
  (function impact() {
    // Set each ring's target from data-ring (percent of full circle).
    $$('.stat-ring .ring-fg').forEach(function (ring) {
      var pct = parseFloat(ring.getAttribute('data-ring')) || 100;
      ring.style.setProperty('--ring-to', ((1 - pct / 100) * 326.7).toFixed(2) + 'px');
    });

    // Animate the .stat cards (reveal + ring transition) once.
    observeOnce($$('.stat'), function (el) { el.classList.add('is-in'); });

    // Counters — rAF ease-out, run once.
    function countUp(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      if (reduceMotion) { el.textContent = String(Math.round(target)); return; }
      el.textContent = '0';
      var duration = 1600;
      var start = null;
      function tick(now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    observeOnce($$('[data-count]'), countUp);
  })();


  /* ----------------------------------------------------------
     12. Timeline line — grows on intersect
     ---------------------------------------------------------- */
  (function timeline() {
    var tl = $('.timeline');
    if (tl) observeOnce([tl], function (el) { el.classList.add('is-in'); });
  })();


  /* ----------------------------------------------------------
     13. Marquee — duplicate track for a seamless loop
     ---------------------------------------------------------- */
  (function marquee() {
    var track = $('[data-marquee]');
    if (track && !reduceMotion) track.innerHTML += track.innerHTML;
  })();


  /* ----------------------------------------------------------
     14. Magnetic buttons (fine pointers only)
     ---------------------------------------------------------- */
  (function magnetic() {
    if (!finePointer || reduceMotion) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) * 0.22;
        var my = (e.clientY - r.top - r.height / 2) * 0.22;
        el.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  })();


  /* ----------------------------------------------------------
     15. Button ripple feedback
     ---------------------------------------------------------- */
  (function ripple() {
    if (reduceMotion) return;
    $$('.btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var r = btn.getBoundingClientRect();
        var size = Math.max(r.width, r.height) * 1.6;
        var rippleEl = document.createElement('span');
        rippleEl.className = 'ripple';
        var color = btn.classList.contains('btn-primary')
          ? 'rgba(255,255,255,0.5)'
          : 'rgba(41,65,153,0.16)';
        rippleEl.style.cssText =
          'width:' + size + 'px;height:' + size + 'px;' +
          'left:' + (e.clientX - r.left) + 'px;top:' + (e.clientY - r.top) + 'px;' +
          '--ripple-color:' + color + ';' +
          'transition:transform .7s cubic-bezier(.22,1,.36,1),opacity .7s;';
        btn.appendChild(rippleEl);
        requestAnimationFrame(function () {
          rippleEl.style.transform = 'translate(-50%,-50%) scale(1)';
          rippleEl.style.opacity = '0';
        });
        setTimeout(function () {
          if (rippleEl.parentNode) rippleEl.parentNode.removeChild(rippleEl);
        }, 750);
      });
    });
  })();


  /* ----------------------------------------------------------
     16. Contact form — floating labels (CSS) + validation → mailto
     ---------------------------------------------------------- */
  (function contact() {
    var form = $('#contactForm');
    if (!form) return;

    var nameField = $('#cf-name');
    var emailField = $('#cf-email');
    var msgField = $('#cf-msg');
    var status = $('.form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(field) {
      var value = field.value.trim();
      var ok = field === emailField ? emailRe.test(value) : value.length > 0;
      var group = field.closest('.field');
      if (!group) return ok;
      group.classList.toggle('is-error', !ok && value.length > 0);
      group.classList.toggle('is-valid', ok && value.length > 0);
      return ok;
    }

    [nameField, emailField, msgField].forEach(function (field) {
      field.addEventListener('input', function () { validateField(field); });
      field.addEventListener('blur', function () { validateField(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = [nameField, emailField, msgField].map(validateField).indexOf(false) === -1;
      if (!valid) {
        status.textContent = 'Please complete every field correctly.';
        status.classList.add('is-error');
        var firstBad = form.querySelector('.field.is-error input, .field.is-error textarea');
        if (firstBad) firstBad.focus();
        return;
      }

      status.classList.remove('is-error');
      status.textContent = 'Preparing your email client\u2026';
      setTimeout(function () {
        var subject = encodeURIComponent('Project inquiry from ' + nameField.value.trim());
        var body = encodeURIComponent(
          msgField.value.trim() + '\n\n\u2014 ' + nameField.value.trim() + ' (' + emailField.value.trim() + ')'
        );
        window.location.href = 'mailto:jeeviaero123@gmail.com?subject=' + subject + '&body=' + body;
      }, 700);
    });
  })();


  /* ----------------------------------------------------------
     17. Footer year
     ---------------------------------------------------------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

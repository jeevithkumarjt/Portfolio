(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!hasGsap) return;

  gsap.registerPlugin(ScrollTrigger, SplitText);

  var prefersLenis = typeof window.Lenis !== 'undefined' && !reduceMotion;
  var lenis = null;

  if (prefersLenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.4
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.2, offset: 0 });
    } else {
      var el = typeof target === 'string' ? $(target) : target;
      var top = el ? el.getBoundingClientRect().top + window.pageYOffset : 0;
      window.scrollTo(0, top);
    }
  }

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var id = anchor.getAttribute('href');
    if (id.length > 1) {
      var target = $(id);
      if (target) {
        e.preventDefault();
        scrollToTarget(target);
      }
    }
  });

  /* ---------- Split-text helpers ---------- */
  function gradRange(el) {
    var grad = el.querySelector('.gradient');
    if (!grad) return null;
    var full = el.textContent;
    var startIdx = full.indexOf(grad.textContent);
    if (startIdx < 0) return null;
    var prefix = full.slice(0, startIdx).trim();
    var start = prefix ? prefix.split(/\s+/).length : 0;
    var count = grad.textContent.trim().split(/\s+/).length;
    return { start: start, count: count };
  }

  function splitChars(el) {
    return new SplitText(el, { type: 'chars' });
  }

  function splitWords(el) {
    var range = gradRange(el);
    var split = new SplitText(el, { type: 'words' });
    if (range) {
      split.words.slice(range.start, range.start + range.count).forEach(function (w) {
        w.classList.add('word--grad');
      });
    }
    return split;
  }

  /* ---------- Cursor ---------- */
  var dot = $('.cursor-dot');
  var ring = $('.cursor-ring');

  if (dot && ring && finePointer && !reduceMotion) {
    var dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' });
    var dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' });
    var ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    var ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });

    window.addEventListener('mousemove', function (e) {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
    });

    window.addEventListener('mouseleave', function () {
      gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
    });

    document.addEventListener('mouseover', function (e) {
      var target = e.target.closest('a, button, input, textarea, .profile-card, .project-card, .skill-card, .contact-tile, .orbit-node');
      if (!target) return;
      if (target.matches('input, textarea')) {
        ring.classList.add('is-text');
      } else {
        ring.classList.add('is-hover');
      }
    });

    document.addEventListener('mouseout', function (e) {
      var target = e.target.closest('a, button, input, textarea, .profile-card, .project-card, .skill-card, .contact-tile, .orbit-node');
      if (!target) return;
      ring.classList.remove('is-hover', 'is-text');
    });

    document.addEventListener('mousedown', function () { ring.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { ring.classList.remove('is-down'); });
  }

  /* ---------- Spotlight + parallax on mouse ---------- */
  var spotlight = $('.bg-spotlight');
  var parallaxEls = $$('[data-parallax]');
  var hasParallax = finePointer && !reduceMotion && parallaxEls.length;

  if (spotlight && finePointer && !reduceMotion) {
    var sx = gsap.quickSetter(spotlight, 'css', '--mx', '%');
    var sy = gsap.quickSetter(spotlight, 'css', '--my', '%');
    window.addEventListener('mousemove', function (e) {
      sx((e.clientX / window.innerWidth) * 100);
      sy((e.clientY / window.innerHeight) * 100);
      gsap.to(spotlight, { opacity: 1, duration: 0.5 });
    });
  }

  if (hasParallax) {
    window.addEventListener('mousemove', function (e) {
      var nx = (e.clientX / window.innerWidth - 0.5) * 2;
      var ny = (e.clientY / window.innerHeight - 0.5) * 2;
      parallaxEls.forEach(function (el) {
        var f = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        gsap.to(el, { x: nx * 46 * f, y: ny * 40 * f, duration: 1, ease: 'power3.out', overwrite: 'auto' });
      });
    });
    window.addEventListener('mouseleave', function () {
      gsap.to(parallaxEls, { x: 0, y: 0, duration: 1, ease: 'power3.out' });
    });
  }

  /* ---------- Magnetic elements ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-magnetic], .magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) * 0.28;
        var my = (e.clientY - r.top - r.height / 2) * 0.28;
        gsap.to(el, { x: mx, y: my, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ---------- Tilt cards ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotationY: px * 9,
          rotationX: -py * 9,
          transformPerspective: 900,
          duration: 0.5,
          ease: 'power2.out'
        });
        if (card.classList.contains('project-card') || card.classList.contains('skill-card')) {
          card.style.setProperty('--mx', (px + 0.5) * 100 + '%');
          card.style.setProperty('--my', (py + 0.5) * 100 + '%');
        }
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }

  /* ---------- Button ripple ---------- */
  if (!reduceMotion) {
    $$('.btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var r = btn.getBoundingClientRect();
        var size = Math.max(r.width, r.height) * 1.4;
        var ripple = document.createElement('span');
        ripple.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,0.4);transform:translate(-50%,-50%) scale(0);width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left) + 'px;top:' + (e.clientY - r.top) + 'px;';
        btn.appendChild(ripple);
        gsap.fromTo(ripple, { scale: 0, opacity: 0.7 }, {
          scale: 1, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: function () {
            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
          }
        });
      });
    });
  }

  /* ---------- Particles ---------- */
  var canvas = $('#particles');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var rafId = null;
    var running = true;

    function initParticles() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(38, Math.min(85, Math.round((w * h) / 22000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.6 + 0.5
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var w = window.innerWidth;
      var h = window.innerHeight;
      var link = 110;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < link * link) {
            var a = (1 - Math.sqrt(d2) / link) * 0.14;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(139,92,246,' + a + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      rafId = window.requestAnimationFrame(draw);
    }

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(initParticles, 250);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        rafId = window.requestAnimationFrame(draw);
      }
    });

    initParticles();
    rafId = window.requestAnimationFrame(draw);
  }

  /* ---------- Hero intro ---------- */
  var heroTitle = $('#heroTitle');
  var heroItems = $$('[data-hero-item]');
  var profileCard = $('#profileCard');

  if (!reduceMotion) {
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    var chars = heroTitle ? splitChars(heroTitle).chars : [];

    if (chars.length) {
      gsap.set(chars, { yPercent: 120, opacity: 0 });
    }
    gsap.set($$('[data-hero-item], .profile-card, .float-badge, .profile-social a, .scroll-hint'), {
      y: 34,
      opacity: 0
    });

    heroTl
      .fromTo($('.hero-eyebrow'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 })
      .to(chars, { yPercent: 0, opacity: 1, stagger: 0.024, duration: 1.05, ease: 'expo.out' }, '-=0.25')
      .to(heroItems.slice(1, 3), { y: 0, opacity: 1, stagger: 0.1, duration: 0.7 }, '-=0.55')
      .to(heroItems.slice(3), { y: 0, opacity: 1, stagger: 0.09, duration: 0.6 }, '-=0.5')
      .fromTo(profileCard, { opacity: 0, y: 46, rotateY: -14 }, { opacity: 1, y: 0, rotateY: 0, duration: 1.1, ease: 'expo.out', transformPerspective: 900 }, 0.35)
      .to($$('.float-badge'), { y: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'back.out(2)' }, '-=0.5')
      .to($$('.profile-social a'), { y: 0, opacity: 1, stagger: 0.06, duration: 0.5 }, '-=0.6')
      .to($('.scroll-hint'), { opacity: 1, y: 0, duration: 0.6 }, '-=0.5');
  }

  /* ---------- Marquee ---------- */
  var track = $('[data-marquee]');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  /* ---------- Reveals ---------- */
  var revealMap = {
    left: { x: -56 },
    right: { x: 56 },
    scale: { scale: 0.88 },
    blur: { filter: 'blur(10px)' },
    up: { y: 48 }
  };

  $$('[data-reveal]').forEach(function (el) {
    if (reduceMotion) return;
    var variant = el.getAttribute('data-reveal') || 'up';
    var from = revealMap[variant] || revealMap.up;
    var vars = Object.assign({}, from, { opacity: 0 });
    var to = { opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', ease: 'power3.out', duration: 1 };
    gsap.fromTo(el, vars, Object.assign({}, to, {
      scrollTrigger: {
        trigger: el,
        start: 'top 86%',
        once: true
      }
    }));
  });

  $$('[data-split]').forEach(function (el) {
    if (reduceMotion) return;
    var words = splitWords(el).words;
    gsap.fromTo(words, { yPercent: 46, opacity: 0, filter: 'blur(6px)' }, {
      yPercent: 0,
      opacity: 1,
      filter: 'blur(0px)',
      stagger: 0.035,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  $$('[data-split-words]').forEach(function (el) {
    if (reduceMotion) return;
    var words = splitWords(el).words;
    gsap.fromTo(words, { yPercent: 60, opacity: 0 }, {
      yPercent: 0,
      opacity: 1,
      stagger: 0.05,
      duration: 0.9,
      ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach(function (el) {
    if (reduceMotion) return;
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var state = { v: 0 };
    gsap.to(state, {
      v: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: function () { el.textContent = Math.round(state.v); }
    });
  });

  /* ---------- Skill bars ---------- */
  $$('.skill-bar i').forEach(function (bar) {
    if (reduceMotion) return;
    var p = parseFloat(bar.style.getPropertyValue('--p')) || 0;
    gsap.to(bar, {
      scaleX: p,
      duration: 1.3,
      ease: 'power3.out',
      scrollTrigger: { trigger: bar, start: 'top 88%', once: true }
    });
  });

  /* ---------- Stat rings ---------- */
  $$('.stat-ring .ring-fg').forEach(function (ring) {
    if (reduceMotion) {
      ring.style.strokeDashoffset = '0';
      return;
    }
    gsap.to(ring, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: ring, start: 'top 88%', once: true }
    });
  });

  /* ---------- Timeline ---------- */
  var timeline = $('.timeline');
  var timelineLine = $('.timeline-line i');
  if (timelineLine && !reduceMotion) {
    gsap.fromTo(timelineLine, { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: timeline,
        start: 'top 72%',
        end: 'bottom 55%',
        scrub: 0.6
      }
    });
  }

  if (!reduceMotion) {
    gsap.fromTo($$('.timeline-item'), { opacity: 0, y: 60 }, {
      opacity: 1,
      y: 0,
      stagger: 0.18,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: timeline, start: 'top 78%', once: true }
    });
  }

  /* ---------- Nav ---------- */
  var header = $('#siteHeader');
  var progress = $('#scrollProgress i');

  ScrollTrigger.create({
    start: 10,
    end: 'max',
    onUpdate: function (self) {
      var scrolled = self.scroll() > 10;
      header.classList.toggle('is-scrolled', scrolled);
    }
  });

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: function (self) {
      if (progress) progress.style.transform = 'scaleX(' + self.progress + ')';
    }
  });

  var sections = $$('[data-section]');
  var navLinks = $$('[data-nav]');
  sections.forEach(function (section) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: function (self) {
        if (!self.isActive) return;
        var id = '#' + section.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      }
    });
  });

  var hero = $('#home');
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: '80% top',
    onUpdate: function (self) {
      var hint = $('.scroll-hint');
      if (hint) hint.style.opacity = String(Math.max(0, 1 - self.progress * 2.4));
    }
  });

  /* ---------- Burger menu ---------- */
  var burger = $('#navBurger');
  var navMenu = $('#navMenu');
  if (burger && navMenu) {
    function closeMenu() {
      burger.classList.remove('is-open');
      navMenu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
    }
    function openMenu() {
      burger.classList.add('is-open');
      navMenu.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
    }
    burger.addEventListener('click', function () {
      if (navMenu.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    navLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- Back to top ---------- */
  var backTop = $('#backTop');
  var backRing = $('#backTopRing');
  if (backTop) {
    var backCirc = 2 * Math.PI * 20;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        if (backRing) backRing.style.strokeDashoffset = String(backCirc * (1 - self.progress));
      }
    });
    backTop.addEventListener('click', function () { scrollToTarget(0); });
  }

  /* ---------- Contact form ---------- */
  var form = $('#contactForm');
  if (form) {
    var nameField = $('#cf-name');
    var emailField = $('#cf-email');
    var msgField = $('#cf-msg');
    var submitBtn = $('#submitBtn');
    var status = $('.form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(field) {
      var value = field.value.trim();
      var ok = false;
      if (field === emailField) ok = emailRe.test(value);
      else ok = value.length > 0;
      field.classList.toggle('is-valid', ok && value.length > 0);
      field.classList.toggle('is-error', !ok && value.length > 0);
      return ok;
    }

    [nameField, emailField, msgField].forEach(function (field) {
      field.addEventListener('input', function () { validateField(field); });
      field.addEventListener('blur', function () { validateField(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = [nameField, emailField, msgField].map(validateField).every(Boolean);
      if (!valid) {
        status.textContent = 'Please fill in every field correctly.';
        status.classList.add('show', 'is-error');
        var firstBad = form.querySelector('.is-error');
        if (firstBad) firstBad.focus();
        return;
      }

      status.classList.remove('is-error');
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      $('.btn-label', submitBtn).textContent = 'Preparing...';

      setTimeout(function () {
        submitBtn.classList.remove('is-loading');
        $('.btn-label', submitBtn).textContent = 'Opening email';
        status.textContent = 'Message ready. Your email client will open.';
        status.classList.add('show');
        var subject = encodeURIComponent('Project inquiry from ' + nameField.value.trim());
        var body = encodeURIComponent(msgField.value.trim() + '\n\n- ' + nameField.value.trim() + ' (' + emailField.value.trim() + ')');
        window.location.href = 'mailto:jeeviaero123@gmail.com?subject=' + subject + '&body=' + body;
      }, 1000);
    });
  }

  /* ---------- Fonts / refresh ---------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();

/* ============================================================
   Jeevithkumar R — Portfolio interactions
   Vanilla JS only. Motion respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var revealAll = /[?&]reveal=all/.test(window.location.search);

  /* ---------- Hero line reveal on load ---------- */
  function markLoaded() {
    document.body.classList.add("is-loaded");
  }
  if (revealAll) {
    // Preview/screenshot mode: render the final state immediately, no transitions
    document.body.classList.add("preview");
    markLoaded();
  } else if (document.readyState === "complete") {
    markLoaded();
  } else {
    window.addEventListener("load", markLoaded);
    // Fallback so content never stays hidden if load stalls
    setTimeout(markLoaded, 1200);
  }

  /* ---------- Header border after scroll + progress bar ---------- */
  var header = document.getElementById("siteHeader");
  var progressBar = document.getElementById("scrollProgressBar");
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle("is-scrolled", y > 8);

      if (progressBar) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var pct = max > 0 ? Math.min(y / max, 1) : 0;
        progressBar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

  function closeNav() {
    if (!navToggle || !siteNav) return;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    siteNav.classList.remove("is-open");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", open ? "false" : "true");
      navToggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      siteNav.classList.toggle("is-open", !open);
    });

    siteNav.addEventListener("click", function (e) {
      if (e.target && e.target.tagName === "A") closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Active section highlight in nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      return id && id.charAt(0) === "#" ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          navLinks.forEach(function (link) {
            var active = link.getAttribute("href") === id;
            link.classList.toggle("is-active", active);
            if (active) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- Reveal on scroll (play once, staggered groups) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function showAllReveals() {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  if (reduceMotion || revealAll || !("IntersectionObserver" in window)) {
    showAllReveals();
  } else {
    // Stagger cards that share a parent grid
    var staggerParents = document.querySelectorAll(
      ".about-cards, .project-grid, .skill-groups, .edu-grid, .timeline, .top-skills"
    );
    Array.prototype.forEach.call(staggerParents, function (parent) {
      var kids = parent.querySelectorAll(":scope > .reveal");
      Array.prototype.forEach.call(kids, function (kid, i) {
        kid.style.setProperty("--reveal-delay", Math.min(i * 70, 420) + "ms");
      });
    });

    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target); // play once
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Animated number counters (run once) ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll(".count"));

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1100;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    window.requestAnimationFrame(step);
  }

  if (revealAll) {
    counters.forEach(function (el) {
      el.textContent = (parseInt(el.getAttribute("data-count"), 10) || 0) + (el.getAttribute("data-suffix") || "");
    });
  } else if ("IntersectionObserver" in window && counters.length) {
    var countObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Skill bars fill once on reveal ---------- */
  var fills = Array.prototype.slice.call(document.querySelectorAll(".skill-fill"));

  function fillBar(el) {
    var level = el.getAttribute("data-level") || "0";
    el.style.width = level + "%";
  }

  if (revealAll) {
    fills.forEach(fillBar);
  } else if ("IntersectionObserver" in window && fills.length) {
    var barObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            fillBar(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    fills.forEach(function (el) { barObserver.observe(el); });
  } else {
    fills.forEach(fillBar);
  }

  /* ---------- Project filter tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".filter-tab"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var filter = tab.getAttribute("data-filter") || "all";

      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-pressed", active ? "true" : "false");
      });

      cards.forEach(function (card) {
        var category = card.getAttribute("data-category");
        var show = filter === "all" || category === filter;
        card.hidden = !show;
        if (show) card.classList.add("is-visible");
      });
    });
  });

  /* ---------- Magnetic effect — main CTA only ---------- */
  var magnetic = document.getElementById("magneticCta");
  if (magnetic && finePointer && !reduceMotion) {
    var strength = 0.28;
    magnetic.addEventListener("mousemove", function (e) {
      var rect = magnetic.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      magnetic.style.transform =
        "translate(" + (x * strength).toFixed(1) + "px," + (y * strength).toFixed(1) + "px)";
    });
    magnetic.addEventListener("mouseleave", function () {
      magnetic.style.transform = "translate(0,0)";
    });
  }

  /* ---------- Custom cursor (desktop, pointer: fine only) ---------- */
  var dot = document.querySelector(".cursor-dot");
  var ring = document.querySelector(".cursor-ring");

  if (dot && ring && finePointer && !reduceMotion && !revealAll) {
    document.body.classList.add("has-cursor");

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var ringX = mouseX;
    var ringY = mouseY;
    var visible = false;

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px)";
        ringX = mouseX;
        ringY = mouseY;
      }
    });

    document.addEventListener("mouseleave", function () {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    });
    document.addEventListener("mouseenter", function () {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    });

    // Grow the ring over links, buttons and cards
    var hoverTargets = document.querySelectorAll("a, button, summary, .card, .stack-tile");
    Array.prototype.forEach.call(hoverTargets, function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-hover"); });
    });

    (function loop() {
      // Dot follows exactly, ring eases behind (slight lerp)
      dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px)";
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = "translate(" + ringX.toFixed(2) + "px," + ringY.toFixed(2) + "px)";
      window.requestAnimationFrame(loop);
    })();
  }

  /* ---------- Back to top ---------- */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var logo = document.querySelector(".logo");
      if (logo) logo.focus({ preventScroll: true });
    });
  }
})();

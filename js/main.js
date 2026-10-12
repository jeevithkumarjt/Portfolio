/* ============================================================
   Jeevithkumar R — Portfolio interactions
   Vanilla JS only. Motion respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

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

      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      if (progressBar) {
        var pct = max > 0 ? Math.min(y / max, 1) : 0;
        progressBar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
      }
      updateScrollTop(y, max);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Floating scroll-to-top ---------- */
  var scrollTopBtn = document.getElementById("scrollTop");
  var scrollTopArc = scrollTopBtn ? scrollTopBtn.querySelector(".st-arc") : null;

  function updateScrollTop(y, max) {
    if (!scrollTopBtn) return;
    var show = y > 420;
    if (show) {
      if (scrollTopBtn.hasAttribute("hidden")) scrollTopBtn.removeAttribute("hidden");
      scrollTopBtn.classList.add("is-shown");
      if (scrollTopArc && max > 0) {
        var pct = Math.min(y / max, 1);
        scrollTopArc.style.strokeDashoffset = String(100 - pct * 100);
      }
    } else {
      scrollTopBtn.classList.remove("is-shown");
      if (!scrollTopBtn.hasAttribute("hidden")) scrollTopBtn.setAttribute("hidden", "");
    }
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var logo = document.querySelector(".logo");
      if (logo) logo.focus({ preventScroll: true });
    });
  }

  /* ---------- Light / dark theme ---------- */
  var themeToggle = document.getElementById("themeToggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#F4F3F0" : "#0C0C0D");
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("pf-theme", next); } catch (e) {}
    });
  }

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
    var navIndicator = document.querySelector(".nav-indicator");
    var currentLink = null;
    var moveIndicator = function (link) {
      currentLink = link;
      if (!navIndicator) return;
      if (!link || link.offsetParent === null) {
        navIndicator.style.opacity = "0";
        return;
      }
      navIndicator.style.opacity = "1";
      navIndicator.style.width = link.offsetWidth + "px";
      navIndicator.style.transform = "translateX(" + link.offsetLeft + "px)";
    };
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
              moveIndicator(link);
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) { sectionObserver.observe(section); });
    window.addEventListener("resize", function () { moveIndicator(currentLink); });
  }

  /* ---------- Experience timeline: growing line + filling nodes ---------- */
  var timeline = document.querySelector(".timeline");
  var tlProgress = document.querySelector(".timeline-progress");
  var tlItems = Array.prototype.slice.call(document.querySelectorAll(".exp-item"));
  var viewTimeline = "CSS" in window && window.CSS.supports &&
    window.CSS.supports("animation-timeline: view()");

  function paintTlNodes() {
    var vh = window.innerHeight || 800;
    tlItems.forEach(function (it) {
      var b = it.getBoundingClientRect();
      it.classList.toggle("is-past", b.top < vh * 0.6 && b.bottom > 0);
    });
  }

  if (timeline && tlProgress && !reduceMotion && !revealAll) {
    if (!viewTimeline) {
      var tlTicking = false;
      var paintTlLine = function () {
        tlTicking = false;
        var r = timeline.getBoundingClientRect();
        var vh = window.innerHeight || 800;
        var p = (vh * 0.85 - r.top) / (r.height || 1);
        p = Math.max(0, Math.min(1, p));
        tlProgress.style.transform = "scaleY(" + p.toFixed(3) + ")";
        paintTlNodes();
      };
      var onTlScroll = function () {
        if (!tlTicking) {
          tlTicking = true;
          window.requestAnimationFrame(paintTlLine);
        }
      };
      window.addEventListener("scroll", onTlScroll, { passive: true });
      window.addEventListener("resize", onTlScroll);
      paintTlLine();
    } else {
      var nodeTicking = false;
      var onNodeScroll = function () {
        if (!nodeTicking) {
          nodeTicking = true;
          window.requestAnimationFrame(function () {
            nodeTicking = false;
            paintTlNodes();
          });
        }
      };
      window.addEventListener("scroll", onNodeScroll, { passive: true });
      window.addEventListener("resize", onNodeScroll);
      paintTlNodes();
    }
  }
  /* ---------- Reveal on scroll (play once, staggered groups) ---------- */
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll(".reveal, .mask-context, .section-rule")
  );

  function showAllReveals() {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  if (reduceMotion || revealAll || !("IntersectionObserver" in window)) {
    showAllReveals();
  } else {
    // Stagger cards that share a parent grid
    var staggerParents = document.querySelectorAll(
      ".about-cards, .project-grid, .edu-grid, .timeline"
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

  /* ---------- Project filter tabs (indicator + view transitions) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".filter-tab"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".project-card"));
  var grid = document.getElementById("projectGrid");
  var tabIndicator = document.querySelector(".filter-tab-indicator");

  cards.forEach(function (card) {
    if (card.id) card.style.viewTransitionName = "card-" + card.id;
  });

  function moveTabIndicator(tab) {
    if (!tabIndicator) return;
    if (!tab || tab.offsetParent === null) {
      tabIndicator.style.opacity = "0";
      return;
    }
    tabIndicator.style.opacity = "1";
    tabIndicator.style.width = tab.offsetWidth + "px";
    tabIndicator.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  function swapCards(filter) {
    cards.forEach(function (card) {
      var category = card.getAttribute("data-category");
      var show = filter === "all" || category === filter;
      card.hidden = !show;
      if (show) card.classList.add("is-visible");
    });
  }

  function applyFilter(filter, tab) {
    tabs.forEach(function (t) {
      var active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-pressed", active ? "true" : "false");
    });
    moveTabIndicator(tab);
    if (!reduceMotion && document.startViewTransition && grid) {
      document.startViewTransition(function () {
        swapCards(filter);
      });
    } else if (!reduceMotion && grid) {
      grid.classList.add("is-switching");
      window.setTimeout(function () {
        swapCards(filter);
        var shown = cards.filter(function (c) { return !c.hidden; });
        shown.forEach(function (c, i) {
          c.style.transitionDelay = (i * 60) + "ms";
        });
        grid.classList.remove("is-switching");
        window.setTimeout(function () {
          shown.forEach(function (c) { c.style.transitionDelay = ""; });
        }, 600);
      }, 150);
    } else {
      swapCards(filter);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      applyFilter(tab.getAttribute("data-filter") || "all", tab);
    });
  });
  window.addEventListener("resize", function () {
    moveTabIndicator(document.querySelector(".filter-tab.is-active"));
  });
  moveTabIndicator(document.querySelector(".filter-tab.is-active"));

  /* ---------- Skill system map: layer panels ---------- */
  var layerBtns = Array.prototype.slice.call(document.querySelectorAll(".sys-layer"));
  var layerPanels = Array.prototype.slice.call(document.querySelectorAll("[data-layer-panel]"));
  var plate = document.querySelector(".layer-panels");
  var plateTitle = document.getElementById("plateTitle");
  var plateCount = document.getElementById("plateCount");
  var plateNotch = document.getElementById("plateNotch");
  var LAYER_ORDER = ["client", "api", "ai", "data", "infra", "growth"];
  var LAYER_SHORT = { client: "CLIENT", api: "API", ai: "AI LAYER",
    data: "DATA", infra: "INFRASTRUCTURE", growth: "INTEGRATIONS AND GROWTH" };
  var currentLayer = null;
  var switchToken = 0;

  function plateHeader(name) {
    var idx = layerIndex(name);
    if (plateTitle) {
      plateTitle.textContent = "LAYER " + ("0" + (idx + 1)).slice(-2) + " · " + (LAYER_SHORT[name] || name.toUpperCase());
    }
    if (plateCount) {
      var panel = layerPanels.filter(function (p) {
        return p.getAttribute("data-layer-panel") === name;
      })[0];
      var n = panel ? panel.querySelectorAll("[data-skill]").length : 0;
      plateCount.textContent = n + " skills";
    }
    moveNotch(name);
  }

  function showPanelInstant(name, focusPanel) {
    layerPanels.forEach(function (panel) {
      var show = panel.getAttribute("data-layer-panel") === name;
      if (show) {
        panel.removeAttribute("hidden");
        if (focusPanel) panel.setAttribute("tabindex", "-1");
      } else {
        panel.setAttribute("hidden", "");
      }
    });
  }

  function activateLayer(name, focusPanel, fromName) {
    var animated = !reduceMotion && !revealAll && fromName && fromName !== name && currentLayer !== null;
    layerBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-layer") === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-expanded", active ? "true" : "false");
    });
    if (!animated) {
      showPanelInstant(name, focusPanel);
      currentLayer = name;
      plateHeader(name);
      return;
    }
    var dir = layerIndex(name) >= layerIndex(fromName) ? 1 : -1;
    var my = ++switchToken;
    var oldPanel = layerPanels.filter(function (p) {
      return p.getAttribute("data-layer-panel") === fromName;
    })[0];
    var newPanel = layerPanels.filter(function (p) {
      return p.getAttribute("data-layer-panel") === name;
    })[0];
    travelTo(fromName, name);
    plateHeader(name);
    if (oldPanel) {
      var oldTiles = oldPanel.querySelectorAll(".tile");
      Array.prototype.forEach.call(oldTiles, function (t) {
        t.style.setProperty("--tx", (8 * dir) + "px");
        t.classList.add("tile-leave");
      });
    }
    window.setTimeout(function () {
      if (my !== switchToken) return;
      showPanelInstant(name, focusPanel);
      currentLayer = name;
      var fresh = newPanel ? newPanel.querySelectorAll(".tile") : [];
      Array.prototype.forEach.call(fresh, function (t, i) {
        t.style.setProperty("--tx", (12 * dir) + "px");
        t.classList.add("tile-enter");
      });
      if (plate) {
        plate.style.height = plate.offsetHeight + "px";
        void plate.offsetHeight;
        plate.style.height = plate.scrollHeight + "px";
        window.setTimeout(function () {
          if (my === switchToken && plate) plate.style.height = "";
        }, 360);
      }
      Array.prototype.forEach.call(fresh, function (t, i) {
        window.setTimeout(function () {
          if (my !== switchToken) return;
          t.classList.add("go");
          window.setTimeout(function () {
            t.classList.remove("tile-enter", "go");
            t.style.removeProperty("--tx");
          }, 420);
        }, i * 40);
      });
      if (oldPanel) {
        Array.prototype.forEach.call(oldPanel.querySelectorAll(".tile-leave"), function (t) {
          t.classList.remove("tile-leave");
          t.style.removeProperty("--tx");
        });
      }
    }, 150);
  }

  if (layerBtns.length && layerPanels.length) {
    // No-JS shows every panel; with JS, start on the first layer only
    activateLayer(layerBtns[0].getAttribute("data-layer"), false);
    layerBtns.forEach(function (btn, bi) {
      var name = btn.getAttribute("data-layer");
      btn.addEventListener("click", function () { activateLayer(name, false, currentLayer); });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateLayer(name, false, currentLayer);
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          var n = layerBtns[(bi + 1) % layerBtns.length];
          n.focus();
          activateLayer(n.getAttribute("data-layer"), false, currentLayer);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          var p = layerBtns[(bi - 1 + layerBtns.length) % layerBtns.length];
          p.focus();
          activateLayer(p.getAttribute("data-layer"), false, currentLayer);
        } else if (e.key === "Home") {
          e.preventDefault();
          layerBtns[0].focus();
          activateLayer(layerBtns[0].getAttribute("data-layer"), false, currentLayer);
        } else if (e.key === "End") {
          e.preventDefault();
          var l = layerBtns[layerBtns.length - 1];
          l.focus();
          activateLayer(l.getAttribute("data-layer"), false, currentLayer);
        }
      });
    });
    window.addEventListener("resize", function () { moveNotch(currentLayer); });
  }

    /* ---------- Brand logos (simple-icons paths, progressive enhancement) ---------- */
  var LOGOS = {
    html: '<title>HTML5</title><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>',
    css: '<title>CSS</title><path d="M0 0v20.16A3.84 3.84 0 0 0 3.84 24h16.32A3.84 3.84 0 0 0 24 20.16V3.84A3.84 3.84 0 0 0 20.16 0Zm14.256 13.08c1.56 0 2.28 1.08 2.304 2.64h-1.608c.024-.288-.048-.6-.144-.84-.096-.192-.288-.264-.552-.264-.456 0-.696.264-.696.84-.024.576.288.888.768 1.08.72.288 1.608.744 1.92 1.296q.432.648.432 1.656c0 1.608-.912 2.592-2.496 2.592-1.656 0-2.4-1.032-2.424-2.688h1.68c0 .792.264 1.176.792 1.176.264 0 .456-.072.552-.24.192-.312.24-1.176-.048-1.512-.312-.408-.912-.6-1.32-.816q-.828-.396-1.224-.936c-.24-.36-.36-.888-.36-1.536 0-1.44.936-2.472 2.424-2.448m5.4 0c1.584 0 2.304 1.08 2.328 2.64h-1.608c0-.288-.048-.6-.168-.84-.096-.192-.264-.264-.528-.264-.48 0-.72.264-.72.84s.288.888.792 1.08c.696.288 1.608.744 1.92 1.296.264.432.408.984.408 1.656.024 1.608-.888 2.592-2.472 2.592-1.68 0-2.424-1.056-2.448-2.688h1.68c0 .744.264 1.176.792 1.176.264 0 .456-.072.552-.24.216-.312.264-1.176-.048-1.512-.288-.408-.888-.6-1.32-.816-.552-.264-.96-.576-1.2-.936s-.36-.888-.36-1.536c-.024-1.44.912-2.472 2.4-2.448m-11.031.018c.711-.006 1.419.198 1.839.63.432.432.672 1.128.648 1.992H9.336c.024-.456-.096-.792-.432-.96-.312-.144-.768-.048-.888.24-.12.264-.192.576-.168.864v3.504c0 .744.264 1.128.768 1.128a.65.65 0 0 0 .552-.264c.168-.24.192-.552.168-.84h1.776c.096 1.632-.984 2.712-2.568 2.688-1.536 0-2.496-.864-2.472-2.472v-4.032c0-.816.24-1.44.696-1.848.432-.408 1.146-.624 1.857-.63"/>',
    javascript: '<title>JavaScript</title><path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>',
    typescript: '<path fill="currentColor" d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>',
    react: '<path fill="currentColor" d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/>',
    nextjs: '<path fill="currentColor" d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z"/>',
    tailwind: '<title>Tailwind CSS</title><path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>',
    bootstrap: '<title>Bootstrap</title><path d="M11.77 11.24H9.956V8.202h2.152c1.17 0 1.834.522 1.834 1.466 0 1.008-.773 1.572-2.174 1.572zm.324 1.206H9.957v3.348h2.231c1.459 0 2.232-.585 2.232-1.685s-.795-1.663-2.326-1.663zM24 11.39v1.218c-1.128.108-1.817.944-2.226 2.268-.407 1.319-.463 2.937-.42 4.186.045 1.3-.968 2.5-2.337 2.5H4.985c-1.37 0-2.383-1.2-2.337-2.5.043-1.249-.013-2.867-.42-4.186-.41-1.324-1.1-2.16-2.228-2.268V11.39c1.128-.108 1.819-.944 2.227-2.268.408-1.319.464-2.937.42-4.186-.045-1.3.968-2.5 2.338-2.5h14.032c1.37 0 2.382 1.2 2.337 2.5-.043 1.249.013 2.867.42 4.186.409 1.324 1.098 2.16 2.226 2.268zm-7.927 2.817c0-1.354-.953-2.333-2.368-2.488v-.057c1.04-.169 1.856-1.135 1.856-2.213 0-1.537-1.213-2.538-3.062-2.538h-4.16v10.172h4.181c2.218 0 3.553-1.086 3.553-2.876z"/>',
    jquery: '<title>jQuery</title><path d="M1.525 5.87c-2.126 3.054-1.862 7.026-.237 10.269.037.079.078.154.118.229.023.052.049.1.077.15.013.027.031.056.047.082.026.052.054.102.081.152l.157.266c.03.049.057.097.09.146.056.094.12.187.178.281.026.04.05.078.079.117a6.368 6.368 0 00.31.445c.078.107.156.211.24.315.027.038.058.076.086.115l.22.269c.028.03.055.067.084.099.098.118.202.233.306.35l.005.006a3.134 3.134 0 00.425.44c.08.083.16.165.245.245l.101.097c.111.105.223.209.34.309.002 0 .003.002.005.003l.057.05c.102.089.205.178.31.26l.125.105c.085.068.174.133.26.2l.137.105c.093.07.192.139.287.207.035.025.07.05.106.073l.03.023.28.185.12.08c.148.094.294.184.44.272.041.02.084.044.123.068.108.062.22.125.329.183.06.034.122.063.184.094.075.042.153.083.234.125a.324.324 0 01.056.023c.033.015.064.031.096.047.12.06.245.118.375.175.024.01.05.02.076.034.144.063.289.123.438.182.034.01.07.027.105.04.135.051.274.103.411.152l.05.018c.154.052.305.102.46.15.036.01.073.023.111.033.16.048.314.105.474.137 10.273 1.872 13.258-6.177 13.258-6.177-2.508 3.266-6.958 4.127-11.174 3.169-.156-.036-.312-.086-.47-.132a13.539 13.539 0 01-.567-.182l-.062-.024c-.136-.046-.267-.097-.4-.148a1.615 1.615 0 00-.11-.04c-.148-.06-.29-.121-.433-.184-.031-.01-.057-.024-.088-.036a23.44 23.44 0 01-.362-.17 1.485 1.485 0 01-.106-.052c-.094-.044-.188-.095-.28-.143a3.947 3.947 0 01-.187-.096c-.114-.06-.227-.125-.34-.187-.034-.024-.073-.044-.112-.066a15.922 15.922 0 01-.439-.27 2.107 2.107 0 01-.118-.078 6.01 6.01 0 01-.312-.207c-.035-.023-.067-.048-.103-.073a9.553 9.553 0 01-.295-.212c-.042-.034-.087-.066-.132-.1-.088-.07-.177-.135-.265-.208l-.118-.095a10.593 10.593 0 01-.335-.28.258.258 0 00-.037-.031l-.347-.316-.1-.094c-.082-.084-.166-.164-.25-.246l-.098-.1a9.081 9.081 0 01-.309-.323l-.015-.016c-.106-.116-.21-.235-.313-.355-.027-.03-.053-.064-.08-.097l-.227-.277a21.275 21.275 0 01-.34-.449C2.152 11.79 1.306 7.384 3.177 3.771m4.943-.473c-1.54 2.211-1.454 5.169-.254 7.508a9.111 9.111 0 00.678 1.133c.23.33.484.721.793.988.107.122.223.24.344.36l.09.09c.114.11.232.217.35.325l.016.013a9.867 9.867 0 00.414.342c.034.023.063.05.096.073.14.108.282.212.428.316l.015.009c.062.045.128.086.198.13.028.018.06.042.09.06.106.068.21.132.318.197.017.007.032.016.048.023.09.055.188.108.282.157.033.02.065.035.1.054.066.033.132.068.197.102l.032.014c.135.067.273.129.408.19.034.014.063.025.092.039.111.048.224.094.336.137.05.017.097.037.144.052.102.038.21.073.31.108l.14.045c.147.045.295.104.449.13C22.164 17.206 24 11.098 24 11.098c-1.653 2.38-4.852 3.513-8.261 2.628a8.04 8.04 0 01-.449-.13c-.048-.014-.09-.029-.136-.043-.104-.036-.211-.07-.312-.109l-.144-.054c-.113-.045-.227-.087-.336-.135-.034-.015-.065-.025-.091-.04-.14-.063-.281-.125-.418-.192l-.206-.107-.119-.06a5.673 5.673 0 01-.265-.15.62.62 0 01-.062-.035c-.106-.066-.217-.13-.318-.198-.034-.019-.065-.042-.097-.062l-.208-.136c-.144-.1-.285-.208-.428-.313-.032-.029-.063-.053-.094-.079-1.499-1.178-2.681-2.79-3.242-4.613-.59-1.897-.46-4.023.56-5.75m4.292-.147c-.909 1.334-.996 2.99-.37 4.46.665 1.563 2.024 2.79 3.608 3.37.065.025.128.046.196.07l.088.027c.092.03.185.063.28.084 4.381.845 5.567-2.25 5.886-2.704-1.043 1.498-2.792 1.857-4.938 1.335a4.85 4.85 0 01-.516-.16 6.352 6.352 0 01-.618-.254 6.53 6.53 0 01-1.082-.66c-1.922-1.457-3.113-4.236-1.859-6.5"/>',
    python: '<path fill="currentColor" d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>',
    fastapi: '<path fill="currentColor" d="M12 .0387C5.3729.0384.0003 5.3931 0 11.9988c-.001 6.6066 5.372 11.9628 12 11.9625 6.628.0003 12.001-5.3559 12-11.9625-.0003-6.6057-5.3729-11.9604-12-11.96m-.829 5.4153h7.55l-7.5805 5.3284h5.1828L5.279 18.5436q2.9466-6.5444 5.892-13.0896"/>',
    nodejs: '<title>Node.js</title><path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"/>',
    php: '<title>PHP</title><path d="M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.802-.124-.995-.175-.193-.523-.29-1.047-.29zM12 5.688C5.373 5.688 0 8.514 0 12s5.373 6.313 12 6.313S24 15.486 24 12c0-3.486-5.373-6.312-12-6.312zm-3.26 7.451c-.261.25-.575.438-.917.551-.336.108-.765.164-1.285.164H5.357l-.327 1.681H3.652l1.23-6.326h2.65c.797 0 1.378.209 1.744.628.366.418.476 1.002.33 1.752a2.836 2.836 0 0 1-.305.847c-.143.255-.33.49-.561.703zm4.024.715l.543-2.799c.063-.318.039-.536-.068-.651-.107-.116-.336-.174-.687-.174H11.46l-.704 3.625H9.388l1.23-6.327h1.367l-.327 1.682h1.218c.767 0 1.295.134 1.586.401s.378.7.263 1.299l-.572 2.944h-1.389zm7.597-2.265a2.782 2.782 0 0 1-.305.847c-.143.255-.33.49-.561.703a2.44 2.44 0 0 1-.917.551c-.336.108-.765.164-1.286.164h-1.18l-.327 1.682h-1.378l1.23-6.326h2.649c.797 0 1.378.209 1.744.628.366.417.477 1.001.331 1.751zM17.766 10.207h-.943l-.516 2.648h.838c.557 0 .971-.105 1.242-.314.272-.21.455-.559.551-1.049.092-.47.049-.802-.125-.995s-.524-.29-1.047-.29z"/>',
    laravel: '<title>Laravel</title><path d="M23.642 5.43a.364.364 0 01.014.1v5.149c0 .135-.073.26-.189.326l-4.323 2.49v4.934a.378.378 0 01-.188.326L9.93 23.949a.316.316 0 01-.066.027c-.008.002-.016.008-.024.01a.348.348 0 01-.192 0c-.011-.002-.02-.008-.03-.012-.02-.008-.042-.014-.062-.025L.533 18.755a.376.376 0 01-.189-.326V2.974c0-.033.005-.066.014-.098.003-.012.01-.02.014-.032a.369.369 0 01.023-.058c.004-.013.015-.022.023-.033l.033-.045c.012-.01.025-.018.037-.027.014-.012.027-.024.041-.034H.53L5.043.05a.375.375 0 01.375 0L9.93 2.647h.002c.015.01.027.021.04.033l.038.027c.013.014.02.03.033.045.008.011.02.021.025.033.01.02.017.038.024.058.003.011.01.021.013.032.01.031.014.064.014.098v9.652l3.76-2.164V5.527c0-.033.004-.066.013-.098.003-.01.01-.02.013-.032a.487.487 0 01.024-.059c.007-.012.018-.02.025-.033.012-.015.021-.03.033-.043.012-.012.025-.02.037-.028.014-.01.026-.023.041-.032h.001l4.513-2.598a.375.375 0 01.375 0l4.513 2.598c.016.01.027.021.042.031.012.01.025.018.036.028.013.014.022.03.034.044.008.012.019.021.024.033.011.02.018.04.024.06.006.01.012.021.015.032zm-.74 5.032V6.179l-1.578.908-2.182 1.256v4.283zm-4.51 7.75v-4.287l-2.147 1.225-6.126 3.498v4.325zM1.093 3.624v14.588l8.273 4.761v-4.325l-4.322-2.445-.002-.003H5.04c-.014-.01-.025-.021-.04-.031-.011-.01-.024-.018-.035-.027l-.001-.002c-.013-.012-.021-.025-.031-.04-.01-.011-.021-.022-.028-.036h-.002c-.008-.014-.013-.031-.02-.047-.006-.016-.014-.027-.018-.043a.49.49 0 01-.008-.057c-.002-.014-.006-.027-.006-.041V5.789l-2.18-1.257zM5.23.81L1.47 2.974l3.76 2.164 3.758-2.164zm1.956 13.505l2.182-1.256V3.624l-1.58.91-2.182 1.255v9.435zm11.581-10.95l-3.76 2.163 3.76 2.163 3.759-2.164zm-.376 4.978L16.21 7.087 14.63 6.18v4.283l2.182 1.256 1.58.908zm-8.65 9.654l5.514-3.148 2.756-1.572-3.757-2.163-4.323 2.489-3.941 2.27z"/>',
    docker: '<path fill="currentColor" d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/>',
    linux: '<path fill="currentColor" d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 0 1-.004-.021l-.004-.024a1.807 1.807 0 0 1-.15.706.953.953 0 0 1-.213.335.71.71 0 0 0-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 0 0-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 0 0-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 0 0-.205.334 1.18 1.18 0 0 0-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 0 1-.018-.2v-.02a1.772 1.772 0 0 1 .15-.768c.082-.22.232-.406.43-.533a.985.985 0 0 1 .594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 0 0-.166-.267.248.248 0 0 0-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 0 0-.12.27.944.944 0 0 0-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 0 1-.131.068 2.62 2.62 0 0 1-.275-.402 1.772 1.772 0 0 1-.155-.667 1.759 1.759 0 0 1 .08-.668 1.43 1.43 0 0 1 .283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 0 1 .016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 0 1-.448-.067 3.566 3.566 0 0 1-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 0 0-.402-.533 1.45 1.45 0 0 0-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 0 0 .314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 0 1 .647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 0 1-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/>',
    nginx: '<path fill="currentColor" d="M12 0L1.605 6v12L12 24l10.395-6V6L12 0zm6 16.59c0 .705-.646 1.29-1.529 1.29-.631 0-1.351-.255-1.801-.81l-6-7.141v6.66c0 .721-.57 1.29-1.274 1.29H7.32c-.721 0-1.29-.6-1.29-1.29V7.41c0-.705.63-1.29 1.5-1.29.646 0 1.38.255 1.83.81l5.97 7.141V7.41c0-.721.6-1.29 1.29-1.29h.075c.72 0 1.29.6 1.29 1.29v9.18H18z"/>',
    apache: '<title>Apache</title><path d="M17.805 2.197v.066h.156v.44h.072v-.44h.156v-.066zm.9 0l-.175.353-.172-.353h-.087v.506h.067V2.3l.172.35h.045l.172-.35v.404h.066v-.506zm-4.257 1c-.204.31-.424.66-.66 1.06l-.04.062a44.457 44.457 0 00-1.265 2.29c-.187.36-.38.742-.577 1.146l2.267-.25c.66-.302.955-.578 1.242-.976a15.5 15.5 0 00.23-.342c.23-.363.46-.763.663-1.16.197-.386.37-.767.505-1.11.083-.22.15-.422.198-.6.042-.158.074-.307.1-.45-.884.15-1.965.295-2.668.33zM11.894 7.78l-.077.16c-.078.16-.157.32-.236.488-.086.18-.172.364-.26.552l-.132.287a75.265 75.265 0 00-1.427 3.3c-.163.397-.327.807-.493 1.23-.15.38-.297.765-.45 1.164l-.02.06c-.15.396-.3.802-.453 1.22l-.01.027.72-.08a.213.213 0 01-.042-.006c.863-.106 2.01-.75 2.75-1.547.342-.367.652-.8.94-1.306.213-.377.413-.795.604-1.258.168-.405.328-.843.48-1.318-.196.105-.423.18-.673.235a2.184 2.184 0 01-.273.046c.806-.31 1.314-.905 1.683-1.64a2.816 2.816 0 01-.968.428c-.06.012-.116.022-.174.03l-.043.006h.002c.278-.118.514-.248.718-.403a2.571 2.571 0 00.637-.698l.063-.104.077-.154a8.107 8.107 0 00.367-.85l.03-.088a3.04 3.04 0 00.123-.463.733.733 0 01-.094.065c-.243.145-.66.277-.996.34l.663-.074-.664.073h-.017l-.1.017c.006-.003.01-.006.017-.008l-2.265.25-.013.022zM8.27 16.45c-.117.323-.236.654-.355.992l-.005.015c-.016.046-.032.094-.05.142-.08.227-.15.432-.31.9.264.12.475.435.675.793a1.44 1.44 0 00-.466-.99c1.293.06 2.41-.27 2.99-1.217.05-.084.096-.173.14-.268-.26.333-.59.474-1.2.44 0 0-.004 0-.005.002l.004-.002c.9-.404 1.354-.79 1.754-1.433.094-.153.186-.32.28-.503-.788.81-1.702 1.04-2.664.865l-.72.078a6.43 6.43 0 00-.067.183zM15.42.112c-.376.222-1 .85-1.748 1.763l.686 1.294c.48-.687.97-1.307 1.462-1.836l.058-.062c-.02.02-.04.04-.057.062-.16.176-.644.74-1.375 1.863.703-.035 1.784-.18 2.666-.33.262-1.47-.258-2.142-.258-2.142s-.66-1.07-1.436-.61zm-3.084 6.402a40.253 40.253 0 011.306-2.26l.04-.064c.224-.352.45-.693.677-1.02l-.685-1.293-.157.192c-.197.245-.403.51-.613.79a39.853 39.853 0 00-2.016 2.97l-.022.038.893 1.763c.19-.378.38-.752.575-1.118zm-3.73 8.32c.158-.406.319-.81.483-1.225.156-.394.32-.79.484-1.19a91.133 91.133 0 011.6-3.604l.205-.424c.12-.243.237-.485.36-.724a.125.125 0 01.02-.04l-.895-1.763-.044.07c-.207.34-.414.687-.617 1.042a38.056 38.056 0 00-1.092 2.04l-.094.193a24.573 24.573 0 00-1.258 3.087 18.492 18.492 0 00-.52 1.997l.896 1.77c.117-.317.24-.638.364-.963zm-1.376-.476a13.38 13.38 0 00-.234 1.692c0 .02-.004.04-.005.06-.28-.45-1.03-.888-1.026-.884.537.778.944 1.55 1.005 2.31-.29.058-.684-.027-1.14-.195.475.436.83.556.97.588-.434.03-.89.328-1.346.67.668-.27 1.21-.38 1.596-.29-.61 1.74-1.23 3.655-1.843 5.69a.538.538 0 00.364-.354c.11-.368.84-2.786 1.978-5.965l.097-.27.028-.078c.12-.332.246-.672.374-1.02l.09-.237v-.004L7.24 14.3c-.003.02-.01.04-.012.06z"/>',
    gcp: '<path fill="currentColor" d="M12.19 2.38a9.344 9.344 0 0 0-9.234 6.893c.053-.02-.055.013 0 0-3.875 2.551-3.922 8.11-.247 10.941l.006-.007-.007.03a6.717 6.717 0 0 0 4.077 1.356h5.173l.03.03h5.192c6.687.053 9.376-8.605 3.835-12.35a9.365 9.365 0 0 0-2.821-4.552l-.043.043.006-.05A9.344 9.344 0 0 0 12.19 2.38zm-.358 4.146c1.244-.04 2.518.368 3.486 1.15a5.186 5.186 0 0 1 1.862 4.078v.518c3.53-.07 3.53 5.262 0 5.193h-5.193l-.008.009v-.04H6.785a2.59 2.59 0 0 1-1.067-.23h.001a2.597 2.597 0 1 1 3.437-3.437l3.013-3.012A6.747 6.747 0 0 0 8.11 8.24c.018-.01.04-.026.054-.023a5.186 5.186 0 0 1 3.67-1.69z"/>',
    git: '<path fill="currentColor" d="M13.09 23.549a1.54 1.54 0 0 1-2.18 0L.451 13.089a1.54 1.54 0 0 1 0-2.179l7.191-7.19 2.733 2.733a1.85 1.85 0 0 0 .964 2.326v6.66a1.849 1.849 0 1 0 1.54 0V8.957l2.508 2.508a1.85 1.85 0 1 0 1.09-1.09l-2.634-2.634a1.85 1.85 0 0 0-2.378-2.377L8.73 2.63 10.91.451a1.54 1.54 0 0 1 2.179 0l10.459 10.46a1.54 1.54 0 0 1 0 2.179z"/>',
    github: '<path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
    postgresql: '<path fill="currentColor" d="M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126zm6.0072 5.0871c-.1711-.0428-.3271-.1132-.4322-.1772.0889-.0394.2374-.0902.4833-.1409 1.2833-.2641 1.4815-.4506 1.9143-1.0002.0992-.126.2116-.2687.3673-.4426a.3549.3549 0 0 0 .0737-.1298c.1708-.1513.2724-.1099.4369-.0417.156.0646.3078.26.3695.4752.0291.1016.0619.2945-.0452.4444-.9043 1.2658-2.2216 1.2494-3.1676 1.0128zm2.094-3.988-.0525.141c-.133.3566-.2567.6881-.3334 1.003-.6674-.0021-1.3168-.2872-1.8105-.8024-.6279-.6551-.9131-1.5664-.7825-2.5004.1828-1.3079.1153-2.4468.079-3.0586-.005-.0857-.0095-.1607-.0122-.2199.2957-.2621 1.6659-.9962 2.6429-.7724.4459.1022.7176.4057.8305.928.5846 2.7038.0774 3.8307-.3302 4.7363-.084.1866-.1633.3629-.2311.5454zm7.3637 4.5725c-.0169.1768-.0358.376-.0618.5959l-.146.4383a.3547.3547 0 0 0-.0182.1077c-.0059.4747-.054.6489-.115.8693-.0634.2292-.1353.4891-.1794 1.0575-.11 1.4143-.8782 2.2267-2.4172 2.5565-1.5155.3251-1.7843-.4968-2.0212-1.2217a6.5824 6.5824 0 0 0-.0769-.2266c-.2154-.5858-.1911-1.4119-.1574-2.5551.0165-.5612-.0249-1.9013-.3302-2.6462.0044-.2932.0106-.5909.019-.8918a.3529.3529 0 0 0-.0153-.1126 1.4927 1.4927 0 0 0-.0439-.208c-.1226-.4283-.4213-.7866-.7797-.9351-.1424-.059-.4038-.1672-.7178-.0869.067-.276.1831-.5875.309-.9249l.0529-.142c.0595-.16.134-.3257.213-.5012.4265-.9476 1.0106-2.2453.3766-5.1772-.2374-1.0981-1.0304-1.6343-2.2324-1.5098-.7207.0746-1.3799.3654-1.7088.5321a5.6716 5.6716 0 0 0-.1958.1041c.0918-1.1064.4386-3.1741 1.7357-4.4823a4.0306 4.0306 0 0 1 .3033-.276.3532.3532 0 0 0 .1447-.0644c.7524-.5706 1.6945-.8506 2.802-.8325.4091.0067.8017.0339 1.1742.081 1.939.3544 3.2439 1.4468 4.0359 2.3827.8143.9623 1.2552 1.9315 1.4312 2.4543-1.3232-.1346-2.2234.1268-2.6797.779-.9926 1.4189.543 4.1729 1.2811 5.4964.1353.2426.2522.4522.2889.5413.2403.5825.5515.9713.7787 1.2552.0696.087.1372.1714.1885.245-.4008.1155-1.1208.3825-1.0552 1.717-.0123.1563-.0423.4469-.0834.8148-.0461.2077-.0702.4603-.0994.7662zm.8905-1.6211c-.0405-.8316.2691-.9185.5967-1.0105a2.8566 2.8566 0 0 0 .135-.0406 1.202 1.202 0 0 0 .1342.103c.5703.3765 1.5823.4213 3.0068.1344-.2016.1769-.5189.3994-.9533.6011-.4098.1903-1.0957.333-1.7473.3636-.7197.0336-1.0859-.0807-1.1721-.151zm.5695-9.2712c-.0059.3508-.0542.6692-.1054 1.0017-.055.3576-.112.7274-.1264 1.1762-.0142.4368.0404.8909.0932 1.3301.1066.887.216 1.8003-.2075 2.7014a3.5272 3.5272 0 0 1-.1876-.3856c-.0527-.1276-.1669-.3326-.3251-.6162-.6156-1.1041-2.0574-3.6896-1.3193-4.7446.3795-.5427 1.3408-.5661 2.1781-.463zm.2284 7.0137a12.3762 12.3762 0 0 0-.0853-.1074l-.0355-.0444c.7262-1.1995.5842-2.3862.4578-3.4385-.0519-.4318-.1009-.8396-.0885-1.2226.0129-.4061.0666-.7543.1185-1.0911.0639-.415.1288-.8443.1109-1.3505.0134-.0531.0188-.1158.0118-.1902-.0457-.4855-.5999-1.938-1.7294-3.253-.6076-.7073-1.4896-1.4972-2.6889-2.0395.5251-.1066 1.2328-.2035 2.0244-.1859 2.0515.0456 3.6746.8135 4.8242 2.2824a.908.908 0 0 1 .0667.1002c.7231 1.3556-.2762 6.2751-2.9867 10.5405zm-8.8166-6.1162c-.025.1794-.3089.4225-.6211.4225a.5821.5821 0 0 1-.0809-.0056c-.1873-.026-.3765-.144-.5059-.3156-.0458-.0605-.1203-.178-.1055-.2844.0055-.0401.0261-.0985.0925-.1488.1182-.0894.3518-.1226.6096-.0867.3163.0441.6426.1938.6113.4186zm7.9305-.4114c.0111.0792-.049.201-.1531.3102-.0683.0717-.212.1961-.4079.2232a.5456.5456 0 0 1-.075.0052c-.2935 0-.5414-.2344-.5607-.3717-.024-.1765.2641-.3106.5611-.352.297-.0414.6111.0088.6356.1851z"/>',
    mysql: '<title>MySQL</title><path d="M16.405 5.501c-.115 0-.193.014-.274.033v.013h.014c.054.104.146.18.214.273.054.107.1.214.154.32l.014-.015c.094-.066.14-.172.14-.333-.04-.047-.046-.094-.08-.14-.04-.067-.126-.1-.18-.153zM5.77 18.695h-.927a50.854 50.854 0 00-.27-4.41h-.008l-1.41 4.41H2.45l-1.4-4.41h-.01a72.892 72.892 0 00-.195 4.41H0c.055-1.966.192-3.81.41-5.53h1.15l1.335 4.064h.008l1.347-4.064h1.095c.242 2.015.384 3.86.428 5.53zm4.017-4.08c-.378 2.045-.876 3.533-1.492 4.46-.482.716-1.01 1.073-1.583 1.073-.153 0-.34-.046-.566-.138v-.494c.11.017.24.026.386.026.268 0 .483-.075.647-.222.197-.18.295-.382.295-.605 0-.155-.077-.47-.23-.944L6.23 14.615h.91l.727 2.36c.164.536.233.91.205 1.123.4-1.064.678-2.227.835-3.483zm12.325 4.08h-2.63v-5.53h.885v4.85h1.745zm-3.32.135l-1.016-.5c.09-.076.177-.158.255-.25.433-.506.648-1.258.648-2.253 0-1.83-.718-2.746-2.155-2.746-.704 0-1.254.232-1.65.697-.43.508-.646 1.256-.646 2.245 0 .972.19 1.686.574 2.14.35.41.877.615 1.583.615.264 0 .506-.033.725-.098l1.325.772.36-.622zM15.5 17.588c-.225-.36-.337-.94-.337-1.736 0-1.393.424-2.09 1.27-2.09.443 0 .77.167.977.5.224.362.336.936.336 1.723 0 1.404-.424 2.108-1.27 2.108-.445 0-.77-.167-.978-.5zm-1.658-.425c0 .47-.172.856-.516 1.156-.344.3-.803.45-1.384.45-.543 0-1.064-.172-1.573-.515l.237-.476c.438.22.833.328 1.19.328.332 0 .593-.073.783-.22a.754.754 0 00.3-.615c0-.33-.23-.61-.648-.845-.388-.213-1.163-.657-1.163-.657-.422-.307-.632-.636-.632-1.177 0-.45.157-.81.47-1.085.315-.278.72-.415 1.22-.415.512 0 .98.136 1.4.41l-.213.476a2.726 2.726 0 00-1.064-.23c-.283 0-.502.068-.654.206a.685.685 0 00-.248.524c0 .328.234.61.666.85.393.215 1.187.67 1.187.67.433.305.648.63.648 1.168zm9.382-5.852c-.535-.014-.95.04-1.297.188-.1.04-.26.04-.274.167.055.053.063.14.11.214.08.134.218.313.346.407.14.11.28.216.427.31.26.16.555.255.81.416.145.094.293.213.44.313.073.05.12.14.214.172v-.02c-.046-.06-.06-.147-.105-.214-.067-.067-.134-.127-.2-.193a3.223 3.223 0 00-.695-.675c-.214-.146-.682-.35-.77-.595l-.013-.014c.146-.013.32-.066.46-.106.227-.06.435-.047.67-.106.106-.027.213-.06.32-.094v-.06c-.12-.12-.21-.283-.334-.395a8.867 8.867 0 00-1.104-.823c-.21-.134-.476-.22-.697-.334-.08-.04-.214-.06-.26-.127-.12-.146-.19-.34-.275-.514a17.69 17.69 0 01-.547-1.163c-.12-.262-.193-.523-.34-.763-.69-1.137-1.437-1.826-2.586-2.5-.247-.14-.543-.2-.856-.274-.167-.008-.334-.02-.5-.027-.11-.047-.216-.174-.31-.235-.38-.24-1.364-.76-1.644-.072-.18.434.267.862.422 1.082.115.153.26.328.34.5.047.116.06.235.107.356.106.294.207.622.347.897.073.14.153.287.247.413.054.073.146.107.167.227-.094.136-.1.334-.154.5-.24.757-.146 1.693.194 2.25.107.166.362.534.703.393.3-.12.234-.5.32-.835.02-.08.007-.133.048-.187v.015c.094.188.188.367.274.555.206.328.566.668.867.895.16.12.287.328.487.402v-.02h-.015c-.043-.058-.1-.086-.154-.133a3.445 3.445 0 01-.35-.4 8.76 8.76 0 01-.747-1.218c-.11-.21-.202-.436-.29-.643-.04-.08-.04-.2-.107-.24-.1.146-.247.273-.32.453-.127.288-.14.642-.188 1.01-.027.007-.014 0-.027.014-.214-.052-.287-.274-.367-.46-.2-.475-.233-1.238-.06-1.785.047-.14.247-.582.167-.716-.042-.127-.174-.2-.247-.303a2.478 2.478 0 01-.24-.427c-.16-.374-.24-.788-.414-1.162-.08-.173-.22-.354-.334-.513-.127-.18-.267-.307-.368-.52-.033-.073-.08-.194-.027-.274.014-.054.042-.075.094-.09.088-.072.335.022.422.062.247.1.455.194.662.334.094.066.195.193.315.226h.14c.214.047.455.014.655.073.355.114.675.28.962.46a5.953 5.953 0 012.085 2.286c.08.154.115.295.188.455.14.33.313.663.455.982.14.315.275.636.476.897.1.14.502.213.682.286.133.06.34.115.46.188.23.14.454.3.67.454.11.076.443.243.463.378z"/>',
    redis: '<path fill="currentColor" d="M22.71 13.145c-1.66 2.092-3.452 4.483-7.038 4.483-3.203 0-4.397-2.825-4.48-5.12.701 1.484 2.073 2.685 4.214 2.63 4.117-.133 6.94-3.852 6.94-7.239 0-4.05-3.022-6.972-8.268-6.972-3.752 0-8.4 1.428-11.455 3.685C2.59 6.937 3.885 9.958 4.35 9.626c2.648-1.904 4.748-3.13 6.784-3.744C8.12 9.244.886 17.05 0 18.425c.1 1.261 1.66 4.648 2.424 4.648.232 0 .431-.133.664-.365a100.49 100.49 0 0 0 5.54-6.765c.222 3.104 1.748 6.898 6.014 6.898 3.819 0 7.604-2.756 9.33-8.965.2-.764-.73-1.361-1.261-.73zm-4.349-5.013c0 1.959-1.926 2.922-3.685 2.922-.941 0-1.664-.247-2.235-.568 1.051-1.592 2.092-3.225 3.21-4.973 1.972.334 2.71 1.43 2.71 2.619z"/>',
    postman: '<title>Postman</title><path d="M13.527.099C6.955-.744.942 3.9.099 10.473c-.843 6.572 3.8 12.584 10.373 13.428 6.573.843 12.587-3.801 13.428-10.374C24.744 6.955 20.101.943 13.527.099zm2.471 7.485a.855.855 0 0 0-.593.25l-4.453 4.453-.307-.307-.643-.643c4.389-4.376 5.18-4.418 5.996-3.753zm-4.863 4.861l4.44-4.44a.62.62 0 1 1 .847.903l-4.699 4.125-.588-.588zm.33.694l-1.1.238a.06.06 0 0 1-.067-.032.06.06 0 0 1 .01-.073l.645-.645.512.512zm-2.803-.459l1.172-1.172.879.878-1.979.426a.074.074 0 0 1-.085-.039.072.072 0 0 1 .013-.093zm-3.646 6.058a.076.076 0 0 1-.069-.083.077.077 0 0 1 .022-.046h.002l.946-.946 1.222 1.222-2.123-.147zm2.425-1.256a.228.228 0 0 0-.117.256l.203.865a.125.125 0 0 1-.211.117h-.003l-.934-.934-.294-.295 3.762-3.758 1.82-.393.874.874c-1.255 1.102-2.971 2.201-5.1 3.268zm5.279-3.428h-.002l-.839-.839 4.699-4.125a.952.952 0 0 0 .119-.127c-.148 1.345-2.029 3.245-3.977 5.091zm3.657-6.46l-.003-.002a1.822 1.822 0 0 1 2.459-2.684l-1.61 1.613a.119.119 0 0 0 0 .169l1.247 1.247a1.817 1.817 0 0 1-2.093-.343zm2.578 0a1.714 1.714 0 0 1-.271.218h-.001l-1.207-1.207 1.533-1.533c.661.72.637 1.832-.054 2.522zM18.855 6.05a.143.143 0 0 0-.053.157.416.416 0 0 1-.053.45.14.14 0 0 0 .023.197.141.141 0 0 0 .084.03.14.14 0 0 0 .106-.05.691.691 0 0 0 .087-.751.138.138 0 0 0-.194-.033z"/>',
    figma: '<title>Figma</title><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z"/>',
    trello: '<title>Trello</title><path d="M21.147 0H2.853A2.86 2.86 0 000 2.853v18.294A2.86 2.86 0 002.853 24h18.294A2.86 2.86 0 0024 21.147V2.853A2.86 2.86 0 0021.147 0zM10.34 17.287a.953.953 0 01-.953.953h-4a.954.954 0 01-.954-.953V5.38a.953.953 0 01.954-.953h4a.954.954 0 01.953.953zm9.233-5.467a.944.944 0 01-.953.947h-4a.947.947 0 01-.953-.947V5.38a.953.953 0 01.953-.953h4a.954.954 0 01.953.953z"/>',
    cursor: '<title>Cursor</title><path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/>',
    claude: '<title>Claude</title><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>',
    huggingface: '<title>Hugging Face</title><path d="M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.5 1.5 0 0 1 .713.174 1.487 1.487 0 0 1 .617 2.013c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 .617-2.013 1.5 1.5 0 0 1 .713-.174m-10.68 1.55a.96.96 0 1 1 0 1.921.96.96 0 0 1 0-1.92m13.838 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32q-.011.001-.02.006l-.044.026-.01.008-.03.024q-.018.017-.035.036l-.032.04a1 1 0 0 0-.058.09l-.014.025q-.049.088-.11.19a1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.173.18q-.035.029-.075.058a1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022q-.094.03-.216.087-.06.028-.125.063l-.13.074q-.067.04-.136.086a3 3 0 0 0-.135.096 3 3 0 0 0-.26.219 2 2 0 0 0-.12.121 2 2 0 0 0-.106.128l-.002.002a2 2 0 0 0-.09.132l-.001.001a1.2 1.2 0 0 0-.105.212q-.013.036-.024.073c-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454m.836 10.354c.824-1.19.766-2.082-.365-3.194-1.13-1.112-1.789-2.738-1.789-2.738s-.246-.945-.806-.858-.97 1.499.202 2.362c1.173.864-.233 1.45-.685.64-.45-.812-1.683-2.896-2.322-3.295s-1.089-.175-.938.647 2.822 2.813 2.562 3.244-1.176-.506-1.176-.506-2.866-2.567-3.49-1.898.473 1.23 2.037 2.16c1.564.932 1.686 1.178 1.464 1.53s-3.675-2.511-4-1.297c-.323 1.214 3.524 1.567 3.287 2.405-.238.839-2.71-1.587-3.216-.642-.506.946 3.49 2.056 3.522 2.064 1.29.33 4.568 1.028 5.713-.624m5.349 0c-.824-1.19-.766-2.082.365-3.194 1.13-1.112 1.789-2.738 1.789-2.738s.246-.945.806-.858.97 1.499-.202 2.362c-1.173.864.233 1.45.685.64.451-.812 1.683-2.896 2.322-3.295s1.089-.175.938.647-2.822 2.813-2.562 3.244 1.176-.506 1.176-.506 2.866-2.567 3.49-1.898-.473 1.23-2.037 2.16c-1.564.932-1.686 1.178-1.464 1.53s3.675-2.511 4-1.297c.323 1.214-3.524 1.567-3.287 2.405.238.839 2.71-1.587 3.216-.642.506.946-3.49 2.056-3.522 2.064-1.29.33-4.568 1.028-5.713-.624"/>',
    ollama: '<title>Ollama</title><path d="M16.361 10.26a.894.894 0 0 0-.558.47l-.072.148.001.207c0 .193.004.217.059.353.076.193.152.312.291.448.24.238.51.3.872.205a.86.86 0 0 0 .517-.436.752.752 0 0 0 .08-.498c-.064-.453-.33-.782-.724-.897a1.06 1.06 0 0 0-.466 0zm-9.203.005c-.305.096-.533.32-.65.639a1.187 1.187 0 0 0-.06.52c.057.309.31.59.598.667.362.095.632.033.872-.205.14-.136.215-.255.291-.448.055-.136.059-.16.059-.353l.001-.207-.072-.148a.894.894 0 0 0-.565-.472 1.02 1.02 0 0 0-.474.007Zm4.184 2c-.131.071-.223.25-.195.383.031.143.157.288.353.407.105.063.112.072.117.136.004.038-.01.146-.029.243-.02.094-.036.194-.036.222.002.074.07.195.143.253.064.052.076.054.255.059.164.005.198.001.264-.03.169-.082.212-.234.15-.525-.052-.243-.042-.28.087-.355.137-.08.281-.219.324-.314a.365.365 0 0 0-.175-.48.394.394 0 0 0-.181-.033c-.126 0-.207.03-.355.124l-.085.053-.053-.032c-.219-.13-.259-.145-.391-.143a.396.396 0 0 0-.193.032zm.39-2.195c-.373.036-.475.05-.654.086-.291.06-.68.195-.951.328-.94.46-1.589 1.226-1.787 2.114-.04.176-.045.234-.045.53 0 .294.005.357.043.524.264 1.16 1.332 2.017 2.714 2.173.3.033 1.596.033 1.896 0 1.11-.125 2.064-.727 2.493-1.571.114-.226.169-.372.22-.602.039-.167.044-.23.044-.523 0-.297-.005-.355-.045-.531-.288-1.29-1.539-2.304-3.072-2.497a6.873 6.873 0 0 0-.855-.031zm.645.937a3.283 3.283 0 0 1 1.44.514c.223.148.537.458.671.662.166.251.26.508.303.82.02.143.01.251-.043.482-.08.345-.332.705-.672.957a3.115 3.115 0 0 1-.689.348c-.382.122-.632.144-1.525.138-.582-.006-.686-.01-.853-.042-.57-.107-1.022-.334-1.35-.68-.264-.28-.385-.535-.45-.946-.03-.192.025-.509.137-.776.136-.326.488-.73.836-.963.403-.269.934-.46 1.422-.512.187-.02.586-.02.773-.002zm-5.503-11a1.653 1.653 0 0 0-.683.298C5.617.74 5.173 1.666 4.985 2.819c-.07.436-.119 1.04-.119 1.503 0 .544.064 1.24.155 1.721.02.107.031.202.023.208a8.12 8.12 0 0 1-.187.152 5.324 5.324 0 0 0-.949 1.02 5.49 5.49 0 0 0-.94 2.339 6.625 6.625 0 0 0-.023 1.357c.091.78.325 1.438.727 2.04l.13.195-.037.064c-.269.452-.498 1.105-.605 1.732-.084.496-.095.629-.095 1.294 0 .67.009.803.088 1.266.095.555.288 1.143.503 1.534.071.128.243.393.264.407.007.003-.014.067-.046.141a7.405 7.405 0 0 0-.548 1.873c-.062.417-.071.552-.071.991 0 .56.031.832.148 1.279L3.42 24h1.478l-.05-.091c-.297-.552-.325-1.575-.068-2.597.117-.472.25-.819.498-1.296l.148-.29v-.177c0-.165-.003-.184-.057-.293a.915.915 0 0 0-.194-.25 1.74 1.74 0 0 1-.385-.543c-.424-.92-.506-2.286-.208-3.451.124-.486.329-.918.544-1.154a.787.787 0 0 0 .223-.531c0-.195-.07-.355-.224-.522a3.136 3.136 0 0 1-.817-1.729c-.14-.96.114-2.005.69-2.834.563-.814 1.353-1.336 2.237-1.475.199-.033.57-.028.776.01.226.04.367.028.512-.041.179-.085.268-.19.374-.431.093-.215.165-.333.36-.576.234-.29.46-.489.822-.729.413-.27.884-.467 1.352-.561.17-.035.25-.04.569-.04.319 0 .398.005.569.04a4.07 4.07 0 0 1 1.914.997c.117.109.398.457.488.602.034.057.095.177.132.267.105.241.195.346.374.43.14.068.286.082.503.045.343-.058.607-.053.943.016 1.144.23 2.14 1.173 2.581 2.437.385 1.108.276 2.267-.296 3.153-.097.15-.193.27-.333.419-.301.322-.301.722-.001 1.053.493.539.801 1.866.708 3.036-.062.772-.26 1.463-.533 1.854a2.096 2.096 0 0 1-.224.258.916.916 0 0 0-.194.25c-.054.109-.057.128-.057.293v.178l.148.29c.248.476.38.823.498 1.295.253 1.008.231 2.01-.059 2.581a.845.845 0 0 0-.044.098c0 .006.329.009.732.009h.73l.02-.074.036-.134c.019-.076.057-.3.088-.516.029-.217.029-1.016 0-1.258-.11-.875-.295-1.57-.597-2.226-.032-.074-.053-.138-.046-.141.008-.005.057-.074.108-.152.376-.569.607-1.284.724-2.228.031-.26.031-1.378 0-1.628-.083-.645-.182-1.082-.348-1.525a6.083 6.083 0 0 0-.329-.7l-.038-.064.131-.194c.402-.604.636-1.262.727-2.04a6.625 6.625 0 0 0-.024-1.358 5.512 5.512 0 0 0-.939-2.339 5.325 5.325 0 0 0-.95-1.02 8.097 8.097 0 0 1-.186-.152.692.692 0 0 1 .023-.208c.208-1.087.201-2.443-.017-3.503-.19-.924-.535-1.658-.98-2.082-.354-.338-.716-.482-1.15-.455-.996.059-1.8 1.205-2.116 3.01a6.805 6.805 0 0 0-.097.726c0 .036-.007.066-.015.066a.96.96 0 0 1-.149-.078A4.857 4.857 0 0 0 12 3.03c-.832 0-1.687.243-2.456.698a.958.958 0 0 1-.148.078c-.008 0-.015-.03-.015-.066a6.71 6.71 0 0 0-.097-.725C8.997 1.392 8.337.319 7.46.048a2.096 2.096 0 0 0-.585-.041Zm.293 1.402c.248.197.523.759.682 1.388.03.113.06.244.069.292.007.047.026.152.041.233.067.365.098.76.102 1.24l.002.475-.12.175-.118.178h-.278c-.324 0-.646.041-.954.124l-.238.06c-.033.007-.038-.003-.057-.144a8.438 8.438 0 0 1 .016-2.323c.124-.788.413-1.501.696-1.711.067-.05.079-.049.157.013zm9.825-.012c.17.126.358.46.498.888.28.854.36 2.028.212 3.145-.019.14-.024.151-.057.144l-.238-.06a3.693 3.693 0 0 0-.954-.124h-.278l-.119-.178-.119-.175.002-.474c.004-.669.066-1.19.214-1.772.157-.623.434-1.185.68-1.382.078-.062.09-.063.159-.012z"/>',
    langchain: '<title>LangChain</title><path d="M13.796 0a6.93 6.93 0 0 0-4.91 2.019L5.451 5.455l3.273 3.27 3.432-3.432a2.284 2.284 0 0 1 3.277 0 2.28 2.28 0 0 1 0 3.275L12 12.001l3.273 3.273 3.433-3.435c2.692-2.692 2.692-7.127 0-9.82A6.92 6.92 0 0 0 13.796 0m-5.07 8.728-3.433 3.434c-2.692 2.693-2.692 7.126 0 9.819A6.92 6.92 0 0 0 10.203 24a6.93 6.93 0 0 0 4.911-2.02l3.432-3.432-3.271-3.272-3.433 3.433a2.284 2.284 0 0 1-3.277 0 2.28 2.28 0 0 1 0-3.276L12 12z"/>'
  };

  function paintLogos() {
    Array.prototype.forEach.call(document.querySelectorAll(".tile[data-skill]"), function (li) {
      if (li.querySelector(".lvl-row")) return;
      var lvl = li.querySelector(".lvl");
      if (!lvl) return;
      var row = document.createElement("span");
      row.className = "lvl-row";
      li.insertBefore(row, lvl);
      row.appendChild(lvl);
      var key = ((li.getAttribute("data-skill") || "").split(/\s+/))[0];
      var d = LOGOS[key];
      if (!d) return;
      row.insertAdjacentHTML("afterbegin",
        '<svg class="tile-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + d + "</svg>");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tools-row [data-logo]"), function (li) {
      if (li.querySelector(".tile-logo")) return;
      var d = LOGOS[li.getAttribute("data-logo")];
      if (!d) return;
      li.insertAdjacentHTML("afterbegin",
        '<svg class="tile-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + d + "</svg>");
    });
  }
  paintLogos();

  /* ---------- Hero drawing sheet: overlay, draw-in, callouts ---------- */
  (function initSheet() {
    var sheet = document.querySelector(".sheet");
    var fallback = document.querySelector(".stack-fallback");
    if (!sheet || !fallback) return;
    sheet.removeAttribute("hidden");
    fallback.setAttribute("hidden", "");
    var overlay = sheet.querySelector(".sheet-overlay");
    var callout = sheet.querySelector(".sheet-callout");
    var dot = sheet.querySelector(".sheet-dot");
    var NS = "http://www.w3.org/2000/svg";
    var stages = Array.prototype.slice.call(sheet.querySelectorAll(".sheet-stage"));
    var tileBtns = Array.prototype.slice.call(sheet.querySelectorAll(".sheet-tile-btn"));
    var still = reduceMotion || revealAll;

    function el(n, attrs, parent) {
      var e = document.createElementNS(NS, n);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    function relBox(node) {
      var s = sheet.getBoundingClientRect();
      var b = node.getBoundingClientRect();
      return { x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height,
               cx: b.left - s.left + b.width / 2, cy: b.top - s.top + b.height / 2 };
    }

    var routePath = null;

    function draw() {
      if (!overlay) return;
      while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
      var sr = sheet.getBoundingClientRect();
      if (sr.width < 2) return;
      overlay.setAttribute("viewBox", "0 0 " + sr.width + " " + sr.height);
      var boxes = [];
      stages.forEach(function (st) {
        var list = st.querySelector(":scope > ul");
        var b = relBox(list || st);
        boxes.push(b);
      });
      var d = "";
      boxes.forEach(function (b, i) {
        d += (i ? "L" : "M") + b.cx.toFixed(1) + " " + b.cy.toFixed(1);
      });
      routePath = el("path", { d: d, fill: "none", stroke: "none" }, overlay);
      for (var k = 1; k < boxes.length; k++) {
        (function (a, c, idx) {
          var x1, y1, x2, y2;
          var ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x);
          var oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
          if (ox > oy) {
            var x = (Math.max(a.x, c.x) + Math.min(a.x + a.w, c.x + c.w)) / 2;
            if (a.y < c.y) { y1 = a.y + a.h; y2 = c.y; } else { y1 = a.y; y2 = c.y + c.h; }
            x1 = x; x2 = x;
          } else {
            var y = (Math.max(a.y, c.y) + Math.min(a.y + a.h, c.y + c.h)) / 2;
            if (a.x < c.x) { x1 = a.x + a.w; x2 = c.x; } else { x1 = a.x; x2 = c.x + c.w; }
            y1 = y; y2 = y;
          }
          var line = el("line", { x1: x1.toFixed(1), y1: y1.toFixed(1),
            x2: x2.toFixed(1), y2: y2.toFixed(1), "class": "flow", "data-i": idx }, overlay);
          el("circle", { cx: x1.toFixed(1), cy: y1.toFixed(1), r: 3,
            "class": "node", "data-i": idx }, overlay);
          el("circle", { cx: x2.toFixed(1), cy: y2.toFixed(1), r: 3,
            "class": "node", "data-i": idx }, overlay);
          if (!still) {
            var len = line.getTotalLength();
            line.style.strokeDasharray = len;
            line.style.strokeDashoffset = len;
            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(function () {
                line.style.strokeDashoffset = "0";
              });
            });
          }
        })(boxes[k - 1], boxes[k], k);
      }
      if (boxes.length > 5) {
        var run = boxes[4], ship = boxes[5];
        var dx1, dy1, dx2, dy2;
        var ox2 = Math.min(run.x + run.w, ship.x + ship.w) - Math.max(run.x, ship.x);
        var oy2 = Math.min(run.y + run.h, ship.y + ship.h) - Math.max(run.y, ship.y);
        if (ox2 > oy2) {
          var dx = (Math.max(run.x, ship.x) + Math.min(run.x + run.w, ship.x + ship.w)) / 2;
          if (run.y < ship.y) { dy1 = run.y + run.h; dy2 = ship.y; }
          else { dy1 = run.y; dy2 = ship.y + ship.h; }
          dx1 = dx; dx2 = dx;
        } else {
          var dy = (Math.max(run.y, ship.y) + Math.min(run.y + run.h, ship.y + ship.h)) / 2;
          if (run.x < ship.x) { dx1 = run.x + run.w; dx2 = ship.x; }
          else { dx1 = run.x; dx2 = ship.x + ship.w; }
          dy1 = dy; dy2 = dy;
        }
        el("line", { x1: dx1.toFixed(1), y1: dy1.toFixed(1), x2: dx2.toFixed(1),
          y2: dy2.toFixed(1), "class": "deploy" }, overlay);
        var lab = el("text", { x: ((dx1 + dx2) / 2).toFixed(1), y: ((dy1 + dy2) / 2 + 15).toFixed(1),
          "text-anchor": "middle", "class": "svg-label" }, overlay);
        lab.textContent = "deploy";
      }
    }

    function revealTiles() {
      tileBtns.forEach(function (b, i) {
        if (still) {
          b.closest(".sheet-tile").classList.add("is-in");
        } else {
          window.setTimeout(function () {
            b.closest(".sheet-tile").classList.add("is-in");
          }, 200 + i * 85);
        }
      });
    }

    function travelDot() {
      if (still || !dot || !routePath) return;
      try {
        var len = routePath.getTotalLength();
        var t0 = null;
        dot.style.opacity = "1";
        var step = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / 1400, 1);
          var pt = routePath.getPointAtLength(len * p);
          dot.style.transform = "translate(" + (pt.x - 4).toFixed(1) + "px," + (pt.y - 4).toFixed(1) + "px)";
          if (p < 1) {
            window.requestAnimationFrame(step);
          } else {
            dot.style.opacity = "0";
          }
        };
        window.requestAnimationFrame(step);
      } catch (err) { /* geometry API unavailable */ }
    }

    var drawTimer = null;
    function scheduleDraw() {
      if (drawTimer) window.clearTimeout(drawTimer);
      drawTimer = window.setTimeout(function () {
        draw();
        travelDot();
      }, 300);
    }

    function firstDraw() {
      draw();
      revealTiles();
      travelDot();
    }

    if (document.readyState === "complete") {
      window.setTimeout(firstDraw, 1200);
    } else {
      window.addEventListener("load", function () {
        window.setTimeout(firstDraw, 1200);
      });
      window.setTimeout(firstDraw, 4000);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { scheduleDraw(); });
    }
    var rsT = null;
    window.addEventListener("resize", function () {
      hideCallout();
      if (rsT) window.clearTimeout(rsT);
      rsT = window.setTimeout(draw, 220);
    });

    function lightUntil(idx, on) {
      if (!overlay) return;
      Array.prototype.forEach.call(
        overlay.querySelectorAll(".flow,.node"), function (n) {
          var i = parseInt(n.getAttribute("data-i") || "0", 10);
          n.classList.toggle("is-lit", on && i <= idx && i > 0);
        });
    }
    stages.forEach(function (st, idx) {
      st.addEventListener("mouseenter", function () { lightUntil(idx, true); });
      st.addEventListener("mouseleave", function () { lightUntil(idx, false); });
      st.addEventListener("focusin", function () { lightUntil(idx, true); });
      st.addEventListener("focusout", function () { lightUntil(idx, false); });
    });

    var leader = null;
    function hideCallout() {
      if (callout) callout.setAttribute("hidden", "");
      if (leader && leader.parentNode) leader.parentNode.removeChild(leader);
      leader = null;
    }
    function showCallout(btn) {
      if (!callout) return;
      var key = btn.getAttribute("data-skill");
      var li = findSkillLi(key);
      if (!li) return;
      var name = li.querySelector(".sk-name");
      var lvl = li.querySelector(".lvl");
      var used = li.querySelector(".sk-used");
      callout.innerHTML = "";
      var s = document.createElement("strong");
      s.textContent = name ? name.textContent : key;
      callout.appendChild(s);
      if (lvl) callout.appendChild(lvl.cloneNode(true));
      if (used) {
        var u = document.createElement("div");
        u.className = "sk-used";
        u.innerHTML = used.innerHTML;
        callout.appendChild(u);
      }
      callout.removeAttribute("hidden");
      var sb = sheet.getBoundingClientRect();
      var tb = btn.getBoundingClientRect();
      var x = tb.right - sb.left + 10;
      var y = tb.top - sb.top - 10;
      if (x + 250 > sb.width) x = tb.left - sb.left - 260;
      if (x < 0) x = 8;
      if (y < 0) y = 8;
      callout.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      if (overlay) {
        if (leader && leader.parentNode) leader.parentNode.removeChild(leader);
        leader = document.createElementNS(NS, "line");
        leader.setAttribute("x1", (tb.left - sb.left + tb.width / 2).toFixed(1));
        leader.setAttribute("y1", (tb.top - sb.top + tb.height / 2).toFixed(1));
        leader.setAttribute("x2", (x + 12).toFixed(1));
        leader.setAttribute("y2", (y + 20).toFixed(1));
        leader.setAttribute("class", "flow");
        overlay.appendChild(leader);
      }
    }
    tileBtns.forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { showCallout(btn); });
      btn.addEventListener("mouseleave", hideCallout);
      btn.addEventListener("focus", function () { showCallout(btn); });
      btn.addEventListener("blur", hideCallout);
      btn.addEventListener("click", function () {
        hideCallout();
        var key = btn.getAttribute("data-skill");
        var li = findSkillLi(key);
        if (!li || !skillInput) return;
        var name = li.querySelector(".sk-name");
        skillInput.value = name ? name.textContent : key;
        runSkillSearch();
        var panel = li.closest("[data-layer-panel]");
        if (panel) activateLayer(panel.getAttribute("data-layer-panel"), false);
        li.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hideCallout();
    });
    window.addEventListener("scroll", hideCallout, { passive: true });
  })();

  /* ---------- Item 7: pips, match badges, travel square, drag scroll ---------- */
  var sysSvg = document.querySelector(".sysmap");
  var sysNS = "http://www.w3.org/2000/svg";

  var PIP_LEVELS = { "Production": 3, "Built locally": 2, "Working knowledge": 1, "In progress": 0 };
  function paintPips() {
    Array.prototype.forEach.call(document.querySelectorAll(".tile .lvl"), function (lvl) {
      if (lvl.parentNode.querySelector(".skill-pips")) return;
      var text = (lvl.textContent || "").trim();
      var n = PIP_LEVELS[text];
      if (n === undefined) return;
      var wrap = document.createElement("span");
      wrap.className = "skill-pips";
      wrap.setAttribute("aria-hidden", "true");
      for (var i = 0; i < 3; i++) {
        var pip = document.createElement("span");
        pip.className = "pip" + (text === "In progress" ? " is-dash" : (i < n ? " is-fill" : ""));
        wrap.appendChild(pip);
      }
      lvl.parentNode.insertBefore(wrap, lvl.nextSibling);
    });
  }
  paintPips();

  var matchBadges = [];
  function layerIndex(name) { return LAYER_ORDER.indexOf(name); }
  function paintBadges() {
    if (!sysSvg) return;
    layerBtns.forEach(function (btn) {
      var t = document.createElementNS(sysNS, "text");
      t.setAttribute("class", "sys-match");
      t.setAttribute("text-anchor", "end");
      t.setAttribute("visibility", "hidden");
      t.setAttribute("aria-hidden", "true");
      btn.appendChild(t);
      matchBadges.push({ btn: btn, el: t });
    });
  }
  paintBadges();

  function updateMatchBadges(counts) {
    matchBadges.forEach(function (b) {
      var name = b.btn.getAttribute("data-layer");
      var n = counts ? (counts[name] || 0) : 0;
      if (!counts || !n) {
        b.el.setAttribute("visibility", "hidden");
        return;
      }
      var i = layerIndex(name);
      b.el.setAttribute("x", 8 + i * 220 + 184);
      b.el.setAttribute("y", 40 + 30);
      b.el.textContent = n;
      b.el.removeAttribute("visibility");
      b.el.classList.remove("pop");
      try { window.getComputedStyle(b.el).opacity; } catch (err) {}
      b.el.classList.add("pop");
    });
  }

  var travEl = null;
  function travelTo(fromName, toName) {
    if (reduceMotion || revealAll || !sysSvg) return;
    var fa = layerBtns.filter(function (b) { return b.getAttribute("data-layer") === fromName; })[0];
    var fb = layerBtns.filter(function (b) { return b.getAttribute("data-layer") === toName; })[0];
    if (!fa || !fb) return;
    var ra = fa.getBoundingClientRect(), rb = fb.getBoundingClientRect();
    var sr = sysSvg.getBoundingClientRect();
    if (!sr.width) return;
    var sx = 1320 / sr.width, sy = 300 / sr.height;
    var x0 = (ra.left + ra.width / 2 - sr.left) * sx;
    var y0 = (ra.top + ra.height / 2 - sr.top) * sy;
    var x1 = (rb.left + rb.width / 2 - sr.left) * sx;
    var y1 = (rb.top + rb.height / 2 - sr.top) * sy;
    if (!travEl) {
      travEl = document.createElementNS(sysNS, "rect");
      travEl.setAttribute("width", "8");
      travEl.setAttribute("height", "8");
      travEl.setAttribute("class", "sys-trav");
      travEl.style.opacity = "0";
      sysSvg.appendChild(travEl);
    }
    var t0 = null;
    travEl.style.opacity = "1";
    var step = function (ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / 360, 1);
      travEl.setAttribute("x", (x0 + (x1 - x0) * p - 4).toFixed(1));
      travEl.setAttribute("y", (y0 + (y1 - y0) * p - 4).toFixed(1));
      if (p < 1) {
        window.requestAnimationFrame(step);
      } else {
        travEl.style.opacity = "0";
      }
    };
    window.requestAnimationFrame(step);
  }

  function moveNotch(name) {
    if (!plateNotch || !plate) return;
    var btn = layerBtns.filter(function (b) { return b.getAttribute("data-layer") === name; })[0];
    if (!btn) return;
    var pr = plate.getBoundingClientRect();
    var br = btn.getBoundingClientRect();
    var x = br.left + br.width / 2 - pr.left - 5;
    x = Math.max(4, Math.min(pr.width - 14, x));
    plateNotch.style.transform = "translateX(" + Math.round(x) + "px)";
  }

  var sysScroller = document.querySelector(".sysmap-scroll");
  if (sysScroller && finePointer && !reduceMotion) {
    var dragging = false, dragX = 0, dragL = 0, dragMoved = 0;
    sysScroller.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      dragMoved = 0;
      dragX = e.clientX;
      dragL = sysScroller.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragX;
      if (Math.abs(dx) > dragMoved) dragMoved = Math.abs(dx);
      sysScroller.scrollLeft = dragL - dx;
    });
    window.addEventListener("pointerup", function () { dragging = false; });
    sysScroller.addEventListener("click", function (e) {
      if (dragMoved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  /* ---------- Skill search: filter skills, highlight proof ---------- */
  var skillInput = document.getElementById("skillSearch");
  var skillClear = document.getElementById("skillClear");
  var skillStatus = document.getElementById("skillStatus");
  var skillItems = Array.prototype.slice.call(document.querySelectorAll("[data-skill]"));
  var proofEls = Array.prototype.slice.call(document.querySelectorAll("[data-skills]"));

  function norm(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function clearSkillSearch() {
    skillItems.forEach(function (li) {
      li.removeAttribute("hidden");
      li.classList.remove("is-match");
      li.classList.remove("is-unmatch");
    });
    updateMatchBadges(null);
    layerPanels.forEach(function (panel) { panel.removeAttribute("hidden"); });
    if (layerBtns.length) activateLayer(layerBtns[0].getAttribute("data-layer"), false);
    proofEls.forEach(function (el) {
      el.classList.remove("is-hit");
      el.classList.remove("is-dim");
    });
    if (skillClear) skillClear.setAttribute("hidden", "");
    if (skillStatus) skillStatus.textContent = "";
  }

  /* ---------- Skill proof highlight (shared by search + hero tiles) ---------- */
  function highlightByKeys(keys) {
    var hits = 0;
    proofEls.forEach(function (el) {
      var tokens = (el.getAttribute("data-skills") || "").split(/\s+/);
      var match = keys.some(function (k) { return tokens.indexOf(k) !== -1; });
      el.classList.toggle("is-hit", match);
      el.classList.toggle("is-dim", !match);
      if (match) hits++;
    });
    return hits;
  }

  function findSkillLi(key) {
    for (var i = 0; i < skillItems.length; i++) {
      var toks = (skillItems[i].getAttribute("data-skill") || "").split(/\s+/);
      if (toks.indexOf(key) !== -1) return skillItems[i];
    }
    return null;
  }

  function runSkillSearch() {
    if (!skillInput) return;
    var q = norm(skillInput.value.trim());
    if (!q) {
      clearSkillSearch();
      return;
    }
    if (skillClear) skillClear.removeAttribute("hidden");

    // 1) Filter skill rows: matches lift, the rest dim; keep all panels open
    var visibleCount = 0;
    var layerCounts = {};
    skillItems.forEach(function (li) {
      var nameEl = li.querySelector(".sk-name");
      var match = norm(nameEl ? nameEl.textContent : "").indexOf(q) !== -1;
      li.classList.toggle("is-match", match);
      li.classList.toggle("is-unmatch", !match);
      li.removeAttribute("hidden");
      if (match) {
        visibleCount++;
        var panel = li.closest("[data-layer-panel]");
        if (panel) {
          var key = panel.getAttribute("data-layer-panel");
          layerCounts[key] = (layerCounts[key] || 0) + 1;
        }
      }
    });
    layerPanels.forEach(function (panel) {
      panel.removeAttribute("hidden");
    });
    updateMatchBadges(visibleCount ? layerCounts : null);

    // 2) Exact skill chosen -> highlight proof (projects + experience)
    var exactKeys = [];
    skillItems.forEach(function (li) {
      var nameEl = li.querySelector(".sk-name");
      if (norm(nameEl ? nameEl.textContent : "") === q) {
        (li.getAttribute("data-skill") || "").split(/\s+/).forEach(function (k) {
          if (k && exactKeys.indexOf(k) === -1) exactKeys.push(k);
        });
      }
    });

    var hits = 0;
    if (exactKeys.length) {
      hits = highlightByKeys(exactKeys);
    } else {
      proofEls.forEach(function (el) {
        el.classList.remove("is-hit");
        el.classList.remove("is-dim");
      });
    }

    if (skillStatus) {
      skillStatus.textContent = exactKeys.length
        ? visibleCount + " skill" + (visibleCount === 1 ? "" : "s") + " · " + hits + " place" + (hits === 1 ? "" : "s") + " highlighted below"
        : visibleCount + " skill" + (visibleCount === 1 ? "" : "s") + " found — pick one to highlight where it is used";
    }
  }

  if (skillInput) {
    skillInput.addEventListener("input", runSkillSearch);
    skillInput.addEventListener("change", runSkillSearch);
  }
  if (skillClear) {
    skillClear.addEventListener("click", function () {
      if (skillInput) skillInput.value = "";
      clearSkillSearch();
      if (skillInput) skillInput.focus();
    });
  }

  /* ---------- Tiles: pointer-follow highlight (transform only, flat) ---------- */
  var tileWrap = document.querySelector(".layer-panels");
  if (tileWrap && finePointer && !reduceMotion) {
    var tileRaf = null;
    tileWrap.addEventListener("mousemove", function (e) {
      if (tileRaf) return;
      tileRaf = window.requestAnimationFrame(function () {
        tileRaf = null;
        var tiles = tileWrap.querySelectorAll(".tile");
        Array.prototype.forEach.call(tiles, function (t) {
          if (t.offsetParent === null) return;
          if (t.classList.contains("tile-leave") || t.classList.contains("tile-enter") ||
            t.classList.contains("is-match") || t.classList.contains("is-unmatch")) {
            t.style.transform = "";
            t.classList.remove("is-near");
            return;
          }
          var r = t.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150 && d > 1) {
            var pull = (1 - d / 150) * 3;
            t.style.transform =
              "translate(" + ((dx / d) * pull).toFixed(1) + "px," + ((dy / d) * pull).toFixed(1) + "px)";
            t.classList.toggle("is-near", d < 100);
          } else {
            t.style.transform = "";
            t.classList.toggle("is-near", d <= 1);
          }
        });
      });
    });
    tileWrap.addEventListener("mouseleave", function () {
      Array.prototype.forEach.call(tileWrap.querySelectorAll(".tile"), function (t) {
        t.style.transform = "";
        t.classList.remove("is-near");
      });
    });
  }

  /* ---------- Lightbox: click to enlarge, Esc to close ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCap = document.getElementById("lightboxCap");
  var lightboxClose = document.getElementById("lightboxClose");
  var lastFocus = null;

  function openLightbox(src, caption, alt, thumb) {
    if (!lightbox || !lightboxImg) return;
    lbClosing = false;
    lastFocus = document.activeElement;
    lightboxImg.setAttribute("src", src);
    lightboxImg.setAttribute("alt", alt || caption || "Enlarged project image");
    if (lightboxCap) lightboxCap.textContent = caption || "";
    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    if (!reduceMotion && thumb && thumb.getBoundingClientRect && lightboxImg.animate) {
      try {
        lightboxImg.style.visibility = "hidden";
        var r1 = thumb.getBoundingClientRect();
        var r2 = lightboxImg.getBoundingClientRect();
        lightboxImg.style.visibility = "";
        if (r1.width > 2 && r2.width > 2) {
          var dx = r1.left + r1.width / 2 - (r2.left + r2.width / 2);
          var dy = r1.top + r1.height / 2 - (r2.top + r2.height / 2);
          lightboxImg.animate([
            { transform: "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" +
              (r1.width / r2.width).toFixed(3) + "," + (r1.height / r2.height).toFixed(3) + ")",
              opacity: 0.4 },
            { transform: "none", opacity: 1 }
          ], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
        }
      } catch (err) { lightboxImg.style.visibility = ""; }
    }
    window.requestAnimationFrame(function () {
      lightbox.classList.add("is-open");
    });
    if (lightboxClose) lightboxClose.focus();
  }

  var lbClosing = false;
  function closeLightbox() {
    if (!lightbox || lightbox.hasAttribute("hidden")) return;
    lightbox.classList.remove("is-open");
    var done = function () {
      lbClosing = false;
      lightbox.setAttribute("hidden", "");
      document.body.style.overflow = "";
      if (lightboxImg) lightboxImg.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (reduceMotion) {
      done();
    } else if (!lbClosing) {
      lbClosing = true;
      window.setTimeout(function () {
        if (lbClosing) done();
      }, 240);
    }
  }

  function trapLightboxTab(e) {
    if (e.key !== "Tab" || !lightbox || lightbox.hasAttribute("hidden")) return;
    var f = lightbox.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])");
    f = Array.prototype.filter.call(f, function (el) { return !el.disabled; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll(".media-btn"), function (btn) {
    btn.addEventListener("click", function () {
      var img = btn.querySelector("img");
      openLightbox(
        btn.getAttribute("data-full"),
        btn.getAttribute("data-caption"),
        img ? img.getAttribute("alt") : "",
        img || btn
      );
    });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  Array.prototype.forEach.call(document.querySelectorAll("[data-lightbox-close]"), function (el) {
    el.addEventListener("click", closeLightbox);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
    trapLightboxTab(e);
  });

  /* ---------- Blueprint reticle cursor (fine pointer + hover only) ---------- */
  var hoverAble = window.matchMedia("(hover: hover)").matches;
  var reticle = document.querySelector(".reticle");

  if (reticle && finePointer && hoverAble && !revealAll) {
    document.body.classList.add("has-reticle");
    var rDot = reticle.querySelector(".reticle-dot");
    var rBox = reticle.querySelector(".reticle-box");
    var rLabel = reticle.querySelector(".reticle-label");

    var px = -100, py = -100;
    var bx = 0, by = 0, bw = 28, bh = 28;
    var tx = 0, ty = 0, tw = 28, th = 28;
    var boxOn = false, pressed = false, inWin = false;
    var magEl = null;
    if (rDot) rDot.style.transform = "translate(-100px,-100px)";

    var TEXT_TAGS = { P: 1, H1: 1, H2: 1, H3: 1, H4: 1, LI: 1, DD: 1, DT: 1, BLOCKQUOTE: 1, FIGCAPTION: 1 };

    function isEditable(el) {
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" || el.isContentEditable);
    }
    function closestOf(el, sel) {
      return el && el.closest ? el.closest(sel) : null;
    }
    function reticleLabel(el) {
      if (!el || el === document.body || el === document.documentElement) return "";
      if (closestOf(el, "#lightbox:not([hidden])")) return "close";
      if (closestOf(el, ".media-btn")) return "expand";
      if (closestOf(el, 'a[href$=".pdf"],a[href$=".PDF"]')) return "download";
      if (closestOf(el, 'a[href^="mailto:"]')) return "mail";
      if (closestOf(el, 'a[href^="tel:"]')) return "call";
      if (closestOf(el, 'a[href^="http"]')) return "open";
      if (closestOf(el, ".sys-layer")) return "open";
      if (closestOf(el, ".sysmap-scroll")) return "drag";
      if (closestOf(el, ".sys-layer")) return "open";
      if (closestOf(el, ".sheet-tile-btn")) return "view";
      if (closestOf(el, ".filter-tab")) return "filter";
      if (closestOf(el, ".nav-toggle")) return "menu";
      if (closestOf(el, ".theme-toggle")) return "theme";
      if (closestOf(el, ".scroll-top,#backToTop")) return "top";
      if (closestOf(el, 'a[href^="#"]')) return "go";
      return "";
    }
    function morphTarget(el) {
      if (!el || el === document.body || el === document.documentElement) return null;
      if (closestOf(el, "#lightbox:not([hidden])")) return closestOf(el, "#lightbox:not([hidden])");
      return closestOf(el, "a,button,.sys-layer,.sysmap-scroll");
    }
    function pointerInside(x, y) {
      var vw = window.innerWidth || document.documentElement.clientWidth;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      return x >= 0 && y >= 0 && x <= vw && y <= vh;
    }
    function showReticleAt(x, y) {
      var el = document.elementFromPoint(x, y);
      if (isEditable(el)) return;
      inWin = true;
      reticle.style.opacity = "1";
      if (el && el !== document.body && el !== document.documentElement) setMag(closestOf(el, ".btn"));
    }
    function restoreReticle() {
      if (document.visibilityState && document.visibilityState !== "visible") return;
      if (!pointerInside(px, py)) return;
      showReticleAt(px, py);
    }

    document.addEventListener("mousemove", function (e) {
      px = e.clientX;
      py = e.clientY;
      if (rDot) rDot.style.transform = "translate(" + px + "px," + py + "px)";
      if (reduceMotion) return;
      if (!inWin) {
        inWin = true;
        reticle.style.opacity = "1";
      }
      var t = e.target;
      if (isEditable(t)) {
        reticle.style.opacity = "0";
        if (rBox) rBox.classList.remove("is-on");
        if (rLabel) rLabel.classList.remove("is-on");
        boxOn = false;
        setMag(null);
        return;
      }
      if (!inWin) reticle.style.opacity = "1";
      var m = morphTarget(t);
      var ins = pressed ? 4 : 0;
      if (m) {
        var r = m.getBoundingClientRect();
        tx = r.left - 6 + ins;
        ty = r.top - 6 + ins;
        tw = Math.max(8, r.width + 12 - ins * 2);
        th = Math.max(8, r.height + 12 - ins * 2);
        if (!boxOn) {
          boxOn = true;
          bx = tx; by = ty; bw = tw; bh = th;
          if (rBox) rBox.classList.add("is-on");
        }
        if (rBox) rBox.classList.add("is-hot");
      } else if (t && TEXT_TAGS[t.tagName] && !closestOf(t, "a,button")) {
        boxOn = false;
        if (rBox) {
          rBox.classList.remove("is-on");
          rBox.classList.remove("is-hot");
        }
      } else {
        tx = px - 14 + ins;
        ty = py - 14 + ins;
        tw = Math.max(8, 28 - ins * 2);
        th = Math.max(8, 28 - ins * 2);
        if (!boxOn) {
          boxOn = true;
          bx = tx; by = ty; bw = tw; bh = th;
          if (rBox) rBox.classList.add("is-on");
        }
        if (rBox) rBox.classList.remove("is-hot");
      }
      var label = reticleLabel(t);
      if (label && rLabel) {
        rLabel.textContent = label;
        rLabel.classList.add("is-on");
      } else if (rLabel) {
        rLabel.classList.remove("is-on");
      }
      setMag(closestOf(t, ".btn"));
    });

    function setMag(btn) {
      if (magEl && magEl !== btn) magEl.style.transform = "";
      magEl = btn;
      if (magEl && !reduceMotion) {
        var r = magEl.getBoundingClientRect();
        var dx = px - (r.left + r.width / 2);
        var dy = py - (r.top + r.height / 2);
        var len = Math.sqrt(dx * dx + dy * dy);
        var pull = len > 1 ? Math.min(4, len * 0.12) : 0;
        magEl.style.transform = pull
          ? "translate(" + ((dx / len) * pull).toFixed(1) + "px," + ((dy / len) * pull).toFixed(1) + "px)"
          : "";
      } else if (magEl) {
        magEl.style.transform = "";
      }
    }

    document.addEventListener("mousedown", function () { pressed = true; });
    document.addEventListener("mouseup", function () { pressed = false; });
    document.addEventListener("mouseleave", function () {
      inWin = false;
      reticle.style.opacity = "0";
      setMag(null);
    });
    document.addEventListener("mouseenter", function () {
      showReticleAt(px, py);
    });
    document.addEventListener("click", function () {
      if (!inWin) restoreReticle();
    }, true);
    window.addEventListener("focus", restoreReticle);
    window.addEventListener("pageshow", restoreReticle);
    document.addEventListener("visibilitychange", restoreReticle);

    if (!reduceMotion) {
      (function loop() {
        bx += (tx - bx) * 0.18;
        by += (ty - by) * 0.18;
        bw += (tw - bw) * 0.18;
        bh += (th - bh) * 0.18;
        if (rBox) {
          rBox.style.transform = "translate(" + bx.toFixed(1) + "px," + by.toFixed(1) + "px)";
          rBox.style.width = Math.max(0, bw).toFixed(1) + "px";
          rBox.style.height = Math.max(0, bh).toFixed(1) + "px";
        }
        if (rLabel && rLabel.classList.contains("is-on")) {
          rLabel.style.transform =
            "translate(" + (bx + bw + 10).toFixed(1) + "px," + (by + bh / 2 - 9).toFixed(1) + "px)";
        }
        window.requestAnimationFrame(loop);
      })();
    }
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

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

  /* ---------- Skill system map: layer panels ---------- */
  var layerBtns = Array.prototype.slice.call(document.querySelectorAll(".sys-layer"));
  var layerPanels = Array.prototype.slice.call(document.querySelectorAll("[data-layer-panel]"));

  function activateLayer(name, focusPanel) {
    layerBtns.forEach(function (btn) {
      var active = btn.getAttribute("data-layer") === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-expanded", active ? "true" : "false");
    });
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

  if (layerBtns.length && layerPanels.length) {
    // No-JS shows every panel; with JS, start on the first layer only
    activateLayer(layerBtns[0].getAttribute("data-layer"), false);
    layerBtns.forEach(function (btn) {
      var name = btn.getAttribute("data-layer");
      btn.addEventListener("click", function () { activateLayer(name, false); });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateLayer(name, false);
        }
      });
    });
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
    skillItems.forEach(function (li) { li.removeAttribute("hidden"); });
    layerPanels.forEach(function (panel) { panel.removeAttribute("hidden"); });
    if (layerBtns.length) activateLayer(layerBtns[0].getAttribute("data-layer"), false);
    proofEls.forEach(function (el) {
      el.classList.remove("is-hit");
      el.classList.remove("is-dim");
    });
    if (skillClear) skillClear.setAttribute("hidden", "");
    if (skillStatus) skillStatus.textContent = "";
  }

  function runSkillSearch() {
    if (!skillInput) return;
    var q = norm(skillInput.value.trim());
    if (!q) {
      clearSkillSearch();
      return;
    }
    if (skillClear) skillClear.removeAttribute("hidden");

    // 1) Filter skill rows by name substring; show only panels with matches
    var visibleCount = 0;
    var panelsWithHits = {};
    skillItems.forEach(function (li) {
      var nameEl = li.querySelector(".sk-name");
      var match = norm(nameEl ? nameEl.textContent : "").indexOf(q) !== -1;
      if (match) {
        li.removeAttribute("hidden");
        visibleCount++;
        var panel = li.closest("[data-layer-panel]");
        if (panel) panelsWithHits[panel.getAttribute("data-layer-panel")] = true;
      } else {
        li.setAttribute("hidden", "");
      }
    });
    layerPanels.forEach(function (panel) {
      if (panelsWithHits[panel.getAttribute("data-layer-panel")]) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });

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
      proofEls.forEach(function (el) {
        var tokens = (el.getAttribute("data-skills") || "").split(/\s+/);
        var match = exactKeys.some(function (k) { return tokens.indexOf(k) !== -1; });
        el.classList.toggle("is-hit", match);
        el.classList.toggle("is-dim", !match);
        if (match) hits++;
      });
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
          var r = t.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 150 && d > 1) {
            var pull = (1 - d / 150) * 4;
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

  function openLightbox(src, caption, alt) {
    if (!lightbox || !lightboxImg) return;
    lastFocus = document.activeElement;
    lightboxImg.setAttribute("src", src);
    lightboxImg.setAttribute("alt", alt || caption || "Enlarged project image");
    if (lightboxCap) lightboxCap.textContent = caption || "";
    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hasAttribute("hidden")) return;
    lightbox.setAttribute("hidden", "");
    document.body.style.overflow = "";
    if (lightboxImg) lightboxImg.removeAttribute("src");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".media-btn"), function (btn) {
    btn.addEventListener("click", function () {
      var img = btn.querySelector("img");
      openLightbox(
        btn.getAttribute("data-full"),
        btn.getAttribute("data-caption"),
        img ? img.getAttribute("alt") : ""
      );
    });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  Array.prototype.forEach.call(document.querySelectorAll("[data-lightbox-close]"), function (el) {
    el.addEventListener("click", closeLightbox);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
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
      if (closestOf(el, ".project-card")) return "view";
      if (closestOf(el, ".sysmap-scroll")) return "drag";
      if (closestOf(el, "a,button")) return "open";
      return "";
    }
    function morphTarget(el) {
      if (!el || el === document.body || el === document.documentElement) return null;
      return closestOf(el, "a,button,.sys-layer,.tile,.stack-tile,.card,img,.sysmap-scroll");
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
      if (!isEditable(document.elementFromPoint(px, py))) {
        inWin = true;
        reticle.style.opacity = "1";
      }
    });

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

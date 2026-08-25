(function () {
  "use strict";

  var html = document.documentElement;
  var STORAGE_KEY = "portfolio-lang";

  function setLang(lang) {
    html.setAttribute("data-lang", lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === "fr" || saved === "en") {
    setLang(saved);
  } else if (navigator.language && navigator.language.toLowerCase().indexOf("fr") !== 0) {
    setLang("en");
  }

  document.querySelectorAll(".lang-toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var current = html.getAttribute("data-lang") === "en" ? "en" : "fr";
      setLang(current === "fr" ? "en" : "fr");
    });
  });

  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var navLinks = document.querySelectorAll(".main-nav a[href^='#'], .main-nav a[href*='index.html#']");
  var sections = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute("href").split("#")[1];
    var section = id && document.getElementById(id);
    if (section) sections.push({ link: link, section: section });
  });
  if (sections.length && "IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.find(function (s) { return s.section === entry.target; });
          if (match && entry.isIntersecting) {
            sections.forEach(function (s) { s.link.classList.remove("is-active"); });
            match.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach(function (s) { navObserver.observe(s.section); });
  }

  function initReveal() {
    var revealEls = document.querySelectorAll("[data-reveal]:not([data-reveal-bound])");
    if ("IntersectionObserver" in window && revealEls.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) {
        el.setAttribute("data-reveal-bound", "1");
        observer.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.setAttribute("data-reveal-bound", "1");
        el.classList.add("is-visible");
      });
    }
  }

  function initCarousels() {
    document.querySelectorAll("[data-carousel]:not([data-carousel-bound])").forEach(function (root) {
      root.setAttribute("data-carousel-bound", "1");
      var track = root.querySelector(".carousel-track");
      var prevBtn = root.querySelector("[data-prev]");
      var nextBtn = root.querySelector("[data-next]");
      var progressBar = root.querySelector(".carousel-progress-bar");
      if (!track) return;

      function cardStep() {
        var card = track.querySelector(":scope > *");
        if (!card) return track.clientWidth;
        var style = getComputedStyle(track);
        var gap = parseFloat(style.columnGap || style.gap || "0") || 0;
        return card.getBoundingClientRect().width + gap;
      }

      function updateProgress() {
        if (!progressBar) return;
        var max = track.scrollWidth - track.clientWidth;
        var ratio = max > 0 ? track.scrollLeft / max : 0;
        var visibleRatio = Math.min(1, track.clientWidth / track.scrollWidth);
        var barWidth = Math.max(visibleRatio * 100, 8);
        var left = ratio * (100 - barWidth);
        progressBar.style.width = barWidth + "%";
        progressBar.style.left = left + "%";
      }

      function updateButtons() {
        var max = track.scrollWidth - track.clientWidth - 2;
        if (prevBtn) prevBtn.disabled = track.scrollLeft <= 0;
        if (nextBtn) nextBtn.disabled = track.scrollLeft >= max;
      }

      if (prevBtn) prevBtn.addEventListener("click", function () {
        track.scrollBy({ left: -cardStep(), behavior: "smooth" });
      });
      if (nextBtn) nextBtn.addEventListener("click", function () {
        track.scrollBy({ left: cardStep(), behavior: "smooth" });
      });

      track.addEventListener("scroll", function () {
        updateProgress();
        updateButtons();
      }, { passive: true });

      window.addEventListener("resize", updateProgress);
      updateProgress();
      updateButtons();
    });
  }

  function applyTheme(theme) {
    if (!theme) return;
    var root = document.documentElement.style;
    if (theme.accent) root.setProperty("--accent", theme.accent);
    if (theme.dark) root.setProperty("--dark", theme.dark);
    if (theme.cream) root.setProperty("--cream", theme.cream);
  }

  window.PortfolioUI = {
    initReveal: initReveal,
    initCarousels: initCarousels,
    applyTheme: applyTheme,
    refresh: function () {
      initReveal();
      initCarousels();
    }
  };
})();

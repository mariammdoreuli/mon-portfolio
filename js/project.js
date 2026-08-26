(function () {
  "use strict";

  function esc(str) {
    if (str == null) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function nl2p(str) {
    if (!str) return "";
    return String(str).split(/\n\s*\n/).map(function (p) {
      return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function bi(fr, en) {
    return '<span lang="fr">' + esc(fr) + '</span><span lang="en">' + esc(en || fr) + '</span>';
  }

  function imgOrPlaceholder(src, captionFr, captionEn, extraClass) {
    extraClass = extraClass || "";
    if (src) return '<img class="' + extraClass + '" src="' + esc(src) + '" alt="' + esc(captionFr || "") + '">';
    return '<div class="ph ' + extraClass + '"><span class="ph-caption">' + bi(captionFr, captionEn) + "</span></div>";
  }

  function byId(id) { return document.getElementById(id); }

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug");

  Promise.all([
    fetch("../content/projects.json", { cache: "no-cache" }).then(function (r) { return r.json(); }),
    fetch("../content/site.json", { cache: "no-cache" }).then(function (r) { return r.json(); }),
    fetch("../content/sections.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
  ]).then(function (results) {
    var projects = results[0].items;
    var site = results[1];
    var customSections = (results[2] && results[2].items) || [];

    var cvLink = byId("cv-link");
    if (cvLink && site.contact && site.contact.cv_url) cvLink.setAttribute("href", site.contact.cv_url);

    var footerEl = byId("footer-inner");
    if (footerEl && site.footer) {
      footerEl.innerHTML =
        "<span>" + esc(site.footer.name_line) + " — " + bi("PORTFOLIO", "PORTFOLIO") + "</span>" +
        "<span>" + esc(site.footer.location) + "</span>";
    }
    if (window.PortfolioUI) {
      window.PortfolioUI.injectCustomNav(customSections, "../index.html#");
      if (site.theme) window.PortfolioUI.applyTheme(site.theme);
    }

    var index = projects.findIndex(function (p) { return p.slug === slug; });
    if (index === -1) index = 0;
    var p = projects[index];
    if (!p) {
      byId("project-loading").innerHTML = bi("Projet introuvable.", "Project not found.");
      return;
    }

    document.title = p.title_fr + " — Mariam Mdoreuli";
    var counter = String(index + 1).padStart(2, "0") + "/" + String(projects.length).padStart(2, "0");

    var heroEl = byId("project-hero");
    var loadingEl = byId("project-loading");
    if (loadingEl) loadingEl.remove();
    var heroContent = document.createElement("div");
    heroContent.innerHTML =
      '<p class="project-hero-tag">' + counter + " — " + bi(p.category_fr, p.category_en) + "</p>" +
      "<h1>" + bi(p.title_fr, p.title_en) + "</h1>" +
      '<div class="project-hero-meta"><span>' + bi(p.tag_fr, p.tag_en) + "</span><span>" + bi(p.year_fr, p.year_en) + "</span></div>";
    heroEl.querySelector(".container").appendChild(heroContent);

    byId("project-figure").style.display = "";
    byId("project-figure-inner").innerHTML = imgOrPlaceholder(p.image, "visuel du projet — à ajouter", "project visual — to add");

    byId("project-body").style.display = "";
    byId("project-about").innerHTML =
      '<p class="lede">' + bi(p.lede_fr, p.lede_en) + "</p>" +
      '<div lang="fr">' + nl2p(p.body_fr) + "</div>" +
      '<div lang="en">' + nl2p(p.body_en) + "</div>";
    byId("project-details").innerHTML =
      "<p style=\"margin:0 0 6px;\"><strong>" + bi("Rôle", "Role") + " :</strong> " + bi(p.role_fr, p.role_en) + "</p>" +
      "<p style=\"margin:0;\"><strong>" + bi("Outils", "Tools") + " :</strong> " + bi(p.tools_fr, p.tools_en) + "</p>";

    var prev = projects[(index - 1 + projects.length) % projects.length];
    var next = projects[(index + 1) % projects.length];
    byId("project-nav-footer").innerHTML =
      '<a href="project.html?slug=' + encodeURIComponent(prev.slug) + '">&larr; ' + bi(prev.title_fr, prev.title_en) + "</a>" +
      '<a href="project.html?slug=' + encodeURIComponent(next.slug) + '">' + bi(next.title_fr, next.title_en) + " &rarr;</a>";

    if (window.PortfolioUI) window.PortfolioUI.refresh();
  }).catch(function (err) {
    console.error("Project load error:", err);
    var loadingEl = byId("project-loading");
    if (loadingEl) loadingEl.innerHTML = bi("Erreur de chargement.", "Failed to load.");
  });
})();

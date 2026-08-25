(function () {
  "use strict";

  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function nl2p(str) {
    if (!str) return "";
    return String(str)
      .split(/\n\s*\n/)
      .map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  function bi(fr, en) {
    return '<span lang="fr">' + esc(fr) + '</span><span lang="en">' + esc(en || fr) + '</span>';
  }

  function imgOrPlaceholder(src, captionFr, captionEn, extraClass) {
    extraClass = extraClass || "";
    if (src) {
      return '<img class="' + extraClass + '" src="' + esc(src) + '" alt="' + esc(captionFr || "") + '">';
    }
    return '<div class="ph ' + extraClass + '"><span class="ph-caption">' + bi(captionFr, captionEn) + "</span></div>";
  }

  function fetchJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + path);
      return r.json();
    });
  }

  function byId(id) { return document.getElementById(id); }

  function renderHero(site) {
    var h = site.hero;
    var textEl = byId("hero-text");
    if (textEl) {
      textEl.innerHTML =
        '<p class="hero-eyebrow" data-reveal>' + bi(h.eyebrow_fr, h.eyebrow_en) + "</p>" +
        "<h1 data-reveal>" + esc(h.name).replace(/\s+/g, "<br>") + "</h1>" +
        '<p class="hero-role" data-reveal>' + bi(h.role_fr, h.role_en) + "</p>" +
        '<p class="hero-lede" data-reveal>' + bi(h.lede_fr, h.lede_en) + "</p>" +
        '<div class="hero-cta" data-reveal>' +
          '<a href="#projets" class="btn btn-primary">' + bi(h.cta_primary_fr, h.cta_primary_en) + "</a>" +
          '<a href="#contact" class="btn btn-outline">' + bi(h.cta_secondary_fr, h.cta_secondary_en) + "</a>" +
        "</div>" +
        '<ul class="hero-meta" data-reveal>' +
          "<li>" + esc(h.location) + "</li>" +
          "<li>" + esc(h.languages) + "</li>" +
          "<li>" + bi(h.meta_note_fr, h.meta_note_en) + "</li>" +
        "</ul>";
    }
    var visualEl = byId("hero-visual");
    if (visualEl) {
      visualEl.innerHTML = imgOrPlaceholder(h.image, "portrait plein cadre — à ajouter", "full-frame portrait — to add");
    }
    var cvLink = byId("cv-link");
    if (cvLink && site.contact && site.contact.cv_url) cvLink.setAttribute("href", site.contact.cv_url);
  }

  function renderProfil(site) {
    var p = site.profil;
    var bodyEl = byId("profil-body");
    if (bodyEl) {
      var statsHtml = (p.stats || []).map(function (s) {
        return '<div><div class="stat-num">' + esc(s.number) + '</div><div class="stat-label">' + bi(s.label_fr, s.label_en) + "</div></div>";
      }).join("");
      bodyEl.innerHTML +=
        '<div lang="fr">' + nl2p(p.body_fr) + "</div>" +
        '<div lang="en">' + nl2p(p.body_en) + "</div>" +
        '<div class="stat-row" data-reveal>' + statsHtml + "</div>";
    }
    var visualEl = byId("profil-visual");
    if (visualEl) visualEl.innerHTML = imgOrPlaceholder(p.image, "photo portrait — à ajouter", "portrait photo — to add");
  }

  function renderQuote(site) {
    var q = site.quote;
    var el = byId("quote-section");
    if (!el) return;
    el.innerHTML =
      '<div class="container">' +
        '<p class="quote-text" data-reveal>' + bi(q.text_fr, q.text_en) + "</p>" +
        '<p class="quote-label" data-reveal>' + bi(q.label_fr, q.label_en) + "</p>" +
      "</div>";
  }

  function renderContact(site) {
    var c = site.contact;
    var rowsEl = byId("contact-rows");
    if (rowsEl) {
      rowsEl.innerHTML =
        '<div class="contact-row"><span class="contact-row-label">LINKEDIN</span><a class="contact-row-value" href="' + esc(c.linkedin_url) + '" target="_blank" rel="noopener">' + esc(c.linkedin_label) + "</a></div>" +
        '<div class="contact-row"><span class="contact-row-label">' + bi("EMAIL", "EMAIL") + '</span><a class="contact-row-value" href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></div>" +
        '<div class="contact-row"><span class="contact-row-label">' + bi("TÉLÉPHONE", "PHONE") + '</span><a class="contact-row-value" href="tel:' + esc(c.phone_tel) + '">' + esc(c.phone_display) + "</a></div>";
    }
    var ctaEl = byId("contact-cta");
    if (ctaEl) {
      ctaEl.innerHTML =
        '<a href="' + esc(c.cv_url || "#") + '" class="btn btn-primary">' + bi("Télécharger mon CV (PDF)", "Download my CV (PDF)") + "</a>" +
        '<a href="mailto:' + esc(c.email) + '" class="btn btn-outline">' + bi("M’écrire un email", "Send me an email") + "</a>";
    }
    var visualEl = byId("contact-visual");
    if (visualEl) visualEl.innerHTML = imgOrPlaceholder(c.image, "illustration / avatar — à ajouter", "illustration / avatar — to add");
  }

  function renderFooter(site) {
    var el = byId("footer-inner");
    if (!el) return;
    var f = site.footer;
    el.innerHTML =
      "<span>" + esc(f.name_line) + " — " + bi("PORTFOLIO", "PORTFOLIO") + ' <span id="year"></span></span>' +
      "<span>" + esc(f.location) + "</span>";
    var yearEl = byId("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function renderSkills(list) {
    var track = byId("skills-track");
    if (!track) return;
    track.innerHTML = list.map(function (cat, i) {
      var counter = String(i + 1).padStart(2, "0") + "/" + String(list.length).padStart(2, "0");
      var body;
      if (cat.languages) {
        body = '<div class="lang-grid">' + cat.languages.map(function (l) {
          return '<div class="lang-row"><strong>' + bi(l.name_fr, l.name_en) + "</strong><em>" + bi(l.level_fr, l.level_en) + "</em></div>";
        }).join("") + "</div>";
      } else {
        body = "<ul>" + (cat.items || []).map(function (it) {
          return "<li>" + bi(it.fr, it.en) + "</li>";
        }).join("") + "</ul>";
      }
      return '<div class="skill-card" data-reveal>' +
        '<div class="card-top-row"><span class="card-eyebrow">' + bi(cat.title_fr.toUpperCase(), cat.title_en.toUpperCase()) + '</span><span class="card-counter">' + counter + "</span></div>" +
        body +
        "</div>";
    }).join("");
  }

  function renderExperiences(list) {
    var track = byId("experiences-track");
    if (!track) return;
    track.innerHTML = list.map(function (e, i) {
      var counter = String(i + 1).padStart(2, "0") + "/" + String(list.length).padStart(2, "0");
      var items = "<ul>" + (e.items || []).map(function (it) { return "<li>" + bi(it.fr, it.en) + "</li>"; }).join("") + "</ul>";
      var result = e.result_fr ? '<p class="exp-result">' + bi(e.result_fr, e.result_en) + "</p>" : "";
      return '<article class="exp-card" data-reveal>' +
        '<div class="card-top-row"><span class="exp-date">' + esc(e.date) + '</span><span class="card-counter">' + counter + "</span></div>" +
        "<h3>" + bi(e.title_fr, e.title_en) + "</h3>" +
        '<p class="exp-org">' + bi(e.org_fr, e.org_en) + "</p>" +
        items + result +
        "</article>";
    }).join("");
  }

  function renderEducation(list) {
    var el = byId("education-list");
    if (!el) return;
    el.innerHTML = list.map(function (ed) {
      var org = ed.org_fr ? bi(ed.org_fr, ed.org_en) : esc(ed.org || "");
      return '<div class="edu-row" data-reveal>' +
        '<span class="edu-date">' + esc(ed.date) + "</span>" +
        "<div><h3 class=\"edu-title\">" + bi(ed.title_fr, ed.title_en) + "</h3>" + (org ? '<p class="edu-org">' + org + "</p>" : "") + "</div>" +
        '<div class="edu-logo">' + imgOrPlaceholder(ed.logo, "", "", "ph-light") + "</div>" +
        "</div>";
    }).join("");
  }

  function renderProjects(list) {
    var track = byId("projects-track");
    if (!track) return;
    track.innerHTML = list.map(function (p, i) {
      var counter = String(i + 1).padStart(2, "0") + "/" + String(list.length).padStart(2, "0");
      var href = (window.__PORTFOLIO_BASE__ || "") + "projects/project.html?slug=" + encodeURIComponent(p.slug);
      return '<a class="project-card" href="' + href + '">' +
        imgOrPlaceholder(p.image, "capture — à ajouter", "screenshot — to add", "project-thumb") +
        '<div class="project-meta-row"><h3>' + bi(p.category_fr, p.category_en) + '</h3><span class="card-counter">' + counter + "</span></div>" +
        '<span class="project-tag">' + bi(p.tag_fr, p.tag_en) + "</span>" +
        "</a>";
    }).join("");
  }

  function renderFormations(list) {
    var el = byId("formations-list");
    if (!el) return;
    el.innerHTML = list.map(function (f) {
      return '<div class="formation-row" data-reveal>' +
        "<h3>" + bi(f.title_fr, f.title_en) + "</h3>" +
        "<p>" + bi(f.desc_fr, f.desc_en) + "</p>" +
        "</div>";
    }).join("");
  }

  function renderTools(data) {
    var badgesEl = byId("tool-badges");
    if (badgesEl) {
      badgesEl.innerHTML = (data.badges || []).map(function (b) {
        return '<div class="tool-badge">' + esc(b) + "</div>";
      }).join("");
    }
    var groupsEl = byId("tool-groups");
    if (groupsEl) {
      groupsEl.innerHTML = (data.groups || []).map(function (g) {
        var items = (g.items || []).map(function (it) {
          return "<li><strong>" + esc(it.name) + "</strong> — " + bi(it.desc_fr, it.desc_en) + "</li>";
        }).join("");
        return '<div class="tool-group"><h4>' + bi(g.title_fr, g.title_en) + "</h4><ul>" + items + "</ul></div>";
      }).join("");
    }
  }

  function renderPassions(list) {
    var track = byId("passions-track");
    if (!track) return;
    track.innerHTML = list.map(function (p) {
      return '<div class="passion-card" data-reveal>' +
        imgOrPlaceholder(p.image, "photo — à ajouter", "photo — to add", "passion-thumb") +
        '<div class="passion-body"><h3>' + bi(p.title_fr, p.title_en) + "</h3>" +
        '<span class="passion-more">' + bi("En découvrir plus", "Find out more") + "</span></div>" +
        "</div>";
    }).join("");
  }

  function init() {
    Promise.all([
      fetchJSON("content/site.json"),
      fetchJSON("content/skills.json"),
      fetchJSON("content/experiences.json"),
      fetchJSON("content/education.json"),
      fetchJSON("content/projects.json"),
      fetchJSON("content/formations.json"),
      fetchJSON("content/tools.json"),
      fetchJSON("content/passions.json")
    ]).then(function (results) {
      var site = results[0];
      renderHero(site);
      renderProfil(site);
      renderQuote(site);
      renderContact(site);
      renderFooter(site);
      renderSkills(results[1].items);
      renderExperiences(results[2].items);
      renderEducation(results[3].items);
      renderProjects(results[4].items);
      renderFormations(results[5].items);
      renderTools(results[6]);
      renderPassions(results[7].items);
      if (site.theme && window.PortfolioUI) window.PortfolioUI.applyTheme(site.theme);
      if (window.PortfolioUI) window.PortfolioUI.refresh();
    }).catch(function (err) {
      console.error("Content load error:", err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

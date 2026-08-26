/* Live preview templates for Decap CMS — reuses the real site CSS so the
   preview pane looks like the actual published page. `H` (createElement)
   and `createClass` are exposed globally by the CMS bundle. */
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
  function ph(caption, extraClass) {
    return '<div class="ph ' + (extraClass || "") + '" style="position:relative;min-height:120px;">' +
      '<span class="ph-caption">' + esc(caption || "image à ajouter") + "</span></div>";
  }

  var FONT_PAIRINGS = {
    archivo: { heading: '"Archivo", sans-serif', body: '"Archivo", sans-serif' },
    playfair: { heading: '"Playfair Display", serif', body: '"Inter", sans-serif' },
    poppins: { heading: '"Poppins", sans-serif', body: '"Poppins", sans-serif' },
    montserrat: { heading: '"Montserrat", sans-serif', body: '"Source Sans 3", sans-serif' }
  };

  var publishedThemeCache = null;
  function fetchPublishedTheme(callback) {
    if (publishedThemeCache) { callback(publishedThemeCache); return; }
    fetch("/content/site.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (site) {
        publishedThemeCache = (site && site.theme) || {};
        callback(publishedThemeCache);
      })
      .catch(function () { callback({}); });
  }

  function themeStyle(theme) {
    theme = theme || {};
    var pairing = FONT_PAIRINGS[theme.font_pairing] || FONT_PAIRINGS.archivo;
    var css = {};
    if (theme.accent) css["--accent"] = theme.accent;
    if (theme.dark) css["--dark"] = theme.dark;
    if (theme.cream) css["--cream"] = theme.cream;
    css["--font-heading"] = pairing.heading;
    css["--font-body"] = pairing.body;
    return css;
  }

  // Wrapper component: fetches the currently-published theme once, applies
  // it as inline CSS vars, then renders `renderHtml(data)` inside.
  function makeThemedPreview(renderHtml) {
    return createClass({
      getInitialState: function () { return { theme: publishedThemeCache || {} }; },
      componentDidMount: function () {
        var self = this;
        fetchPublishedTheme(function (theme) { self.setState({ theme: theme }); });
      },
      render: function () {
        var data = this.props.entry.getIn(["data"]);
        var obj = data ? data.toJS() : {};
        return H(
          "div",
          { style: themeStyle(this.state.theme), className: "preview-root" },
          H("div", { dangerouslySetInnerHTML: { __html: renderHtml(obj, this.props) } })
        );
      }
    });
  }

  function assetUrl(props, path) {
    if (!path) return "";
    try {
      var asset = props.getAsset(path);
      return asset ? asset.toString() : "";
    } catch (e) {
      return "";
    }
  }

  /* ---------- Site (hero / profil / quote / contact) ---------- */
  var SitePreview = createClass({
    getInitialState: function () { return {}; },
    render: function () {
      var data = this.props.entry.getIn(["data"]);
      var d = data ? data.toJS() : {};
      var hero = d.hero || {};
      var profil = d.profil || {};
      var quote = d.quote || {};
      var contact = d.contact || {};
      var theme = d.theme || {};
      var heroImg = assetUrl(this.props, hero.image);
      var profilImg = assetUrl(this.props, profil.image);

      var statsHtml = (profil.stats || []).map(function (s) {
        return '<div style="margin-right:32px;"><div class="stat-num">' + esc(s.number) + '</div>' +
          '<div class="stat-label">' + esc(s.label_fr) + "</div></div>";
      }).join("");

      var html =
        '<section class="hero" style="padding-top:0;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">' +
            '<div class="hero-text" style="padding:32px 20px;">' +
              '<p class="hero-eyebrow">' + esc(hero.eyebrow_fr) + "</p>" +
              "<h1>" + esc(hero.name || "").replace(/\s+/g, "<br>") + "</h1>" +
              '<p class="hero-role">' + esc(hero.role_fr) + "</p>" +
              '<p class="hero-lede">' + esc(hero.lede_fr) + "</p>" +
            "</div>" +
            (heroImg
              ? '<img src="' + heroImg + '" style="width:100%;height:100%;object-fit:cover;">'
              : ph("portrait — à ajouter")) +
          "</div>" +
        "</section>" +
        '<section class="section">' +
          '<div style="padding:32px 20px;">' +
            '<p class="section-label"><span class="accent">01 —</span> PROFIL</p>' +
            '<h2 class="section-title">Qui suis-je ?</h2>' +
            nl2p(profil.body_fr) +
            '<div style="display:flex;flex-wrap:wrap;margin-top:20px;">' + statsHtml + "</div>" +
            (profilImg ? '<img src="' + profilImg + '" style="max-width:220px;border-radius:10px;margin-top:20px;">' : "") +
          "</div>" +
        "</section>" +
        '<section class="section section-dark quote-section" style="padding:48px 0;">' +
          '<div style="padding:0 20px;">' +
            '<p class="quote-text" style="font-size:1.5rem;">' + esc(quote.text_fr) + "</p>" +
            '<p class="quote-label">' + esc(quote.label_fr) + "</p>" +
          "</div>" +
        "</section>" +
        '<section class="section section-dark">' +
          '<div style="padding:32px 20px;">' +
            '<p class="section-label"><span class="accent">09 —</span> CONTACT</p>' +
            '<h2 class="contact-title" style="font-size:2.2rem;">Contact me</h2>' +
            '<div class="contact-rows">' +
              '<div class="contact-row"><span class="contact-row-label">EMAIL</span><span class="contact-row-value">' + esc(contact.email) + "</span></div>" +
              '<div class="contact-row"><span class="contact-row-label">TÉLÉPHONE</span><span class="contact-row-value">' + esc(contact.phone_display) + "</span></div>" +
            "</div>" +
          "</div>" +
        "</section>";

      return H("div", { style: themeStyle(theme), className: "preview-root" },
        H("div", { dangerouslySetInnerHTML: { __html: html } }));
    }
  });

  /* ---------- Skills ---------- */
  var SkillsPreview = makeThemedPreview(function (d) {
    var items = d.items || [];
    var cards = items.map(function (cat) {
      var body;
      if (cat.languages && cat.languages.length) {
        body = '<div class="lang-grid">' + cat.languages.map(function (l) {
          return '<div class="lang-row"><strong>' + esc(l.name_fr) + "</strong><em>" + esc(l.level_fr) + "</em></div>";
        }).join("") + "</div>";
      } else {
        body = "<ul>" + (cat.items || []).map(function (it) { return "<li>" + esc(it.fr) + "</li>"; }).join("") + "</ul>";
      }
      return '<div class="skill-card" style="margin-bottom:16px;"><div class="card-top-row"><span class="card-eyebrow">' +
        esc((cat.title_fr || "").toUpperCase()) + "</span></div>" + body + "</div>";
    }).join("");
    return '<div class="section"><div style="padding:24px 16px;"><h2 class="section-title">Ce que je sais faire</h2>' + cards + "</div></div>";
  });

  /* ---------- Experiences ---------- */
  var ExperiencesPreview = makeThemedPreview(function (d) {
    var items = d.items || [];
    var cards = items.map(function (e) {
      var list = "<ul>" + (e.items || []).map(function (it) { return "<li>" + esc(it.fr) + "</li>"; }).join("") + "</ul>";
      var result = e.result_fr ? '<p class="exp-result">' + esc(e.result_fr) + "</p>" : "";
      return '<article class="exp-card" style="margin-bottom:16px;"><span class="exp-date">' + esc(e.date) + "</span>" +
        "<h3>" + esc(e.title_fr) + "</h3><p class=\"exp-org\">" + esc(e.org_fr) + "</p>" + list + result + "</article>";
    }).join("");
    return '<div class="section section-white"><div style="padding:24px 16px;"><h2 class="section-title">Expériences</h2>' + cards + "</div></div>";
  });

  /* ---------- Education ---------- */
  var EducationPreview = makeThemedPreview(function (d) {
    var items = d.items || [];
    var rows = items.map(function (ed) {
      return '<div class="edu-row" style="grid-template-columns:100px 1fr;"><span class="edu-date">' + esc(ed.date) + "</span>" +
        "<div><h3 class=\"edu-title\">" + esc(ed.title_fr) + "</h3><p class=\"edu-org\">" + esc(ed.org_fr || ed.org) + "</p></div></div>";
    }).join("");
    return '<div class="section"><div style="padding:24px 16px;"><h2 class="section-title">Parcours académique</h2>' + rows + "</div></div>";
  });

  /* ---------- Projects ---------- */
  var ProjectsPreview = createClass({
    getInitialState: function () { return { theme: publishedThemeCache || {} }; },
    componentDidMount: function () {
      var self = this;
      fetchPublishedTheme(function (theme) { self.setState({ theme: theme }); });
    },
    render: function () {
      var data = this.props.entry.getIn(["data"]);
      var d = data ? data.toJS() : {};
      var items = d.items || [];
      var props = this.props;
      var cards = items.map(function (p) {
        var img = assetUrl(props, p.image);
        return '<a class="project-card" style="margin-bottom:20px;display:block;">' +
          (img ? '<img class="project-thumb" src="' + img + '" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;">' : ph("capture — à ajouter", "project-thumb")) +
          '<div class="project-meta-row"><h3>' + esc(p.category_fr) + "</h3></div>" +
          '<span class="project-tag">' + esc(p.tag_fr) + "</span>" +
          "<h4 style=\"margin:6px 0 0;\">" + esc(p.title_fr) + "</h4>" +
        "</a>";
      }).join("");
      var html = '<div class="section section-dark"><div style="padding:24px 16px;"><h2 class="section-title">Mes réalisations</h2>' + cards + "</div></div>";
      return H("div", { style: themeStyle(this.state.theme), className: "preview-root" },
        H("div", { dangerouslySetInnerHTML: { __html: html } }));
    }
  });

  /* ---------- Formations ---------- */
  var FormationsPreview = makeThemedPreview(function (d) {
    var items = d.items || [];
    var rows = items.map(function (f) {
      return '<div class="formation-row"><h3>' + esc(f.title_fr) + "</h3><p>" + esc(f.desc_fr) + "</p></div>";
    }).join("");
    return '<div class="section"><div style="padding:24px 16px;"><h2 class="section-title">Certifications &amp; formations</h2>' + rows + "</div></div>";
  });

  /* ---------- Tools ---------- */
  var ToolsPreview = makeThemedPreview(function (d) {
    var badges = (d.badges || []).map(function (b) { return '<div class="tool-badge">' + esc(b) + "</div>"; }).join("");
    var groups = (d.groups || []).map(function (g) {
      var items = (g.items || []).map(function (it) { return "<li><strong>" + esc(it.name) + "</strong> — " + esc(it.desc_fr) + "</li>"; }).join("");
      return '<div class="tool-group"><h4>' + esc(g.title_fr) + "</h4><ul>" + items + "</ul></div>";
    }).join("");
    return '<div class="section section-soft"><div style="padding:24px 16px;"><h2 class="section-title">Outils</h2>' +
      '<div class="tool-badges" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px;">' + badges + "</div>" +
      '<div class="tool-groups">' + groups + "</div></div></div>";
  });

  /* ---------- Passions ---------- */
  var PassionsPreview = createClass({
    getInitialState: function () { return { theme: publishedThemeCache || {} }; },
    componentDidMount: function () {
      var self = this;
      fetchPublishedTheme(function (theme) { self.setState({ theme: theme }); });
    },
    render: function () {
      var data = this.props.entry.getIn(["data"]);
      var d = data ? data.toJS() : {};
      var items = d.items || [];
      var props = this.props;
      var cards = items.map(function (p) {
        var img = assetUrl(props, p.image);
        return '<div class="passion-card" style="margin-bottom:16px;">' +
          (img ? '<img class="passion-thumb" src="' + img + '" style="width:100%;aspect-ratio:3/4;object-fit:cover;">' : ph("photo — à ajouter", "passion-thumb")) +
          '<div class="passion-body"><h3>' + esc(p.title_fr) + "</h3></div>" +
        "</div>";
      }).join("");
      var html = '<div class="section section-soft"><div style="padding:24px 16px;"><h2 class="section-title">Mes passions</h2>' + cards + "</div></div>";
      return H("div", { style: themeStyle(this.state.theme), className: "preview-root" },
        H("div", { dangerouslySetInnerHTML: { __html: html } }));
    }
  });

  /* ---------- Custom sections ---------- */
  var SECTION_BG_CLASS = { cream: "section", white: "section section-white", dark: "section section-dark", soft: "section section-soft" };
  var SectionsPreview = createClass({
    getInitialState: function () { return { theme: publishedThemeCache || {} }; },
    componentDidMount: function () {
      var self = this;
      fetchPublishedTheme(function (theme) { self.setState({ theme: theme }); });
    },
    render: function () {
      var data = this.props.entry.getIn(["data"]);
      var d = data ? data.toJS() : {};
      var items = d.items || [];
      var props = this.props;
      var html = items.map(function (s) {
        var cls = SECTION_BG_CLASS[s.style] || SECTION_BG_CLASS.cream;
        var img = assetUrl(props, s.image);
        return '<div class="' + cls + '" style="margin-bottom:12px;"><div style="padding:24px 16px;">' +
          (img ? '<img src="' + img + '" style="width:100%;border-radius:10px;margin-bottom:16px;">' : "") +
          '<h2 class="section-title">' + esc(s.title_fr) + "</h2>" +
          '<div class="custom-section-body">' + nl2p(s.body_fr) + "</div>" +
          '<p style="margin-top:12px;font-family:var(--font-mono);font-size:0.75rem;opacity:0.6;">Menu : ' + esc(s.nav_label_fr) + "</p>" +
        "</div></div>";
      }).join("") || '<p style="padding:16px;opacity:0.6;">Aucune section pour l’instant — ajoute-en une ci-dessus.</p>';
      return H("div", { style: themeStyle(this.state.theme), className: "preview-root" },
        H("div", { dangerouslySetInnerHTML: { __html: html } }));
    }
  });

  var GOOGLE_FONT_URLS = [
    "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap",
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Source+Sans+3:wght@400;500;600;700&display=swap"
  ];
  GOOGLE_FONT_URLS.forEach(function (url) {
    CMS.registerPreviewStyle(url, { raw: true });
  });
  CMS.registerPreviewStyle("/css/style.css");
  CMS.registerPreviewStyle(
    "body{margin:0;background:var(--cream);} .preview-root{min-height:100%;}",
    { raw: true }
  );

  CMS.registerPreviewTemplate("site", SitePreview);
  CMS.registerPreviewTemplate("skills", SkillsPreview);
  CMS.registerPreviewTemplate("experiences", ExperiencesPreview);
  CMS.registerPreviewTemplate("education", EducationPreview);
  CMS.registerPreviewTemplate("projects", ProjectsPreview);
  CMS.registerPreviewTemplate("formations", FormationsPreview);
  CMS.registerPreviewTemplate("tools", ToolsPreview);
  CMS.registerPreviewTemplate("passions", PassionsPreview);
  CMS.registerPreviewTemplate("sections", SectionsPreview);
})();

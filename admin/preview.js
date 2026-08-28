/* Live preview templates for Decap CMS — reuses the real site CSS so the
   preview pane looks like the actual published page. `h` (createElement)
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
  // Rich-text fields store real HTML (from the "richtext" widget). Older
  // entries still hold plain text — detect and fall back to nl2p for those.
  function richHtml(str) {
    if (!str) return "";
    if (/<[a-z][\s\S]*>/i.test(str)) return str;
    return nl2p(str);
  }

  /* ---------- Click-to-jump: click an element in the preview to scroll to
     and focus the matching field in the /admin sidebar form (à la Shopify:
     cliquer sur un bloc à droite ouvre/pointe le bon réglage à gauche).
     Decap CMS renders this preview inside an iframe, so we reach into
     window.parent's document. There is no public Decap API for this — it
     works by matching the visible field label text, so it stays in sync
     with the `label:` strings in admin/config.yml. Best-effort only: if
     Decap's markup doesn't match what we expect, it silently does nothing
     rather than breaking the page. ---------- */
  function findByText(root, text) {
    if (!root || !text) return null;
    var trimmed = text.trim();
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var node = all[i];
      if (node.children.length === 0 && node.textContent && node.textContent.trim() === trimmed) {
        return node;
      }
    }
    return null;
  }

  function flashHighlight(el) {
    if (!el || !el.style) return;
    var prevOutline = el.style.outline;
    var prevOffset = el.style.outlineOffset;
    el.style.outline = "3px solid #6b2fb3";
    el.style.outlineOffset = "2px";
    setTimeout(function () {
      el.style.outline = prevOutline;
      el.style.outlineOffset = prevOffset;
    }, 1400);
  }

  function jumpToField(labelText, sectionLabelText, _retried) {
    try {
      var doc = window.parent && window.parent.document;
      if (!doc || !labelText) return;
      // Scope the label search to the clicked section's own content, so
      // fields that share the same label text across sections (e.g. two
      // "Texte (FR)" fields) resolve to the right one. Accordion headers
      // in Decap are typically followed by their content as the next
      // sibling — try that first (most precise), then widen if needed.
      var scope = doc.body;
      var header = sectionLabelText ? findByText(doc.body, sectionLabelText) : null;
      if (header && header.nextElementSibling && findByText(header.nextElementSibling, labelText)) {
        scope = header.nextElementSibling;
      } else if (header) {
        var candidate = header;
        for (var lvl = 0; lvl < 6 && candidate; lvl++) {
          candidate = candidate.parentElement;
          if (candidate && candidate.querySelectorAll("input, textarea, select").length >= 1 && findByText(candidate, labelText)) {
            scope = candidate;
            break;
          }
        }
      }
      var label = findByText(scope, labelText);
      if (!label && scope !== doc.body) label = findByText(doc.body, labelText);
      if (!label) {
        if (!_retried && header) {
          header.click();
          setTimeout(function () { jumpToField(labelText, sectionLabelText, true); }, 250);
        }
        return;
      }
      // Find the nearest form control that comes AFTER the label in
      // document order (the label-precedes-control pattern holds regardless
      // of whether Decap wraps each field individually or renders them as
      // flat siblings — unlike walking ancestors and taking the first
      // descendant input, which can grab an unrelated earlier field).
      var target = null;
      var candidates = doc.body.querySelectorAll('input, textarea, [contenteditable="true"], select');
      for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        if (label.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) { target = c; break; }
      }
      var focusEl = target || label;
      focusEl.scrollIntoView({ behavior: "smooth", block: "center" });
      if (focusEl.focus) focusEl.focus();
      flashHighlight(focusEl === label ? label : (target.closest ? (target.closest("div") || target) : target));
    } catch (e) { /* best-effort only */ }
  }

  function jumpOnClick(labelText, sectionLabelText) {
    return function () { jumpToField(labelText, sectionLabelText); };
  }

  function jumpOnClickMap(map) {
    return function (e) {
      var el = e.target;
      for (var i = 0; i < map.length; i++) {
        var m = map[i];
        var match = el.closest && el.closest(m.selector);
        if (match) { jumpToField(m.label, m.section); return; }
      }
    };
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
  // it as inline CSS vars, then renders `renderHtml(data)` inside. Clicking
  // anywhere in the preview jumps the sidebar form to `jumpLabel` (a field
  // label from config.yml) — these collections show one field per screen,
  // so any click in the preview can safely jump to that one field.
  function makeThemedPreview(renderHtml, jumpLabel, jumpSection) {
    return createClass({
      getInitialState: function () { return { theme: publishedThemeCache || {} }; },
      componentDidMount: function () {
        var self = this;
        fetchPublishedTheme(function (theme) { self.setState({ theme: theme }); });
      },
      render: function () {
        var data = this.props.entry.getIn(["data"]);
        var obj = data ? data.toJS() : {};
        var wrapperProps = { style: themeStyle(this.state.theme), className: "preview-root" };
        if (jumpLabel) wrapperProps.onClick = jumpOnClick(jumpLabel, jumpSection);
        return h(
          "div",
          wrapperProps,
          h("div", { dangerouslySetInnerHTML: { __html: renderHtml(obj, this.props) } })
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
  // Ordered most-specific-first: closest() checks each rule in turn, so a
  // click on the h1 must match ".hero h1" before it falls through to the
  // generic ".hero" catch-all.
  var SITE_CLICK_MAP = [
    { selector: ".hero-eyebrow", label: "Bandeau (FR)", section: "Photo de couverture (hero)" },
    { selector: ".hero-lede", label: "Texte d'intro (FR)", section: "Photo de couverture (hero)" },
    { selector: ".hero h1", label: "Nom affiché", section: "Photo de couverture (hero)" },
    { selector: ".hero", label: "Texte d'intro (FR)", section: "Photo de couverture (hero)" },
    { selector: ".section:not(.section-dark)", label: "Texte (FR)", section: "Profil" },
    { selector: ".quote-section", label: "Texte (FR)", section: "Citation" },
    { selector: ".contact-title", label: "Email", section: "Contact" },
    { selector: ".contact-rows", label: "Email", section: "Contact" }
  ];
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
        '<section class="hero" title="Modifiable dans le champ Hero" style="padding-top:0;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">' +
            '<div class="hero-text" style="padding:32px 20px;">' +
              '<p class="hero-eyebrow">' + esc(hero.eyebrow_fr) + "</p>" +
              "<h1>" + esc(hero.name || "").replace(/\s+/g, "<br>") + "</h1>" +
              '<p class="hero-role">' + esc(hero.role_fr) + "</p>" +
              '<div class="hero-lede">' + richHtml(hero.lede_fr) + "</div>" +
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
            richHtml(profil.body_fr) +
            '<div style="display:flex;flex-wrap:wrap;margin-top:20px;">' + statsHtml + "</div>" +
            (profilImg ? '<img src="' + profilImg + '" style="max-width:220px;border-radius:10px;margin-top:20px;">' : "") +
          "</div>" +
        "</section>" +
        '<section class="section section-dark quote-section" style="padding:48px 0;">' +
          '<div style="padding:0 20px;">' +
            '<p class="quote-text" title="Modifiable dans le champ Citation" style="font-size:1.5rem;">' + esc(quote.text_fr) + "</p>" +
            '<p class="quote-label">' + esc(quote.label_fr) + "</p>" +
          "</div>" +
        "</section>" +
        '<section class="section section-dark">' +
          '<div style="padding:32px 20px;">' +
            '<p class="section-label"><span class="accent">09 —</span> CONTACT</p>' +
            '<h2 class="contact-title" title="Modifiable dans le champ Contact" style="font-size:2.2rem;">Contact me</h2>' +
            '<div class="contact-rows">' +
              '<div class="contact-row"><span class="contact-row-label">EMAIL</span><span class="contact-row-value">' + esc(contact.email) + "</span></div>" +
              '<div class="contact-row"><span class="contact-row-label">TÉLÉPHONE</span><span class="contact-row-value">' + esc(contact.phone_display) + "</span></div>" +
            "</div>" +
          "</div>" +
        "</section>";

      return h("div", { style: themeStyle(theme), className: "preview-root", onClick: jumpOnClickMap(SITE_CLICK_MAP) },
        h("div", { dangerouslySetInnerHTML: { __html: html } }));
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
      return '<div class="skill-card" title="Modifiable dans la liste Catégories" style="margin-bottom:16px;"><div class="card-top-row"><span class="card-eyebrow">' +
        esc((cat.title_fr || "").toUpperCase()) + "</span></div>" + body + "</div>";
    }).join("");
    return '<div class="section"><div style="padding:24px 16px;"><h2 class="section-title">Ce que je sais faire</h2>' + cards + "</div></div>";
  }, "Catégories");

  /* ---------- Experiences ---------- */
  var ExperiencesPreview = makeThemedPreview(function (d) {
    var items = d.items || [];
    var cards = items.map(function (e) {
      var list = "<ul>" + (e.items || []).map(function (it) { return "<li>" + esc(it.fr) + "</li>"; }).join("") + "</ul>";
      var result = e.result_fr ? '<p class="exp-result">' + esc(e.result_fr) + "</p>" : "";
      return '<article class="exp-card" title="Modifiable dans la liste Expériences" style="margin-bottom:16px;"><span class="exp-date">' + esc(e.date) + "</span>" +
        "<h3>" + esc(e.title_fr) + "</h3><p class=\"exp-org\">" + esc(e.org_fr) + "</p>" + list + result + "</article>";
    }).join("");
    return '<div class="section section-white"><div style="padding:24px 16px;"><h2 class="section-title">Expériences</h2>' + cards + "</div></div>";
  }, "Expériences");

  /* ---------- Education ---------- */
  var EducationPreview = makeThemedPreview(function (d) {
    var items = d.items || [];
    var rows = items.map(function (ed) {
      return '<div class="edu-row" title="Modifiable dans la liste Diplômes" style="grid-template-columns:100px 1fr;"><span class="edu-date">' + esc(ed.date) + "</span>" +
        "<div><h3 class=\"edu-title\">" + esc(ed.title_fr) + "</h3><p class=\"edu-org\">" + esc(ed.org_fr || ed.org) + "</p></div></div>";
    }).join("");
    return '<div class="section"><div style="padding:24px 16px;"><h2 class="section-title">Parcours académique</h2>' + rows + "</div></div>";
  }, "Diplômes");

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
        return '<a class="project-card" title="Modifiable dans la liste Projets" style="margin-bottom:20px;display:block;">' +
          (img ? '<img class="project-thumb" src="' + img + '" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;">' : ph("capture — à ajouter", "project-thumb")) +
          '<div class="project-meta-row"><h3>' + esc(p.category_fr) + "</h3></div>" +
          '<span class="project-tag">' + esc(p.tag_fr) + "</span>" +
          "<h4 style=\"margin:6px 0 0;\">" + esc(p.title_fr) + "</h4>" +
        "</a>";
      }).join("");
      var html = '<div class="section section-dark"><div style="padding:24px 16px;"><h2 class="section-title">Mes réalisations</h2>' + cards + "</div></div>";
      return h("div", { style: themeStyle(this.state.theme), className: "preview-root", onClick: jumpOnClick("Projets") },
        h("div", { dangerouslySetInnerHTML: { __html: html } }));
    }
  });

  /* ---------- Formations ---------- */
  var FormationsPreview = makeThemedPreview(function (d) {
    var items = d.items || [];
    var rows = items.map(function (f) {
      return '<div class="formation-row" title="Modifiable dans la liste Formations"><h3>' + esc(f.title_fr) + "</h3><p>" + esc(f.desc_fr) + "</p></div>";
    }).join("");
    return '<div class="section"><div style="padding:24px 16px;"><h2 class="section-title">Certifications &amp; formations</h2>' + rows + "</div></div>";
  }, "Formations");

  /* ---------- Tools ---------- */
  var ToolsPreview = makeThemedPreview(function (d) {
    var badges = (d.badges || []).map(function (b) { return '<div class="tool-badge" title="Modifiable dans Badges">' + esc(b) + "</div>"; }).join("");
    var groups = (d.groups || []).map(function (g) {
      var items = (g.items || []).map(function (it) { return "<li><strong>" + esc(it.name) + "</strong> — " + esc(it.desc_fr) + "</li>"; }).join("");
      return '<div class="tool-group"><h4>' + esc(g.title_fr) + "</h4><ul>" + items + "</ul></div>";
    }).join("");
    return '<div class="section section-soft"><div style="padding:24px 16px;"><h2 class="section-title">Outils</h2>' +
      '<div class="tool-badges" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px;">' + badges + "</div>" +
      '<div class="tool-groups">' + groups + "</div></div></div>";
  }, "Badges (liste simple de noms)");

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
        return '<div class="passion-card" title="Modifiable dans la liste Passions" style="margin-bottom:16px;">' +
          (img ? '<img class="passion-thumb" src="' + img + '" style="width:100%;aspect-ratio:3/4;object-fit:cover;">' : ph("photo — à ajouter", "passion-thumb")) +
          '<div class="passion-body"><h3>' + esc(p.title_fr) + "</h3></div>" +
        "</div>";
      }).join("");
      var html = '<div class="section section-soft"><div style="padding:24px 16px;"><h2 class="section-title">Mes passions</h2>' + cards + "</div></div>";
      return h("div", { style: themeStyle(this.state.theme), className: "preview-root", onClick: jumpOnClick("Passions") },
        h("div", { dangerouslySetInnerHTML: { __html: html } }));
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
          '<div class="custom-section-body" title="Modifiable dans le champ Texte">' + richHtml(s.body_fr) + "</div>" +
          '<p style="margin-top:12px;font-family:var(--font-mono);font-size:0.75rem;opacity:0.6;">Menu : ' + esc(s.nav_label_fr) + "</p>" +
        "</div></div>";
      }).join("") || '<p style="padding:16px;opacity:0.6;">Aucune section pour l’instant — ajoute-en une ci-dessus.</p>';
      return h("div", { style: themeStyle(this.state.theme), className: "preview-root", onClick: jumpOnClick("Sections") },
        h("div", { dangerouslySetInnerHTML: { __html: html } }));
    }
  });

  var GOOGLE_FONT_URLS = [
    "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap",
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Source+Sans+3:wght@400;500;600;700&display=swap"
  ];
  /* ---------- Custom widget: color picker + preset swatches ---------- */
  var DEFAULT_COLOR_PRESETS = ["#6b2fb3", "#1d004d", "#9d5fd6", "#3d1680", "#ffffff", "#000000"];

  var ColorSwatchControl = createClass({
    handleInput: function (e) { this.props.onChange(e.target.value); },
    handleSwatch: function (hex) { this.props.onChange(hex); },
    render: function () {
      var value = this.props.value || "#131110";
      var fieldPresets = this.props.field && this.props.field.get && this.props.field.get("presets");
      var presets = fieldPresets ? fieldPresets.toJS() : DEFAULT_COLOR_PRESETS;
      var self = this;
      return h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "4px 0" } },
        h("input", {
          type: "color",
          value: /^#([0-9a-f]{6})$/i.test(value) ? value : "#131110",
          onChange: this.handleInput,
          style: { width: "42px", height: "34px", padding: 0, border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer" }
        }),
        h("input", {
          type: "text",
          value: value,
          onChange: this.handleInput,
          style: { width: "96px", fontFamily: "monospace", fontSize: "13px", padding: "7px 8px", border: "1px solid #ddd", borderRadius: "4px" }
        }),
        h(
          "div",
          { style: { display: "flex", gap: "6px" } },
          presets.map(function (hex) {
            var isActive = String(value).toLowerCase() === hex.toLowerCase();
            return h("button", {
              key: hex,
              type: "button",
              title: hex,
              onClick: function () { self.handleSwatch(hex); },
              style: {
                width: "26px", height: "26px", borderRadius: "50%", background: hex,
                border: isActive ? "2px solid #222" : "2px solid #fff",
                boxShadow: "0 0 0 1px #ddd", cursor: "pointer", padding: 0
              }
            });
          })
        )
      );
    }
  });
  var ColorSwatchPreview = createClass({
    render: function () {
      var value = this.props.value || "";
      return h("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px" } },
        h("span", { style: { width: "14px", height: "14px", borderRadius: "50%", background: value, border: "1px solid #ccc", display: "inline-block" } }),
        value);
    }
  });
  CMS.registerWidget("colorswatch", ColorSwatchControl, ColorSwatchPreview);

  /* ---------- Custom widget: step slider (for a fixed list of options) ---------- */
  var StepSliderControl = createClass({
    handleChange: function (e) {
      var steps = this.getSteps();
      this.props.onChange(steps[parseInt(e.target.value, 10)].value);
    },
    getSteps: function () {
      var fieldOptions = this.props.field && this.props.field.get && this.props.field.get("options");
      return fieldOptions ? fieldOptions.toJS() : [{ value: "normal", label: "Normal" }];
    },
    render: function () {
      var steps = this.getSteps();
      var value = this.props.value || steps[0].value;
      var idx = steps.map(function (s) { return s.value; }).indexOf(value);
      if (idx < 0) idx = 0;
      return h(
        "div",
        { style: { padding: "6px 4px 2px" } },
        h("input", {
          type: "range", min: 0, max: steps.length - 1, step: 1, value: idx,
          onChange: this.handleChange,
          style: { width: "100%", accentColor: "#6b2fb3" }
        }),
        h(
          "div",
          { style: { display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "12px", color: "#766d5f" } },
          steps.map(function (s, i) {
            return h("span", { key: s.value, style: { fontWeight: i === idx ? "700" : "400", color: i === idx ? "#6b2fb3" : "#766d5f" } }, s.label);
          })
        )
      );
    }
  });
  var StepSliderPreview = createClass({
    render: function () { return h("span", {}, String(this.props.value || "")); }
  });
  CMS.registerWidget("stepslider", StepSliderControl, StepSliderPreview);

  /* ---------- Custom widget: rich text editor (gras, italique, souligné,
     couleur, taille, lien) — façon éditeur de texte / Elementor. Stocke du
     HTML directement dans le champ JSON. ---------- */
  var RICHTEXT_COLOR_PRESETS = ["#1d004d", "#6b2fb3", "#9d5fd6", "#3d1680", "#000000", "#ffffff"];
  var RICHTEXT_SIZES = [
    { label: "Petit", cmdValue: "2" },
    { label: "Normal", cmdValue: "3" },
    { label: "Grand", cmdValue: "5" },
    { label: "Très grand", cmdValue: "7" }
  ];
  function richBtnStyle(extra) {
    var base = {
      minWidth: "26px", height: "26px", padding: "0 6px", borderRadius: "4px",
      border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "13px", lineHeight: "24px"
    };
    for (var k in extra) base[k] = extra[k];
    return base;
  }
  var RichTextControl = createClass({
    componentDidMount: function () {
      if (this.editorEl) this.editorEl.innerHTML = this.props.value || "";
      try { document.execCommand("styleWithCSS", false, true); } catch (e) {}
    },
    handleInput: function () {
      if (this.editorEl) this.props.onChange(this.editorEl.innerHTML);
    },
    exec: function (cmd, value) {
      var self = this;
      return function (e) {
        e.preventDefault();
        if (self.editorEl) self.editorEl.focus();
        try { document.execCommand(cmd, false, value); } catch (err) {}
        self.handleInput();
      };
    },
    handleLink: function (e) {
      e.preventDefault();
      if (this.editorEl) this.editorEl.focus();
      var url = window.prompt("Adresse du lien (URL) :", "https://");
      if (url) { try { document.execCommand("createLink", false, url); } catch (err) {} }
      this.handleInput();
    },
    render: function () {
      var self = this;
      return h(
        "div",
        { style: { border: "1px solid #ddd", borderRadius: "6px" } },
        h(
          "div",
          { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px", padding: "6px", borderBottom: "1px solid #eee", background: "#fafafa" } },
          h("button", { type: "button", title: "Gras", onMouseDown: self.exec("bold"), style: richBtnStyle({ fontWeight: "700" }) }, "G"),
          h("button", { type: "button", title: "Italique", onMouseDown: self.exec("italic"), style: richBtnStyle({ fontStyle: "italic" }) }, "I"),
          h("button", { type: "button", title: "Souligné", onMouseDown: self.exec("underline"), style: richBtnStyle({ textDecoration: "underline" }) }, "S"),
          h("button", { type: "button", title: "Ajouter un lien", onMouseDown: self.handleLink, style: richBtnStyle() }, "Lien"),
          h("button", { type: "button", title: "Retirer le lien", onMouseDown: self.exec("unlink"), style: richBtnStyle() }, "✕Lien"),
          h("span", { style: { width: "1px", alignSelf: "stretch", background: "#ddd", margin: "0 4px" } }),
          RICHTEXT_SIZES.map(function (s) {
            return h("button", { key: s.label, type: "button", title: s.label, onMouseDown: self.exec("fontSize", s.cmdValue), style: richBtnStyle() }, s.label[0]);
          }),
          h("span", { style: { width: "1px", alignSelf: "stretch", background: "#ddd", margin: "0 4px" } }),
          h("button", { type: "button", title: "Couleur par défaut", onMouseDown: self.exec("foreColor", "inherit"), style: richBtnStyle() }, "⌀"),
          RICHTEXT_COLOR_PRESETS.map(function (hex) {
            return h("button", {
              key: hex, type: "button", title: hex,
              onMouseDown: self.exec("foreColor", hex),
              style: { width: "22px", height: "22px", borderRadius: "50%", background: hex, border: "2px solid #fff", boxShadow: "0 0 0 1px #ddd", cursor: "pointer", padding: 0 }
            });
          })
        ),
        h("div", {
          ref: function (el) { self.editorEl = el; },
          contentEditable: true,
          onInput: self.handleInput,
          onBlur: self.handleInput,
          style: { minHeight: "90px", padding: "10px 12px", fontSize: "14px", lineHeight: "1.5", outline: "none" }
        })
      );
    }
  });
  var RichTextPreview = createClass({
    render: function () {
      return h("div", { dangerouslySetInnerHTML: { __html: this.props.value || "" } });
    }
  });
  CMS.registerWidget("richtext", RichTextControl, RichTextPreview);

  GOOGLE_FONT_URLS.forEach(function (url) {
    CMS.registerPreviewStyle(url, { raw: true });
  });
  CMS.registerPreviewStyle("/css/style.css");
  CMS.registerPreviewStyle(
    "body{margin:0;background:var(--cream);} .preview-root{min-height:100%;cursor:pointer;}" +
    ".preview-root .hero,.preview-root .skill-card,.preview-root .exp-card,.preview-root .edu-row," +
    ".preview-root .project-card,.preview-root .formation-row,.preview-root .passion-card," +
    ".preview-root .contact-title,.preview-root .contact-rows,.preview-root .quote-text,.preview-root .custom-section-body," +
    ".preview-root .tool-badge{transition:outline .1s ease;cursor:pointer;}" +
    ".preview-root .hero:hover,.preview-root .skill-card:hover,.preview-root .exp-card:hover," +
    ".preview-root .edu-row:hover,.preview-root .project-card:hover,.preview-root .formation-row:hover," +
    ".preview-root .passion-card:hover,.preview-root .contact-title:hover,.preview-root .contact-rows:hover," +
    ".preview-root .quote-text:hover,.preview-root .custom-section-body:hover,.preview-root .tool-badge:hover{" +
    "outline:2px dashed #6b2fb3;outline-offset:3px;}",
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

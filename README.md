# mon-portfolio

Portfolio en ligne de **Mariam Mdoreuli** — Management, Communication & Marketing Digital.

Site statique bilingue (FR/EN), sans framework ni étape de build : HTML, CSS et JavaScript natifs.
Tout le contenu (textes, couleurs, projets) est éditable **sans coder** via un panneau
d'administration (`/admin`) propulsé par [Decap CMS](https://decapcms.org/).

## Structure

```
.
├── index.html            # Page d'accueil (mount points remplis dynamiquement)
├── projects/project.html # Gabarit unique pour toutes les pages de réalisation (?slug=...)
├── content/               # Tout le contenu du site, en JSON — c'est ce que /admin édite
│   ├── site.json           # Hero, profil, citation, contact, footer, couleurs
│   ├── skills.json          # Compétences
│   ├── experiences.json     # Expériences professionnelles
│   ├── education.json       # Parcours académique
│   ├── projects.json        # Réalisations (une entrée = une page /projects/project.html?slug=...)
│   ├── formations.json      # Certifications & formations
│   ├── tools.json           # Outils & logiciels
│   └── passions.json        # Passions
├── admin/
│   ├── index.html          # Panneau d'administration (Decap CMS)
│   └── config.yml          # Définition des champs éditables
├── css/style.css
├── js/
│   ├── script.js            # Langue, menu mobile, carrousels, animations
│   ├── content.js           # Charge content/*.json et construit la page d'accueil
│   └── project.js           # Charge content/projects.json et construit une page de réalisation
├── assets/
│   ├── favicon.svg
│   └── uploads/              # Images ajoutées depuis /admin
└── netlify.toml
```

## Développer en local

Aucune dépendance à installer. Comme le contenu est chargé via `fetch()`, un simple
double-clic sur `index.html` ne suffit pas (restriction navigateur sur `file://`) —
lance un petit serveur local :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Modifier le contenu

**Sans coder** : une fois le site déployé sur Netlify (voir plus bas), va sur
`https://<ton-site>.netlify.app/admin/` pour éditer textes, images et couleurs
depuis une interface visuelle, et ajouter/supprimer des projets, formations,
passions, etc.

**En code** : modifie directement les fichiers dans `content/*.json`. Chaque
texte existe en deux clés `_fr` / `_en`. Après un `git push`, le site se
republie automatiquement.

## Déployer sur Netlify (nécessaire pour que `/admin` fonctionne)

`/admin` a besoin d'une authentification pour pouvoir enregistrer les
modifications dans GitHub — GitHub Pages seul ne le permet pas. D'où
l'hébergement sur **Netlify**, qui fournit cette brique gratuitement
(Identity + Git Gateway).

1. Sur [netlify.com](https://app.netlify.com), **Add new site → Import an existing project**,
   choisir ce dépôt GitHub. Build command : laisser vide. Publish directory : `.` (déjà
   configuré dans `netlify.toml`).
2. Une fois le site créé, aller dans **Site configuration → Identity** → **Enable Identity**.
3. Dans **Identity → Registration**, choisir **Invite only** (pour que seule
   Mariam puisse se connecter à `/admin`).
4. Dans **Identity → Services**, activer **Git Gateway**.
5. Retourner sur l'onglet **Identity**, cliquer **Invite users**, entrer son
   email. Elle recevra un email pour définir son mot de passe.
6. Elle peut ensuite se connecter sur `https://<site>.netlify.app/admin/`.

## Déployer sur GitHub Pages (alternative, sans panneau d'admin)

Le site reste 100&nbsp;% compatible GitHub Pages si l'édition sans code n'est pas
nécessaire (le dossier `/admin` sera simplement inaccessible sans Netlify) :

1. Sur GitHub, aller dans **Settings → Pages** du dépôt.
2. Dans **Build and deployment**, choisir **Deploy from a branch**.
3. Sélectionner la branche (ex. `main`) et le dossier `/ (root)`.
4. Enregistrer — le site sera publié à une URL du type
   `https://<utilisateur>.github.io/mon-portfolio/`.

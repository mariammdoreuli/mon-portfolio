# mon-portfolio

Portfolio en ligne de **Mariam Mdoreuli** — Assistante en Communication & Marketing Digital.

Site statique bilingue (FR/EN), sans framework ni étape de build : HTML, CSS et JavaScript natifs.

## Structure

```
.
├── index.html          # Page unique (profil, compétences, expériences, projets, formation, contact)
├── css/style.css        # Styles
├── js/script.js         # Bascule de langue, menu mobile, animations au scroll
└── assets/favicon.svg   # Favicon
```

## Développer en local

Aucune dépendance à installer. Ouvre simplement `index.html` dans un navigateur,
ou lance un petit serveur local pour profiter du rechargement à chaud avec certaines extensions :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Modifier le contenu

- Tous les textes bilingues sont côte à côte dans `index.html`, marqués par `lang="fr"` / `lang="en"`.
  Le CSS/JS n'affiche que la langue active.
- Les couleurs et polices se règlent via les variables CSS en haut de `css/style.css` (`:root`).

## Déployer sur GitHub Pages

1. Sur GitHub, aller dans **Settings → Pages** du dépôt.
2. Dans **Build and deployment**, choisir **Deploy from a branch**.
3. Sélectionner la branche (ex. `main`) et le dossier `/ (root)`.
4. Enregistrer — le site sera publié à une URL du type
   `https://<utilisateur>.github.io/mon-portfolio/`.

Aucune configuration supplémentaire n'est nécessaire : le site est 100&nbsp;% statique.

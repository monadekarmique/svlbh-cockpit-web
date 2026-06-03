# Doctrine de publication des articles cockpit

DEC Patrick 2026-06-03.

## Principe

**Toute page sous le menu nav cockpit affiche, juste sous la nav :**

- **Gauche** : audit trail (breadcrumb) actionnable. Chaque niveau est cliquable
  pour remonter au niveau supérieur. Permet en un coup d'œil de savoir où on
  est et de remonter.
- **Droite** : numéro du build (`build <version> · <commit court>`). Pour
  vérifier la version déployée sans rouvrir le menu nav.

Ceci n'est pas vrai pour le **menu nav** lui-même (qui garde sa propre chrome) —
c'est vrai pour **toute page en dessous, quel que soit son niveau**.

## Implémentation

### Pages React Next.js (routes `src/app/(app)/.../page.tsx`)

Branchées automatiquement via le composant `PageBreadcrumb`
(`src/components/page-breadcrumb.tsx`), monté dans
`src/app/(app)/layout.tsx` juste après le `<header>` et avant `<main>`.

**Rien à faire** sur une nouvelle page React — elle hérite de la bande chrome.

### Articles HTML statiques (fichiers `public/**/*.html`)

Ces fichiers sont servis directement par Next sans passer par le layout React.
Pour leur appliquer la doctrine, **inclure dans le `<head>` de chaque article :**

```html
<script src="/article-chrome.js" defer></script>
```

Le snippet (`public/article-chrome.js`) :
1. Fetch `/api/cockpit-meta` (version + commit + labels nav).
2. Construit le breadcrumb depuis `window.location.pathname`.
3. Injecte la bande sticky en haut du `<body>`.

Les labels humains sont dérivés :
- de `COCKPIT_NAV` (`src/lib/cockpit-nav.ts`) si l'URL du segment matche un
  module (ex. `/routines` → `Routine matin`),
- sinon de l'humanisation du slug (strip `.html`, strip `-vX.Y.Z`, tirets →
  espaces, capitalize first).

### Endpoint meta

`GET /api/cockpit-meta` retourne :

```json
{
  "version": "7.2.0",
  "commit": "9e1534c",
  "nav": [{ "href": "/routines", "label": "Routine matin" }, ...]
}
```

Cache 5 min côté CDN/browser.

## Checklist — publier un nouvel article HTML

1. Créer le fichier sous `public/<section>/<nom>-v<X.Y.Z>.html`.
2. Inclure `<script src="/article-chrome.js" defer></script>` dans le `<head>`.
3. (Optionnel) Ajouter une carte de lien depuis la page index du module
   (ex. `src/app/(app)/routines/page.tsx`).
4. Push + deploy.

Le breadcrumb se construit automatiquement : `Dashboard › <Module> › <Article>`.

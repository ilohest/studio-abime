# Studio Abîme

Site vitrine et portfolio du Studio Abîme.

**Astro** (rendu statique) · **Vue 3** (îlots interactifs) · **Sanity** (CMS headless + édition visuelle) · **Tailwind CSS v4** (design system).

---

## Démarrage

```bash
npm install
```

Créer un projet Sanity, puis renseigner les variables d'environnement :

```bash
cp .env.example .env
npx sanity init --project-id "" --dataset production
```

Reporter le `projectId` obtenu dans `.env`, puis :

```bash
npm run dev
```

| URL | Contenu |
| --- | --- |
| `http://localhost:4321` | le site |
| `http://localhost:4321/studio` | le back-office Sanity (embarqué) |
| `http://localhost:4321/studio/presentation` | l'édition visuelle en écran scindé |

### Premier contenu

Le site a besoin de deux documents pour s'afficher :

1. **Réglages du site** → créer le document, choisir le nom du site ;
2. **Pages** → créer une page, puis la désigner comme **Page d'accueil** dans les réglages.

---

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | vérification des types **puis** build de production |
| `npm run preview` | prévisualisation du build |
| `npm run typecheck` | `astro check` seul |
| `npx sanity <cmd>` | CLI Sanity (datasets, tokens, import/export) |

---

## Architecture

```
├── astro.config.ts              Intégrations + routage i18n natif
├── sanity.config.ts             Studio : schémas, structure, Presentation Tool
│
├── src/
│   ├── i18n/
│   │   ├── config.ts            ★ SOURCE DE VÉRITÉ des langues
│   │   ├── routes.ts            Segments d'URL traduits + construction des chemins
│   │   └── ui.ts                Micro-textes d'interface
│   │
│   ├── lib/
│   │   ├── routing.ts           Manifeste des routes + résolution des liens
│   │   ├── siteContext.ts       Réglages communs (mémoïsés par langue)
│   │   ├── viewModels.ts        Sanity → props des composants Vue
│   │   ├── portableText.ts      Rendu du texte riche
│   │   └── sanity/              client, env, requêtes GROQ, images, types
│   │
│   ├── components/
│   │   ├── primitives/          SanityImage, PortableText, SmartLink
│   │   ├── sections/            Rendu du page builder (1 composant par bloc)
│   │   ├── project/             Fiche projet, projet suivant
│   │   └── vue/                 ★ Îlots interactifs (ProjectExplorer.vue)
│   │
│   ├── templates/project/       ★ Modèles de page projet distincts
│   ├── layouts/BaseLayout.astro
│   ├── pages/[...path].astro    ★ Route universelle
│   └── styles/                  Design tokens + fontes
│
└── sanity/
    ├── lib/                     i18n, registre des modèles, Presentation
    ├── schemaTypes/
    │   ├── documents/           page, project, category
    │   ├── singletons/          siteSettings, localizedSettings
    │   └── objects/             link, seo, richText, sections/
    └── structure/               Organisation du back-office
```

---

## Multilingue

Le site est livré **en français uniquement**, mais l'architecture est multilingue de bout en bout.

### Ajouter une langue

```ts
// src/i18n/config.ts
export const locales = ['fr', 'en'] as const;
```

C'est **la seule modification de code nécessaire**. En découlent automatiquement :

- le routage Astro et les URLs préfixées (`/en/…`) ;
- les segments de section traduits (`/projets` → `/en/work`, table dans `src/i18n/routes.ts`) ;
- le sélecteur de langue et les balises `hreflang` ;
- le filtre de langue dans le back-office ;
- la création de traductions depuis chaque document.

Il reste ensuite à traduire les micro-textes d'interface dans `src/i18n/ui.ts` et à créer les contenus dans Sanity.

### Le choix : traduction au niveau document

Chaque langue est un **document distinct** portant un champ `language`, les versions étant reliées entre elles par le plugin `@sanity/document-internationalization`.

L'alternative — des champs traduits (`title: { fr: …, en: … }`) — a été écartée : elle empêche d'avoir un slug par langue (donc des URLs réellement localisées), impose de republier toutes les langues ensemble, et alourdit chaque requête GROQ. Ici, toute requête de contenu filtre simplement sur `language == $locale`.

Seul `siteSettings` échappe à la règle : il ne contient que des données non traduisibles (logo, réseaux sociaux), volontairement partagées pour ne pas se désynchroniser à chaque ajout de langue.

---

## Contenu modulaire

Les pages et les projets sont composés de **sections** librement empilables (le « page builder »).

**Ajouter une section :**

1. schéma dans `sanity/schemaTypes/objects/sections/` + export dans son `index.ts` ;
2. composant dans `src/components/sections/` ;
3. un `case` dans `src/components/sections/SectionRenderer.astro`.

Un `_type` sans composant est ignoré sans casser la page — un schéma peut donc être déployé avant son rendu.

## Modèles de page projet

Chaque cas client peut avoir une structure propre. Deux leviers combinés :

- **`template`** choisit l'enveloppe de la page — `standard`, `immersive` ou `editorial` (`src/templates/project/`) ;
- **`sections`** compose le corps librement.

Les options propres à un modèle (couleur d'accent, vidéo de couverture, notes en marge…) vivent dans `templateOptions` et ne sont visibles dans le back-office que pour le modèle concerné.

**Ajouter un modèle :** une entrée dans `sanity/lib/projectTemplates.ts`, un composant dans `src/templates/project/`, un `case` dans `ProjectTemplateRenderer.astro`. Les projets existants ne sont pas impactés.

---

## Routage

Un fichier — `src/pages/[...path].astro` — sert **tout** le site public, en déléguant à `src/lib/routing.ts`.

Ce choix vient d'une contrainte : les segments d'URL sont traduits et le préfixe de langue est conditionnel. Une arborescence figée (`src/pages/[locale]/projets/[slug].astro`) obligerait à dupliquer des fichiers à chaque langue ajoutée. Ici, ni l'ajout d'une langue ni le renommage d'un segment ne touche un fichier de route.

| Route | Résolution |
| --- | --- |
| `/` | page désignée comme accueil dans les réglages |
| `/<slug>` | document `page` (slug imbriqué possible : `agence/equipe`) |
| `/projets` | index du portfolio |
| `/projets/<slug>` | document `project`, rendu selon son modèle |

---

## Édition visuelle (Presentation Tool)

Écran scindé : le formulaire à gauche, le site à droite. Cliquer un texte dans l'aperçu ouvre le champ correspondant.

Le mécanisme repose sur **stega** : les identifiants Sanity sont encodés de façon invisible dans les chaînes rendues. Activation par variable d'environnement :

```bash
PUBLIC_SANITY_VISUAL_EDITING_ENABLED="true"
SANITY_API_READ_TOKEN="<token Viewer>"   # requis pour lire les brouillons
```

Ce drapeau bascule trois choses d'un coup : stega activé, CDN désactivé, et routes en rendu à la demande (au lieu du pré-rendu statique).

**En production, le laisser à `"false"`** : le site redevient 100 % statique, sans stega ni JavaScript d'édition.

Le token `SANITY_API_READ_TOKEN` n'est **pas** préfixé `PUBLIC_` : il reste côté serveur et n'est jamais envoyé au navigateur.

---

## Design system

### Palette

| Token | Hex | Rôle |
| --- | --- | --- |
| `--color-papier` | `#EFEBE2` | Papier d'archive — fond principal |
| `--color-abime` | `#2D2A29` | Abîme — texte, fonds inversés |
| `--color-sable` | `#D8D4CB` | Sable — fonds secondaires |
| `--color-lumiere` | `#F9EDBB` | Lumière — accent |
| `--color-ciel` | `#CED6E0` | Ciel — accent secondaire |

Les composants n'utilisent jamais ces couleurs directement mais des **rôles** (`--color-surface`, `--color-ink`, `--color-muted`, `--color-line`, `--color-accent`) : retoucher la charte ne demande pas de repasser sur chaque composant. La classe `.surface-invert` bascule un bloc entier en fond sombre.

### Typographie

| Style | Fonte | Casse | Corps | Interlettrage | Classe |
| --- | --- | --- | --- | --- | --- |
| Titres | GT Canon Mono Regular | Majuscule | 46 px | −3 % | `.type-titre` |
| Sous-titres | Commuters Sans SemiBold | Majuscule | 18 px | +5 % | `.type-sous-titre` |
| Copy | GT Canon M Regular | — | 18 px | +2 % | `.type-copy` |
| Annotations | GT Canon Narrow S Italic | — | 20 px | −5 % | `.type-annotation` |
| _Note dactylo._ | GT Canon Mono Regular | — | 12 px | +2 % | `.type-note` |

`.type-note` n'introduit pas de cinquième famille : c'est la fonte des Titres employée en petit corps, pour les mentions machine à écrire du hero (en-tête, hypothèse, note d'intention).

Tout est déclaré dans `@theme` (`src/styles/global.css`), donc disponible à la fois comme variables `:root` et comme utilitaires Tailwind (`text-titre`, `font-copy`, `tracking-annotation`…).

### Logos

`src/assets/brand/` contient le logo principal, le tampon « Labo de Com. » et le submark « Plongée sous le visible », inlinés par les composants `src/components/brand/`.

Les fichiers d'origine existaient en sept déclinaisons de couleur ; leur remplissage a été converti en `currentColor` et le bloc `<defs><style>` retiré (les classes `.cls-1` seraient entrées en collision entre deux SVG inlinés sur une même page). **Un seul fichier par logo** couvre donc désormais toute la palette : la couleur se pilote en CSS (`class="text-lumiere"`, `text-papier`…).

### Hero de la page d'accueil

La section `manifestoHero` reproduit la double page imprimée : mentions dactylographiées à gauche, logo à droite, pli central. La **mise en page est figée** dans le composant (c'est une direction artistique, pas un gabarit) ; seuls les textes sont éditables depuis Sanity. La mention « Date » se recalcule à chaque rendu si l'option _date automatique_ est cochée.

Le pli central est tracé en CSS — deux filets décalés de 3 px, celui de droite incliné de 0.35° — et non peint dans la texture. Le fond étant en `cover`, une ligne peinte dériverait par rapport à la grille à chaque largeur d'écran, alors que le pli doit rester calé sur la colonne centrale ; en CSS elle reste nette à tous les DPR et ne pèse rien. Les filets débordent verticalement (`top: -9%; height: 118%`) car une ligne pivotée ne rejoindrait plus les coins.

En dessous de 768 px, la double page s'effondre en colonne unique : le pli disparaît et la marque passe en premier, pour que le logo reste au-dessus de la ligne de flottaison.

> **⚠️ Licence des fontes.** Commuters Sans est actuellement le fichier **« Fontspring DEMO »** (`.otf`) : jeu de glyphes réduit et licence non valable pour une mise en production web. Remplacer `public/fonts/CommutersSans-SemiBold.otf` par la version webfont sous licence (`.woff2`) avant mise en ligne — le nom de famille CSS étant inchangé, aucune autre modification ne sera nécessaire.

---

## Performance

- **Zéro JavaScript par défaut.** Le seul îlot hydraté est `ProjectExplorer.vue`, et uniquement quand des filtres sont activés (`client:visible`) ; sinon la grille de projets est du HTML pur.
- **React** n'est chargé que sur `/studio` et par l'overlay d'édition visuelle — jamais sur le site public.
- Les composants Vue reçoivent des **modèles de vue** (`src/lib/viewModels.ts`), pas des documents Sanity : le JSON hydraté reste minimal et le client n'embarque ni le routeur ni le builder d'images.
- Images servies par le CDN Sanity avec `srcset` responsive, dimensions explicites et placeholder LQIP.

---

## Prochaines étapes suggérées

- `npx sanity typegen generate` pour dériver les types depuis les schémas et les requêtes, en remplacement des types écrits à la main dans `src/lib/sanity/types.ts` ;
- `@astrojs/sitemap` + `robots.txt` avant la mise en ligne ;
- déploiement : le site est statique, mais l'adaptateur Node est requis si l'environnement de preview doit servir l'édition visuelle.

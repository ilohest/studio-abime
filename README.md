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

Le site et le back-office sont **deux applications distinctes**, lancées par deux
commandes (deux terminaux) :

| Commande | URL | Contenu |
| --- | --- | --- |
| `npm run dev` | `http://localhost:4321` | le site |
| `npm run studio:dev` | `http://localhost:3333` | le back-office Sanity |
| `npm run studio:dev` | `http://localhost:3333/presentation` | l'édition visuelle en écran scindé |

### Premier contenu

Le site a besoin de deux documents pour s'afficher :

1. **Réglages du site** → créer le document, choisir le nom du site ;
2. **Pages** → créer une page, puis la désigner comme **Page d'accueil** dans les réglages.

---

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement du **site** (4321) |
| `npm run studio:dev` | serveur de développement du **Studio** (3333) |
| `npm run build` | vérification des types **puis** build de production du site |
| `npm run studio:build` | build du Studio dans `dist-studio/` |
| `npm run preview` | build **puis** exécution locale dans le runtime Cloudflare (`wrangler`) |
| `npm run typecheck` | `astro check` seul |
| `npx sanity <cmd>` | CLI Sanity (datasets, tokens, import/export) |

`npm run preview` passe par `wrangler` plutôt que par `astro preview` : c'est le
seul moyen d'exécuter `/api/contact` dans le vrai runtime Workers, celui qui
tournera en production. Au quotidien, `npm run dev` reste l'outil de travail.

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
│   │   ├── seo/                 Schema.org, vignette de partage, verrou d'index
│   │   ├── sanity/              client, env, requêtes GROQ, images, types
│   │   └── shopify/             catalogue, panier, politiques de boutique
│   │
│   ├── components/
│   │   ├── primitives/          SanityImage, PortableText, SmartLink
│   │   ├── sections/            Rendu du page builder (1 composant par bloc)
│   │   ├── project/             Fiche projet, projet suivant
│   │   └── vue/                 ★ Îlots interactifs (JournalExplorer, panier, achat)
│   │
│   ├── templates/project/       ★ Modèles de page projet distincts
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── [...path].astro      ★ Route universelle
│   │   ├── sitemap.xml.ts       Sitemap généré depuis le manifeste de routes
│   │   └── robots.txt.ts        robots.txt, fermé hors production
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
- les segments de section traduits (`/experiences` → `/en/work`, table dans `src/i18n/routes.ts`) ;
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

Chaque cas client peut avoir une structure propre. Le champ **`template`** ouvre l'onglet « Contenu » du projet, parce qu'il commande ce qui s'y saisit ensuite — trois modèles, trois corps de page (`src/templates/project/`) :

- **`split`** — « Colonne fixe » : texte en blocs (`sections`) à gauche, planche d'images (`gallery`) défilante à droite ;
- **`banner`** — « Bandeau » : mêmes champs, planche en bandeau sous le texte ;
- **`composition`** — « Composition libre » : textes, figures et notes intercalés (`blocks`), la saisie même des articles du Journal, rendue par le même composant (`JournalComposition.astro`).

Le corps des autres modèles est masqué dans le back-office, jamais effacé : revenir à un modèle retrouve sa saisie intacte.

**Ajouter un modèle :** une entrée dans `sanity/lib/projectTemplates.ts`, un composant dans `src/templates/project/`, un `case` dans `ProjectTemplateRenderer.astro`. Les projets existants ne sont pas impactés.

---

## Routage

Un fichier — `src/pages/[...path].astro` — sert **tout** le site public, en déléguant à `src/lib/routing.ts`.

Ce choix vient d'une contrainte : les segments d'URL sont traduits et le préfixe de langue est conditionnel. Une arborescence figée (`src/pages/[locale]/experiences/[slug].astro`) obligerait à dupliquer des fichiers à chaque langue ajoutée. Ici, ni l'ajout d'une langue ni le renommage d'un segment ne touche un fichier de route.

| Route | Résolution |
| --- | --- |
| `/` | page désignée comme accueil dans les réglages |
| `/<slug>` | document `page` (slug imbriqué possible : `agence/equipe`) |
| `/experiences` | index du portfolio |
| `/experiences/<slug>` | document `project`, rendu selon son modèle |

### L'adresse d'une page, et ses adresses passées

Le modèle est celui de Shopify, et il tient à une asymétrie : un titre se
retouche souvent — une coquille, une majuscule, un point final — alors qu'une
adresse publiée est une promesse faite à tous ceux qui l'ont copiée.

1. **L'adresse est tirée du titre à la première publication**, puis elle ne bouge
   plus d'elle-même. Renommer une page ne la déplace pas.
2. **Elle reste modifiable à la main** (onglet SEO). C'est indispensable : une
   page publiée sous un titre provisoire garderait sinon son adresse provisoire
   pour toujours.
3. **La corriger propose une redirection.** Au moment de publier — tant qu'on est
   en brouillon, rien n'a bougé — le Studio montre les deux adresses et laisse le
   choix entre rediriger l'ancienne et déplacer sans rediriger.

L'ancienne adresse est versée dans `previousSlugs` (champ masqué), d'où
`astro.config.ts` tire une redirection `301` au build. Elle atterrit dans le
fichier `_redirects` de Cloudflare : servie par le CDN, sans réveiller de Worker,
donc gratuite et sans limite.

Deux gardes valent d'être connues :

- une ancienne adresse **réoccupée depuis** par une autre page n'est jamais
  redirigée — sans quoi publier un projet sous une adresse libérée le rendrait
  invisible, renvoyé vers celui qui l'avait quittée. Le build le signale ;
- les redirections héritées du contenu sont posées **avant** celles du code : une
  donnée ne peut pas écraser une route écrite dans `astro.config.ts`.

> Contrairement à l'interrupteur de maintenance, une lecture ratée n'arrête
> **pas** le build. Le pire est ici qu'une ancienne adresse réponde 404 le temps
> d'un déploiement — réparable en reconstruisant. Bloquer toute publication sur
> un hoquet de Sanity coûterait davantage.

---

## Édition visuelle (Presentation Tool)

Écran scindé : le formulaire à gauche, le site à droite. Cliquer un texte dans l'aperçu ouvre le champ correspondant.

Le mécanisme repose sur **stega** : les identifiants Sanity sont encodés de façon invisible dans les chaînes rendues. Activation par variable d'environnement :

```bash
PUBLIC_SANITY_VISUAL_EDITING_ENABLED="true"
SANITY_API_READ_TOKEN="<token Viewer>"   # requis pour lire les brouillons
```

Ce drapeau bascule deux choses d'un coup : stega activé, et routes en rendu à la demande (au lieu du pré-rendu statique). Il commande aussi la lecture des brouillons et la fermeture à l'indexation (`src/lib/seo/indexing.ts`).

Le CDN de Sanity, lui, ne dépend plus de ce drapeau : il est désactivé partout (`src/lib/sanity/client.ts`). Un site pré-rendu ne joue chaque requête qu'une fois, au build — le cache n'a rien à y mutualiser, et il servirait l'état d'avant la publication qui vient de déclencher la reconstruction.

> Le rendu à la demande est décidé par `output` dans `astro.config.ts`, et non
> par un `export const prerender` dans les pages. Astro **n'évalue pas** un
> `prerender` calculé : il n'en reconnaît qu'un littéral `true` ou `false`, et
> ignore silencieusement une expression, même juste. Une page qui croyait passer
> en rendu à la demande restait donc pré-rendue. Deux drapeaux font aujourd'hui
> basculer le site entier : l'édition visuelle et le mode maintenance.

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

Une mention dont la valeur est une adresse e-mail ou une URL devient cliquable d'elle-même (`mailto:` / lien externe) : l'éditeur saisit l'adresse, sans champ de lien supplémentaire à gérer.

Tant qu'aucune page d'accueil n'est désignée dans Sanity, la racine sert le contenu d'amorçage de `src/content/homeFallback.ts` plutôt qu'un 404. Ce fichier devient inutile — et supprimable — dès que le CMS est alimenté.

### Navigation et pied de page

Il n'y a **pas d'en-tête** : la navigation, les réseaux sociaux, le crédit de réalisation et le sélecteur de langue vivent dans le pied de page, face au logo. `src/components/Header.astro` est conservé au cas où une barre de navigation deviendrait nécessaire sur les pages intérieures.

La baseline du pied de page a une valeur par défaut dans le composant ; dès que « Texte de pied de page » est renseigné dans Sanity, c'est le CMS qui prend la main.

### Curseur personnalisé

`src/components/CustomCursor.astro` — un disque qui suit la souris avec un léger retard (interpolation à 0.18 par image), s'ouvre en anneau au survol des éléments interactifs et se contracte au clic.

Écrit en script natif plutôt qu'en îlot Vue : sans état partagé ni props, un composant framework coûterait un runtime complet pour une boucle d'animation de quelques lignes.

Trois garde-fous : activé uniquement sur pointeur fin (jamais sur tactile), le curseur système n'est masqué qu'une fois le nôtre en place (si le script échoue, l'utilisateur garde son curseur), et `prefers-reduced-motion` supprime le retard.

> **Licence des fontes.** Les trois GT Canon sont auto-hébergées dans `public/fonts/`. Commuters Sans, elle, vient du projet Adobe Fonts de la cliente : le kit est chargé dans le `<head>` de `BaseLayout.astro` et la licence Adobe **interdit d'héberger le fichier soi-même** — il n'y a donc, volontairement, aucun fichier Commuters Sans dans `public/fonts/`. Le nom de famille CSS est celui d'Adobe, `commuters-sans`, et non `"Commuters Sans"`.
>
> **⚠️ Graisse manquante.** Le kit ne publie que les graisses 400 et 700, alors que les sous-titres appellent la 600 : la correspondance CSS remonte donc vers la 700, un dessin réel mais plus lourd que la maquette. Le SemiBold existe chez Adobe pour cette famille — il reste à le cocher dans le projet web côté cliente. L'URL du kit ne changeant pas, aucune modification de code ne sera nécessaire ce jour-là.

---

## Performance

- **Zéro JavaScript par défaut.** Les seuls îlots hydratés sont ceux du Journal et de la boutique (`JournalExplorer.vue`, `ProductPurchase.vue` en `client:visible`, `CartDrawer.vue` en `client:load`) ; la grille de projets est du HTML pur.
- **React** n'est chargé que sur `/studio` et par l'overlay d'édition visuelle — jamais sur le site public.
- Les composants Vue reçoivent des **modèles de vue** (`src/lib/viewModels.ts`), pas des documents Sanity : le JSON hydraté reste minimal et le client n'embarque ni le routeur ni le builder d'images.
- Images servies par le CDN Sanity avec `srcset` responsive, dimensions explicites et placeholder LQIP.

---

## Référencement

Tout est généré : aucun fichier SEO n'est posé à la main, aucune URL n'est écrite en dur.

| Ce qui est produit | Où |
| --- | --- |
| `<title>`, méta description, canonique, Open Graph, carte X | `src/components/Seo.astro` |
| Données structurées Schema.org | `src/lib/seo/jsonLd.ts` → `src/components/JsonLd.astro` |
| Vignette de partage | `src/lib/seo/shareImage.ts` |
| Verrou d'indexation | `src/lib/seo/indexing.ts` |
| `/sitemap.xml` | `src/pages/sitemap.xml.ts` |
| `/robots.txt` | `src/pages/robots.txt.ts` |

**Les métadonnées se calculent une fois.** `src/pages/[...path].astro` résout le
titre, la description et la vignette de la page, puis les passe *à la fois* aux
balises du `<head>` et aux données structurées. Ce qu'un moteur lit dans le
JSON-LD est donc exactement ce qu'affiche un lien partagé — les deux ne peuvent
pas diverger.

**Cascades de repli.** La description part du SEO du document, retombe sur son
extrait (résumé de projet, chapô d'article, description de tirage), puis sur la
description du site. Sans l'étage du milieu, toutes les pages sans description
saisie partageraient mot pour mot la même méta description. La vignette suit la
même logique : image SEO → visuel du document → image sociale par défaut, avec
recadrage paysage systématique parce que les réseaux composent leur aperçu dans
un cadre large.

**Un seul graphe Schema.org par page.** Les nœuds se citent par `@id` : le studio
décrit sur l'accueil est littéralement la même entité que l'auteur d'un article et
que le vendeur d'un tirage. Chaque type de page a le sien — `CreativeWork` pour un
projet, `BlogPosting` pour un article, `Product` avec le prix et la disponibilité
de chaque variante pour un tirage, `ItemList` pour les index, `BreadcrumbList`
partout. Rien n'est inventé : un champ vide dans le CMS n'apparaît pas dans le
graphe.

La fiche d'entreprise (nom légal, adresse, TVA, logo, réseaux) se saisit dans le
Studio, sous **Réglages du site → Identité et réseaux sociaux**. Elle ne s'affiche
nulle part : elle sert à rattacher le domaine à une entreprise réelle. Renseigner
l'adresse postale fait passer le studio en `ProfessionalService`, ce qui le rend
éligible aux résultats locaux.

**Le sitemap est construit depuis `buildRouteManifest()`**, pas par
`@astrojs/sitemap` : le manifeste connaît les URLs venant de Sanity *et* de
Shopify, porte la date de dernière révision de chaque document, et reste complet
même en rendu à la demande. Il exclut ce qui est en `noindex` et référence le
visuel de chaque page (extension images).

**Hors production, tout est fermé.** `PUBLIC_SANITY_VISUAL_EDITING_ENABLED`
distingue la preview de la production : sur la preview, `robots.txt` interdit tout
et chaque page porte `noindex`. Sans ce verrou, le domaine de preview servirait un
duplicata intégral du site public — l'un des accidents de référencement les plus
longs à rattraper.

---

## Déploiement

Deux applications, **deux projets Cloudflare** branchés sur ce même dépôt.

| Projet | Build | Sortie | Domaine |
| --- | --- | --- | --- |
| Site | `npm run build` | `dist/` | `studioabime.com` |
| Studio | `npm run studio:build` | `dist-studio/` | `studio.studioabime.com` |

Le choix de Cloudflare n'est pas qu'une question de prix. Son offre gratuite
autorise l'usage commercial — ce que le plan Hobby de Vercel interdit
explicitement, y compris pour un site simplement réalisé contre rémunération —,
la bande passante y est illimitée, et surtout **les membres d'un compte y sont
gratuits et illimités**. La cliente peut donc rester seule propriétaire de son
compte et y inviter un intervenant, sans jamais partager de mot de passe. Le
domaine peut vivre dans le même compte, acheté au prix coûtant du registre.

### Le site

`@astrojs/cloudflare` produit un build hybride : toutes les pages partent en HTML
statique sur le CDN, et **un seul Worker** est déployé, pour `/api/contact`.

Réglages du projet Cloudflare « Site » (Workers & Pages → importer le dépôt) :

- **Build command** : `npm run build`
- **Deploy command** : `npx wrangler deploy --config dist/server/wrangler.json`

Il n'y a pas de champ « répertoire de sortie » : le tableau de bord ne propose
plus que Workers Builds, où c'est la commande de déploiement qui désigne ce
qu'il faut publier. Le `wrangler.jsonc` de la racine est volontairement
incomplet — il ne porte que `html_handling` ; c'est l'adaptateur Astro qui
écrit la configuration complète **pendant le build**, dans
`dist/server/wrangler.json`, avec le point d'entrée et le dossier d'assets. Un
`npx wrangler deploy` sec lirait le fichier de la racine et échouerait faute de
point d'entrée.

Comme les pages sont pré-rendues, une publication dans Sanity n'apparaît en ligne
qu'après un nouveau build. Le câblage à faire une fois pour toutes :

1. Cloudflare → le projet → Settings → Builds → **Deploy hooks** : créer un hook
   sur la branche `main` ;
2. Sanity → [manage.sanity.io](https://manage.sanity.io) → API → **Webhooks** : coller
   l'URL du hook, méthode `POST`, sur les types de documents publiés.

Sans cela, la cliente publiera dans le back-office sans rien voir changer sur le site.

#### Deux réglages qui décident du coût

Ce sont les deux seules choses qui, mal réglées, feraient basculer un
hébergement gratuit vers une facture. Elles sont posées dans le dépôt, mais
elles se retirent d'un geste distrait :

- **`imageService: 'compile'`** dans `astro.config.ts`. Par défaut, l'adaptateur
  route les images vers le binding **Cloudflare Images**, un produit facturé : les
  pages émettent alors des URLs `/_image?...` transformées **à chaque visite**, qui
  réveillent le Worker au passage. En `compile`, sharp optimise tout au build et
  les images partent comme des assets statiques. Le contrôle : après un build,
  `grep -rl "/_image" dist/client --include="*.html"` ne doit **rien** retourner.
- **`html_handling: "drop-trailing-slash"`** dans `wrangler.jsonc`. Le serveur
  d'assets de Cloudflare ajoute sinon une barre finale par une redirection 307,
  et chaque lien interne du site part en aller-retour, vers une URL différente de
  sa propre canonique. (Passer `build.format` à `'file'` corrige le symptôme mais
  casse les canoniques, qui deviennent `/experiences.html` : ce n'est pas la
  solution.)

#### Ce qui est gratuit, et où sont les plafonds

Les requêtes vers les assets statiques — donc la quasi-totalité du trafic — sont
**gratuites et illimitées**, bande passante comprise, et n'appellent même pas le
Worker. Ne comptent que les requêtes qu'aucun fichier ne satisfait :

| Ressource | Offre gratuite | Consommation réelle du site |
| --- | --- | --- |
| Requêtes Worker | 100 000 / jour | uniquement `/api/contact` |
| Minutes de build | 3 000 / mois (1 build à la fois) | ~2 min par publication |
| KV (binding `SESSION`) | 100 000 lectures / jour | aucune — les sessions ne sont pas utilisées |
| Domaine, SSL, DNS, e-mail | gratuits | — |

Le seul point de vigilance à moyen terme : les conditions de Cloudflare
n'autorisent pas à faire du CDN gratuit un serveur de vidéo. Le site n'héberge
aujourd'hui qu'un `.mp4` de 6 Mo sur la page 404, ce qui est sans conséquence ;
si des vidéos de fond arrivent un jour sur les pages courantes, c'est là qu'il
faudra regarder Cloudflare Stream.

### Domaines et redirections

Le site n'est servi qu'à **une seule adresse** : `studioabime.com`. Tout le
reste y mène par une 301, pour qu'une même page n'existe jamais à deux URLs.

| Zone Cloudflare | DNS | Règle |
| --- | --- | --- |
| `studioabime.com` | apex : domaine personnalisé du Worker<br>`www` : CNAME proxifié vers l'apex | Redirect Rule sur `Hostname equals www.studioabime.com` |
| `studioabime.be` | `A @` et `A www` → `192.0.2.1`, proxifiés | Redirect Rule sur **All incoming requests** |
| `studioabime.fr` | idem | idem |

Cible, dans les trois cas :
`concat("https://studioabime.com", http.request.uri.path)`, en 301, avec
*Preserve query string*.

Trois choses qui ne s'improvisent pas :

- **La règle du `.com` doit filtrer sur le nom d'hôte**, jamais « All incoming
  requests » : cette zone sert le vrai site, et une règle attrape-tout
  redirigerait l'apex vers lui-même.
- **`192.0.2.1` est une adresse de documentation réservée**, qui ne mène nulle
  part. C'est voulu : le trafic n'y va jamais, la règle l'intercepte au bord du
  réseau. L'enregistrement n'existe que pour faire résoudre le nom — sans lui,
  la redirection n'est jamais atteinte.
- **Une Redirect Rule ne s'applique qu'à sa propre zone.** Une règle visant
  `.be` posée dans la zone `.fr` ne se déclenchera jamais.

`SSL/TLS → Full (strict)` et `Always Use HTTPS` sont à activer sur la zone
`studioabime.com` : sans le second, le site répond en clair sur le port 80.

> **Le `robots.txt` en ligne n'est pas celui du dépôt.** Le réglage **AI Crawl
> Control** de la zone injecte, *avant* le vôtre, un bloc qui refuse les robots
> d'entraînement (GPTBot, ClaudeBot, Google-Extended…) et pose un
> `Content-Signal` valant réserve de droits au titre de l'article 4 de la
> directive européenne 2019/790. `Googlebot` n'est pas concerné : le
> référencement classique reste intact. À connaître avant de s'étonner du
> contenu servi — et avant de conclure qu'un `Disallow: /` de maintenance
> protège quoi que ce soit, ce bloc contenant son propre `Allow: /`.

### Fermer le site (mode maintenance)

Le site peut être masqué derrière un écran de maintenance — une feuille posée
sur le papier de la charte, un mot aux visiteurs, et un champ de mot de passe
pour ceux qui doivent quand même voir le site.

**L'interrupteur est dans le back-office** : Réglages du site → *Écran de
maintenance*. La cliente y allume ou éteint le rideau, écrit le titre, le mot
aux visiteurs et la signature, puis publie. Comme pour tout le reste, la
publication déclenche le webhook de reconstruction : la bascule prend effet au
bout des deux minutes du build.

**Le mot de passe n'est pas dans Sanity**, et ne peut pas y être : le contenu
d'un dataset est lisible publiquement par l'API — c'est ce qui permet au site de
se construire sans jeton. Un mot de passe écrit dans le back-office serait donc
affiché à qui sait le demander. Il vit en variable d'environnement
`MAINTENANCE_PASSWORD` sur le projet Cloudflare « Site », et se change en la
modifiant puis en relançant un déploiement. Laissée vide, la variable produit un
écran sans formulaire : personne n'entre, pas même vous.

Ce que la bascule change réellement :

| | Site ouvert | Site fermé |
| --- | --- | --- |
| Rendu | HTML statique sur le CDN | à la demande, par le Worker |
| Pages publiées | 29 fichiers HTML | **aucun** — rien à trouver |
| `robots.txt` | ouvert, avec le sitemap | `Disallow: /` |
| `sitemap.xml` | toutes les URLs | vide |
| Réponse HTTP | `200` | `503` + `Retry-After` |

Le point important est la deuxième ligne : fermer le site ne pose pas un rideau
devant des pages en ligne, il les empêche d'être publiées. Le HTML du site
n'existe nulle part sur le CDN tant que le rideau est tiré — il n'y a donc rien
à contourner. Le mot de passe (`src/middleware.ts`) ouvre l'accès au rendu à la
demande pour trente jours, via un cookie qui ne contient que l'empreinte du mot
de passe.

`MAINTENANCE_MODE="on"|"off"` court-circuite le back-office. Deux usages :
travailler l'écran en local sans toucher au dataset, et rouvrir le site en
urgence si Sanity est injoignable.

> **⚠️ Le webhook doit inclure le type `maintenance`.** S'il ne déclenche un
> build que sur certains types de documents, publier l'interrupteur ne changerait
> rien en ligne.

### Le Studio

Le Studio n'est **pas** embarqué dans le site (voir `astro.config.ts`) : il est
construit par la CLI Sanity et déployé comme un projet Cloudflare indépendant.
Deux bénéfices concrets : le site public n'embarque plus React ni les 9 Mo du
back-office (le build du site est passé de ~33 s à ~7 s), et mettre à jour l'un
n'oblige pas à redéployer l'autre.

Réglages du projet Cloudflare « Studio » :

- **Build command** : `npm run studio:build`
- **Deploy command** : `npx wrangler deploy --config wrangler.studio.jsonc`

Le Studio n'a pas d'adaptateur pour lui écrire sa configuration : elle est
posée à la main dans `wrangler.studio.jsonc`, nommée pour ne pas entrer en
conflit avec celle du site. Elle n'a **pas de `main`** — le Studio est
entièrement statique, Cloudflare sert des fichiers et rien n'est facturé.

Le Studio est une application à routage client : rafraîchir la page sur
`/structure/...` demanderait un fichier qui n'existe pas. C'est
`not_found_handling: "single-page-application"` qui renvoie alors `index.html`.

> **⚠️ Ne pas remettre de `_redirects` dans `sanity/static/`.** La règle
> `/* /index.html 200`, convention de Cloudflare Pages, fait **échouer** le
> déploiement sur Workers : le serveur d'assets retire de lui-même les `/index`
> et les `.html`, si bien que `/index.html` redevient `/`, qui redéclenche
> `/*`. L'API rejette la boucle (code 100324) — et le fait à la toute dernière
> étape, après avoir monté les 398 fichiers, ce qui rend l'échec discret.

### Origines CORS

Site et back-office vivant sur deux domaines, les deux doivent être déclarés dans
Sanity → manage → API → **CORS origins** :

| Origine | Identifiants |
| --- | --- |
| `https://studio.studioabime.com` | oui (le Studio s'authentifie) |
| `https://studioabime.com` | **non** (voir ci-dessous) |
| l'URL de preview du site | oui |
| `http://localhost:3333` | oui |
| `http://localhost:4321` | oui |

Les identifiants autorisent une origine à joindre le jeton de session Sanity à
ses requêtes — donc à agir au nom de la personne connectée. On ne les accorde
qu'aux origines où quelqu'un s'authentifie réellement. La production n'en fait
pas partie : `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` y vaut `"false"`, le site
est du HTML statique et le navigateur d'un visiteur ne parle jamais à Sanity.
Les accorder élargirait la surface pour rien. À cocher le jour où l'édition
visuelle serait activée en production.

L'URL de preview change à chaque déploiement de branche (Workers Builds la
préfixe d'un identifiant de version) : déclarez-la au moment où vous travaillez
sur une branche, plutôt que de poser un joker `https://*.workers.dev` — qui
autoriserait n'importe quel site hébergé là à émettre des requêtes
authentifiées.

### Variables d'environnement

La distinction qui compte est `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` : `"false"`
en production (site 100 % statique, sans stega ni JavaScript d'édition), `"true"`
sur l'environnement de preview, où l'édition visuelle est utilisée.

**Projet « Site »**

| Variable | Production | Preview | Secret |
| --- | --- | --- | --- |
| `PUBLIC_SANITY_PROJECT_ID` | identique | identique | non |
| `PUBLIC_SANITY_DATASET` | `production` | `production` | non |
| `PUBLIC_SANITY_API_VERSION` | `2025-02-19` | idem | non |
| `PUBLIC_SANITY_STUDIO_URL` | `https://studio.studioabime.com` | idem | non |
| `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | `"false"` | `"true"` | non |
| `SANITY_API_READ_TOKEN` | — | token **Viewer** | **oui** |
| `PUBLIC_SITE_URL` | `https://studioabime.com` | URL de preview | non |
| `RESEND_API_KEY` | clé Resend | clé Resend | **oui** |
| `CONTACT_FROM_EMAIL` | expéditeur vérifié chez Resend | idem | non |
| `CONTACT_TO_EMAIL` | *(à laisser vide)* | votre adresse de test | non |
| `CONTACT_REPLY_TO_EMAIL` | adresse de réponse | idem | non |
| `PUBLIC_SHOPIFY_STORE_DOMAIN` | `xxx.myshopify.com` | idem | non |
| `PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | jeton Storefront | idem | non (public par conception) |
| `PUBLIC_SHOPIFY_API_VERSION` | `2026-07` | idem | non |
| `PUBLIC_SHOPIFY_INVENTORY_SCOPE` | `"true"` | idem | non |
| `MAINTENANCE_PASSWORD` | mot de passe de l'écran de maintenance | idem | **oui** |
| `MAINTENANCE_MODE` | vide (Sanity décide) | vide | non |

`SANITY_API_READ_TOKEN` ne sert qu'à lire les brouillons : il n'a d'utilité que
sur l'environnement de preview. L'absenter de la production, c'est une clé de
moins à exposer — et il n'y ferait rien de toute façon, `draftsEnabled` étant
faux dès que l'édition visuelle est désactivée.

`CONTACT_TO_EMAIL` est à **laisser absent en production** : `src/pages/api/contact.ts`
retombe alors sur l'adresse de la cliente, écrite dans le dépôt et donc relue à
chaque revue. Une valeur saisie à la main dans un tableau de bord ne l'est
jamais. Sur l'environnement de preview, en revanche, posez-y votre propre
adresse : c'est ce qui permet d'essayer le formulaire sans écrire à la cliente.

> **⚠️ Les quatre variables Shopify échouent en silence.** `src/lib/shopify/env.ts`
> ne lève volontairement aucune erreur quand la boutique n'est pas configurée :
> `shopifyConfigured` passe à faux et le catalogue renvoie une liste vide. Le
> build reste **vert**, et le site part sans ses produits, sans ses collections
> et sans `/cgv` ni `/retours` — dix pages en moins, aucune alerte. Le contrôle
> après déploiement : `curl -s https://studioabime.com/sitemap.xml | grep -c '<loc>'`
> doit compter 30 URLs, pas 20. `PUBLIC_SHOPIFY_INVENTORY_SCOPE` compte autant
> que les autres : sans elle, la requête réclame `quantityAvailable` sans en
> avoir le droit et Shopify rejette **toute** la requête.

`SANITY_API_WRITE_TOKEN` reste **local uniquement** (script `npm run legal:seed`).
Il ne doit être présent sur aucun environnement en ligne.

> **⚠️ Les secrets sont figés au build.** Les variables non préfixées `PUBLIC_`
> sont lues via `import.meta.env` : Vite les remplace par leur valeur au moment de
> la compilation, elles ne sont pas relues à l'exécution. Changer `RESEND_API_KEY`
> ou `SANITY_API_READ_TOKEN` dans le tableau de bord n'a donc aucun effet tant
> qu'un nouveau déploiement n'a pas été lancé.

**Projet « Studio »**

La CLI Sanity n'expose au navigateur que les variables préfixées
`SANITY_STUDIO_` — le préfixe `PUBLIC_` d'Astro y est ignoré. Le projet Studio a
donc son propre jeu, volontairement minimal :

| Variable | Valeur |
| --- | --- |
| `SANITY_STUDIO_PROJECT_ID` | identique au site |
| `SANITY_STUDIO_DATASET` | `production` |
| `SANITY_STUDIO_API_VERSION` | `2025-02-19` |
| `SANITY_STUDIO_SITE_URL` | `https://studioabime.com` — l'origine chargée dans l'aperçu du Presentation Tool |

Aucun token : le Studio authentifie chaque éditeur par son propre compte Sanity.

### Avant la première mise en ligne

- [ ] graisse **SemiBold (600) de Commuters Sans** cochée dans le projet Adobe Fonts côté
      cliente — sans elle les sous-titres sont rendus en 700 (voir § Design system) ;
- [ ] pages légales publiées (`npm run legal:seed` crée les brouillons) ;
- [ ] domaine de l'expéditeur vérifié chez Resend (enregistrements SPF/DKIM dans la zone DNS) ;
- [ ] boutique Shopify sur un forfait payant, jeton Storefront de production ;
- [ ] webhook Sanity → deploy hook opérationnel (publier un document et vérifier le rebuild) ;
- [ ] fiche d'entreprise complétée dans le Studio (Réglages → Identité et réseaux sociaux) : sans elle, les données structurées se limitent au nom et à la description du site ;
- [ ] site déclaré dans la Google Search Console, sitemap soumis (`/sitemap.xml`) ;
- [ ] `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` bien à `"false"` en production — c'est lui qui autorise l'indexation.
- [ ] `MAINTENANCE_PASSWORD` posé sur le projet Cloudflare « Site » si le site est mis en ligne fermé — sans lui, l'écran de maintenance n'a pas de porte.
- [ ] `curl -s https://studioabime.com/sitemap.xml | grep -c '<loc>'` renvoie **30** —
      moins signifie que la boutique n'est pas passée, et elle échoue en silence ;
- [ ] `grep -rl "/_image" dist/client --include="*.html"` ne renvoie rien après un build ;
- [ ] `Always Use HTTPS` et `SSL/TLS → Full (strict)` activés sur la zone ;
- [ ] les six adresses testées : apex, `www`, `.be`, `.fr` et leurs versions `http://`.

---

## Prochaines étapes suggérées

- `npx sanity typegen generate` pour dériver les types depuis les schémas et les requêtes, en remplacement des types écrits à la main dans `src/lib/sanity/types.ts` ;
- une page de statut ou une sauvegarde planifiée du dataset Sanity (`sanity dataset export`) une fois le site en production.

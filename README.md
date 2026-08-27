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

Chaque cas client peut avoir une structure propre. Deux leviers combinés :

- **`template`** choisit l'enveloppe de la page — `standard`, `immersive` ou `editorial` (`src/templates/project/`) ;
- **`sections`** compose le corps librement.

Les options propres à un modèle (couleur d'accent, vidéo de couverture, notes en marge…) vivent dans `templateOptions` et ne sont visibles dans le back-office que pour le modèle concerné.

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

Une mention dont la valeur est une adresse e-mail ou une URL devient cliquable d'elle-même (`mailto:` / lien externe) : l'éditeur saisit l'adresse, sans champ de lien supplémentaire à gérer.

Tant qu'aucune page d'accueil n'est désignée dans Sanity, la racine sert le contenu d'amorçage de `src/content/homeFallback.ts` plutôt qu'un 404. Ce fichier devient inutile — et supprimable — dès que le CMS est alimenté.

### Navigation et pied de page

Il n'y a **pas d'en-tête** : la navigation, les réseaux sociaux, le crédit de réalisation et le sélecteur de langue vivent dans le pied de page, face au logo. `src/components/Header.astro` est conservé au cas où une barre de navigation deviendrait nécessaire sur les pages intérieures.

La baseline du pied de page a une valeur par défaut dans le composant ; dès que « Texte de pied de page » est renseigné dans Sanity, c'est le CMS qui prend la main.

### Curseur personnalisé

`src/components/CustomCursor.astro` — un disque qui suit la souris avec un léger retard (interpolation à 0.18 par image), s'ouvre en anneau au survol des éléments interactifs et se contracte au clic.

Écrit en script natif plutôt qu'en îlot Vue : sans état partagé ni props, un composant framework coûterait un runtime complet pour une boucle d'animation de quelques lignes.

Trois garde-fous : activé uniquement sur pointeur fin (jamais sur tactile), le curseur système n'est masqué qu'une fois le nôtre en place (si le script échoue, l'utilisateur garde son curseur), et `prefers-reduced-motion` supprime le retard.

> **⚠️ Licence des fontes.** Commuters Sans est actuellement le fichier **« Fontspring DEMO »** (`.otf`) : jeu de glyphes réduit et licence non valable pour une mise en production web. Remplacer `public/fonts/CommutersSans-SemiBold.otf` par la version webfont sous licence (`.woff2`) avant mise en ligne — le nom de famille CSS étant inchangé, aucune autre modification ne sera nécessaire.

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
| Site | `npm run build` | `dist/` | `studio-abime.com` |
| Studio | `npm run studio:build` | `dist-studio/` | `studio.studio-abime.com` |

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

Réglages du projet Cloudflare « Site » (Workers & Pages → connecter le dépôt) :

- **Build command** : `npm run build`
- **Build output directory** : `dist`

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

### Le Studio

Le Studio n'est **pas** embarqué dans le site (voir `astro.config.ts`) : il est
construit par la CLI Sanity et déployé comme un projet Cloudflare indépendant.
Deux bénéfices concrets : le site public n'embarque plus React ni les 9 Mo du
back-office (le build du site est passé de ~33 s à ~7 s), et mettre à jour l'un
n'oblige pas à redéployer l'autre.

Réglages du projet Cloudflare « Studio » :

- **Build command** : `npm run studio:build`
- **Build output directory** : `dist-studio`

Le Studio est une application à routage client : rafraîchir la page sur
`/structure/...` demanderait un fichier qui n'existe pas. Le fichier
`sanity/static/_redirects`, recopié dans le build, renvoie donc toutes les URLs
vers `index.html`.

### Origines CORS

Site et back-office vivant sur deux domaines, les deux doivent être déclarés dans
Sanity → manage → API → **CORS origins** :

| Origine | Identifiants |
| --- | --- |
| `https://studio.studio-abime.com` | oui (le Studio s'authentifie) |
| `https://studio-abime.com` | oui (lecture des brouillons en édition visuelle) |
| l'URL de preview du site | oui |
| `http://localhost:3333` | oui |
| `http://localhost:4321` | oui |

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
| `PUBLIC_SANITY_STUDIO_URL` | `https://studio.studio-abime.com` | idem | non |
| `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` | `"false"` | `"true"` | non |
| `SANITY_API_READ_TOKEN` | — | token **Viewer** | **oui** |
| `PUBLIC_SITE_URL` | `https://studio-abime.com` | URL de preview | non |
| `RESEND_API_KEY` | clé Resend | clé Resend | **oui** |
| `CONTACT_FROM_EMAIL` | expéditeur vérifié chez Resend | idem | non |
| `CONTACT_TO_EMAIL` | destinataire du formulaire | idem | non |
| `CONTACT_REPLY_TO_EMAIL` | adresse de réponse | idem | non |
| `PUBLIC_SHOPIFY_STORE_DOMAIN` | `xxx.myshopify.com` | idem | non |
| `PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | jeton Storefront | idem | non (public par conception) |
| `PUBLIC_SHOPIFY_API_VERSION` | `2026-07` | idem | non |

`SANITY_API_READ_TOKEN` ne sert qu'à lire les brouillons : il n'a d'utilité que
sur l'environnement de preview. Le laisser vide en production, c'est une clé de
moins à exposer.

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
| `SANITY_STUDIO_SITE_URL` | `https://studio-abime.com` — l'origine chargée dans l'aperçu du Presentation Tool |

Aucun token : le Studio authentifie chaque éditeur par son propre compte Sanity.

### Avant la première mise en ligne

- [ ] remplacer la fonte **Commuters Sans « Fontspring DEMO »** par sa version sous
      licence web (voir § Design system) — la licence actuelle n'autorise pas la production ;
- [ ] pages légales publiées (`npm run legal:seed` crée les brouillons) ;
- [ ] domaine de l'expéditeur vérifié chez Resend (enregistrements SPF/DKIM dans la zone DNS) ;
- [ ] boutique Shopify sur un forfait payant, jeton Storefront de production ;
- [ ] webhook Sanity → deploy hook opérationnel (publier un document et vérifier le rebuild) ;
- [ ] fiche d'entreprise complétée dans le Studio (Réglages → Identité et réseaux sociaux) : sans elle, les données structurées se limitent au nom et à la description du site ;
- [ ] site déclaré dans la Google Search Console, sitemap soumis (`/sitemap.xml`) ;
- [ ] `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` bien à `"false"` en production — c'est lui qui autorise l'indexation.

---

## Prochaines étapes suggérées

- `npx sanity typegen generate` pour dériver les types depuis les schémas et les requêtes, en remplacement des types écrits à la main dans `src/lib/sanity/types.ts` ;
- une page de statut ou une sauvegarde planifiée du dataset Sanity (`sanity dataset export`) une fois le site en production.

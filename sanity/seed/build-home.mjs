/**
 * Génère le fichier d'import de la page d'accueil.
 *
 *   node sanity/seed/build-home.mjs
 *   npx sanity dataset import sanity/seed/home.ndjson production
 *
 * Reprend à l'identique le contenu d'amorçage de `src/content/homeFallback.ts`
 * et le transpose en documents Sanity. Une fois importé, la page d'accueil est
 * éditable depuis le Studio et le contenu d'amorçage n'est plus jamais rendu —
 * il peut alors être supprimé.
 *
 * Les visuels sont référencés par `_sanityAsset` : l'import téléverse les
 * fichiers locaux et remplace la référence par l'asset créé. Rejouer l'import
 * ne les duplique pas — Sanity dédoublonne sur l'empreinte du fichier.
 *
 * Les `_id` sont fixes et volontairement lisibles : réexécuter l'import met à
 * jour les mêmes documents au lieu d'en créer de nouveaux.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const assets = resolve(here, '../../src/assets/sections');

/** Référence un fichier local, que l'import téléversera. */
const asset = (file, alt = '') => ({
  _type: 'image',
  _sanityAsset: `image@file://${resolve(assets, file)}`,
  ...(alt ? { alt } : {}),
});

const HOME_ID = 'page.accueil.fr';

const home = {
  _id: HOME_ID,
  _type: 'page',
  language: 'fr',
  title: 'Accueil',
  slug: { _type: 'slug', current: 'accueil' },
  sections: [
    {
      _key: 'hero',
      _type: 'manifestoHero',
      metaLines: [
        { _key: 'par', label: 'Par', value: 'Studio Abîme' },
        { _key: 'type', label: 'Type', value: 'Labo de Com' },
        { _key: 'mail', label: 'Mail', value: 'elodie@studioabime.com' },
        { _key: 'date', label: 'Date', autoDate: true },
      ],
      hypothesisLabel: 'HYPOTHÈSE',
      hypothesis: "communiquer, c'est relier des systèmes.",
      intentionLabel: "NOTE D'INTENTION",
      intention: [
        "Ce qu'on montre est toujours un choix, jamais un hasard.",
        'Autant le faire consciemment.',
      ],
      tagline:
        "Studio Abîme est un labo de com et d'identités sensorielles qui naissent d'une plongée sous le visible.",
      showStamp: true,
    },
    {
      _key: 'services',
      _type: 'servicesMenu',
      image: asset('labo-de-com.webp'),
      groups: [
        { _key: 'g1', title: 'Labo de com', items: ['Recherche de Sens', 'Accompagnement', 'Audit'] },
        { _key: 'g2', title: 'Définition', items: ['Direction artistique', 'Conception rédaction'] },
        {
          _key: 'g3',
          title: 'Production',
          items: ['Identité sensorielle', 'Graphisme', 'Visuels', 'Rédaction'],
        },
        {
          _key: 'g4',
          title: 'Expansion',
          items: ['Déploiement', 'Ateliers & formations', 'Conférences', 'Outils de com'],
        },
      ],
    },
    {
      _key: 'statement',
      _type: 'studioStatement',
      statement:
        "Studio Abîme est un espace où on ne produit pas pour vous mais où on expérimente la communication ensemble. Un labo dans lequel on relie les outils et les langages qui font un projet. Son identité ne se regarde pas seulement. Elle se vit.",
      noteNumber: 'fig.04',
      note: "— On étudie la communication à l'échelle humaine : celle des sens, des émotions et des moyens réels dont un projet dispose.",
      marker: '94,65+50,65',
      figures: [
        {
          _key: 'f5',
          number: 'fig.05',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'left',
          image: asset('etude-lune.webp'),
        },
        {
          _key: 'f6',
          number: 'fig.06',
          caption: 'Compréhension de la constitution',
          span: 3,
          image: asset('papier-lumiere.webp'),
        },
        {
          _key: 'f7',
          number: 'fig.07',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'right',
          pushRight: true,
          image: asset('atelier-bandes.webp'),
        },
      ],
      cta: {
        _type: 'link',
        kind: 'external',
        label: 'Entrer dans le studio →',
        externalUrl: '/projets',
        openInNewTab: false,
      },
    },
    {
      _key: 'plate',
      _type: 'plateSpread',
      background: asset('planche-fond.webp'),
      figures: [
        {
          _key: 'p1',
          number: 'fig.01',
          caption: 'Fam. des ranunculaceæ — Ancolie (Aquilegia)',
          image: asset('planche-main.webp'),
        },
        {
          _key: 'p2',
          number: 'fig.02',
          caption: 'Fam. des liliaceæ — Asphodèle (Asphodelus)',
          image: asset('planche-cercle.webp'),
        },
      ],
    },
    {
      _key: 'sensory-quote',
      _type: 'pullQuote',
      text: `Personne ne perçoit avec les
yeux seulement. Une identité
qui ne joue que sur la vue se
prive du reste des ressentis.
La question n'est pas de
savoir si votre proposition a
une odeur ou un son.
C'est de savoir si vous les
avez choisis.`,
      measure: 'wide',
      fullHeight: true,
    },
    {
      // Sélection laissée vide : à remplir une fois les projets créés.
      // La section ne s'affiche pas tant qu'aucun projet n'est choisi.
      _key: 'showcase',
      _type: 'projectShowcase',
      startNumber: 1,
      projects: [],
    },
    {
      _key: 'lettre',
      _type: 'fullBleedImage',
      image: asset('lettre-manuscrite.webp'),
    },
  ],
};

const siteSettings = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  socialLinks: [],
};

const localizedSettings = {
  _id: 'localizedSettings.fr',
  _type: 'localizedSettings',
  language: 'fr',
  siteTitle: 'Studio Abîme',
  siteDescription:
    "Studio Abîme est un labo de com et d'identités sensorielles qui naissent d'une plongée sous le visible.",
  homePage: { _type: 'reference', _ref: HOME_ID },
  projectsIntro: '',
  headerNav: [],
  footerNav: [],
};

const documents = [siteSettings, home, localizedSettings];
const out = resolve(here, 'home.ndjson');

writeFileSync(out, documents.map((doc) => JSON.stringify(doc)).join('\n') + '\n', 'utf8');
console.log(`${documents.length} documents écrits dans ${out}`);

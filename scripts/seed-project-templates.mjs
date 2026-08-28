/**
 * Trois projets de DÉMONSTRATION, un par modèle de page.
 *
 *   npm run projects:demo            crée ce qui manque
 *   npm run projects:demo -- --remove  les retire tous les trois
 *
 * À quoi ça sert : voir les trois mises en page côte à côte, remplies, sans
 * toucher aux vrais cas clients ni improviser un contenu de test dans le
 * Studio. Chaque projet porte le nom de son modèle — la page dit ce qu'elle
 * démontre.
 *
 * PARTIS PRIS
 *
 * 1. Documents PUBLIÉS, et non brouillons : un brouillon n'est pas servi par le
 *    site, et ces projets n'existent que pour être regardés en page.
 *
 * 2. `featured: false` — les projets favoris occupent les cases réservées de la
 *    table des éléments. Une démonstration ne prend la place de personne.
 *
 * 3. Année 2019, la plus ancienne du catalogue : le numéro d'un projet est son
 *    rang par année (voir `projectDisplayNumber`). Ajouter des projets récents
 *    aurait décalé la numérotation de tous les vrais projets ; en dernière
 *    position, ils ne décalent rien.
 *
 * 4. Les images sont des assets DÉJÀ présents dans le dataset, référencés par
 *    identifiant. Rien n'est téléversé, rien n'est dupliqué, et `--remove` ne
 *    supprime donc aucun fichier.
 *
 * 5. Identifiants fixes (`project-demo-split-fr`…) : relancé, le script ne crée
 *    pas de doublons, et `--remove` sait exactement quoi retirer.
 *
 * Comme `seed-legal-pages.mjs`, ce script est autonome — il lit `process.env` et
 * demande un jeton d'ÉCRITURE (`SANITY_API_WRITE_TOKEN`), jamais exposé au
 * navigateur.
 */
import { createClient } from '@sanity/client';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2025-02-19';
const token = process.env.SANITY_API_WRITE_TOKEN;
const language = 'fr';
const remove = process.argv.includes('--remove');

const ok = (message) => console.log(`\x1b[32m✓\x1b[0m ${message}`);
const skip = (message) => console.log(`\x1b[33m·\x1b[0m ${message}`);
const ko = (message) => console.error(`\x1b[31m✗\x1b[0m ${message}`);

if (!projectId || !token) {
  ko('Configuration incomplète.');
  console.error(
    '\n  Renseignez dans .env :\n' +
      '    PUBLIC_SANITY_PROJECT_ID\n' +
      '    SANITY_API_WRITE_TOKEN   (sanity.io/manage → API → Tokens, rôle « Editor »)\n',
  );
  process.exit(1);
}

/* Clés dérivées d'un compteur : deux exécutions produisent le même document. */
let counter = 0;
const key = (prefix) => `${prefix}${(counter++).toString(36)}`;

/* ── Assets ──────────────────────────────────────────────────────────────────
   Choisis dans ce qui existe déjà : deux formats verticaux, deux paysages, deux
   matières. De quoi éprouver les trames sans ressembler à un vrai projet.     */
const IMG = {
  portrait: 'image-05ebc453c81217545b394c061ed064740a3fc970-1182x1728-png',
  atelier: 'image-21acbf39779c0755c3d12d722ef5f46e829b1d41-900x1349-webp',
  gouttes: 'image-23109957792ff538dc3a1fe12a9408a661a995c3-2480x3508-jpg',
  papier: 'image-0f9129f48dc7fe88935af911dbdc8865aad1a8e7-4000x6000-png',
  planche: 'image-4c101c36f53c4b1edb22173789a1bad62e279c22-1600x1122-webp',
  paysage: 'image-346f540d9a718071ac5040adc8b9ed5a99399744-1719x1205-png',
  lumiere: 'image-39344ebf16d6cb8b2113a938cbd44ae9b12bb136-422x600-webp',
};

const image = (ref, alt) => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: ref },
  alt,
});

/** Paragraphe de Portable Text — le schéma `richText` n'accepte que ses styles. */
const para = (text) => ({
  _type: 'block',
  _key: key('b'),
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: key('s'), text, marks: [] }],
});

const textSection = (heading, paragraphs) => ({
  _type: 'richTextSection',
  _key: key('sec'),
  heading,
  body: paragraphs.map(para),
});

/* ── Fond commun ─────────────────────────────────────────────────────────────
   Les trois fiches sont identiques : ce qui change d'une page à l'autre doit
   être la MISE EN PAGE, pas le contenu. Le relevé compte assez de lignes pour
   qu'on voie comment il se comporte dans chacune.                            */
const fiche = {
  client: 'Démonstration',
  sector: 'Gabarit',
  year: 2019,
  services: ['mise en page', 'gabarit', 'démonstration'],
  channels: [
    {
      _type: 'channel',
      _key: key('ch'),
      label: 'Studio Abîme',
      url: 'https://studioabime.com',
    },
  ],
};

const LOREM = [
  'Ce projet n’existe pas. Il sert à regarder une mise en page une fois remplie : la longueur du texte, la place des images, ce que devient le relevé quand la colonne se resserre.',
  'Le contenu est volontairement neutre et de longueur ordinaire — ni une ligne, ni trois écrans. C’est dans cette zone-là qu’une mise en page se juge : les cas extrêmes se corrigent, la moyenne se subit.',
  'Pour éprouver un cas limite, allongez ce paragraphe dans le Studio et rechargez : les trois modèles réagissent différemment, et c’est précisément ce qu’il y a à voir.',
];

/* ── Les trois projets ───────────────────────────────────────────────────── */

const projects = [
  {
    template: 'split',
    title: 'Gabarit — Colonne fixe',
    headline: 'Le texte tient en place, les images défilent.',
    excerpt:
      'Projet de démonstration du modèle « Colonne fixe » : colonne de gauche fixe, planche de droite défilante.',
    thumbnail: IMG.portrait,
    sections: [
      textSection('Ce que montre ce gabarit', [
        LOREM[0],
        'La colonne de gauche reste calée en haut de l’écran pendant que la planche se déroule. Le texte doit donc tenir dans une hauteur d’écran — au-delà, il passerait sous le bord bas.',
        LOREM[2],
      ]),
    ],
    /* Trame de 2 colonnes : on alterne les largeurs pour voir les deux cas. */
    gallery: [
      { ref: IMG.gouttes, span: '2', caption: 'Une image sur toute la largeur de la planche' },
      { ref: IMG.portrait, span: '1', caption: 'Une colonne' },
      { ref: IMG.atelier, span: '1', caption: 'Une colonne' },
      { ref: IMG.planche, span: '2', caption: 'Deux colonnes' },
      { ref: IMG.lumiere, span: '1' },
      { ref: IMG.papier, span: '1', caption: 'Une légende plus longue, pour voir où elle se coupe sous son visuel' },
    ],
  },
  {
    template: 'banner',
    title: 'Gabarit — Bandeau',
    headline: 'Le titre ouvre, la planche ferme.',
    excerpt:
      'Projet de démonstration du modèle « Bandeau » : titre et texte en haut, planche d’images en bandeau dessous.',
    thumbnail: IMG.paysage,
    sections: [
      textSection('Ce que montre ce gabarit', [
        LOREM[0],
        'Ici rien n’est fixe : la page se lit de haut en bas. Le texte occupe la colonne de gauche, le relevé le coin droit, et la planche prend toute la largeur en dessous.',
        LOREM[2],
      ]),
    ],
    /* Trame de 3 colonnes : les trois largeurs sont représentées. */
    gallery: [
      { ref: IMG.planche, spanWide: '3', caption: 'Toute la largeur du bandeau' },
      { ref: IMG.portrait, spanWide: '1', caption: 'Une colonne' },
      { ref: IMG.gouttes, spanWide: '2', caption: 'Deux colonnes' },
      { ref: IMG.atelier, spanWide: '1' },
      { ref: IMG.lumiere, spanWide: '1' },
      { ref: IMG.paysage, spanWide: '1', caption: 'Une colonne' },
    ],
  },
  {
    template: 'composition',
    title: 'Gabarit — Composition libre',
    headline: 'Textes, figures et notes, dans l’ordre que vous voulez.',
    excerpt:
      'Projet de démonstration du modèle « Composition libre » : la saisie des articles du Journal, appliquée à un projet.',
    thumbnail: IMG.gouttes,
    /*
      Aucune section ni planche : ce modèle compose son corps avec les blocs
      ci-dessous. Les champs des deux autres modèles restent d'ailleurs masqués
      dans le Studio tant que celui-ci est sélectionné.
    */
    blocks: [
      {
        _type: 'journalProse',
        _key: key('bl'),
        body: [para(LOREM[0]), para(
          'La composition se lit comme un article : le texte court dans une colonne, et tout l’appareil — figures de marge, notes numérotées — se tient en face, dans le blanc de droite.',
        )],
      },
      {
        _type: 'journalFigure',
        _key: key('bl'),
        images: [image(IMG.gouttes, 'Figure de démonstration, pleine colonne')],
        caption: 'Une figure large : elle prend toute la colonne de lecture.',
        placement: 'texte',
        scale: 'pleine',
      },
      {
        _type: 'journalProse',
        _key: key('bl'),
        body: [para(
          'Deux blocs de texte séparés par une figure valent mieux qu’un seul bloc où l’on aurait glissé l’image : c’est la suite des blocs qui fait la mise en page, et leur ordre se réorganise à la souris dans le Studio.',
        )],
      },
      {
        _type: 'journalNote',
        _key: key('bl'),
        text: 'Une note de marge. Elle se numérote toute seule, dans l’ordre de la liste, et vient se placer à hauteur du texte qui la précède.',
      },
      {
        _type: 'journalFigure',
        _key: key('bl'),
        images: [image(IMG.lumiere, 'Figure de marge')],
        caption: 'Une figure en marge, en tout petit.',
        placement: 'marge',
      },
      {
        _type: 'journalProse',
        _key: key('bl'),
        body: [para(LOREM[1])],
      },
      {
        _type: 'journalFigure',
        _key: key('bl'),
        images: [
          image(IMG.portrait, 'Première image d’une figure à trois'),
          image(IMG.atelier, 'Deuxième image d’une figure à trois'),
          image(IMG.papier, 'Troisième image d’une figure à trois'),
        ],
        caption: 'Trois images côte à côte sous une seule légende.',
        placement: 'texte',
        scale: 'colonne',
      },
      {
        _type: 'journalProse',
        _key: key('bl'),
        body: [para(LOREM[2])],
      },
    ],
  },
];

/** Document complet, prêt à écrire. */
function toDocument({ template, title, headline, excerpt, thumbnail, sections, gallery, blocks }) {
  const slug = `gabarit-${template}`;

  return {
    _id: `project-demo-${template}-${language}`,
    _type: 'project',
    language,
    template,
    title,
    slug: { _type: 'slug', current: slug },
    headline,
    excerpt,
    visible: true,
    featured: false,
    thumbnail: image(thumbnail, `Vignette du gabarit « ${title} »`),
    ...fiche,
    ...(sections ? { sections } : {}),
    ...(gallery
      ? {
          gallery: gallery.map(({ ref, span, spanWide, caption }) => ({
            _type: 'galleryItem',
            _key: key('g'),
            image: image(ref, caption ?? 'Visuel de démonstration'),
            ...(span ? { span } : {}),
            ...(spanWide ? { spanWide } : {}),
            ...(caption ? { caption } : {}),
          })),
        }
      : {}),
    ...(blocks ? { blocks } : {}),
    seo: {
      _type: 'seo',
      description: excerpt,
      /* Une page de démonstration n'a rien à faire dans un moteur de recherche. */
      noIndex: true,
    },
  };
}

/* ── Écriture ────────────────────────────────────────────────────────────── */

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
const documents = projects.map(toDocument);

if (remove) {
  const ids = documents.flatMap((doc) => [doc._id, `drafts.${doc._id}`]);
  const present = await client.fetch('*[_id in $ids]._id', { ids });

  if (present.length === 0) {
    console.log('\n  Rien à retirer : aucun projet de démonstration dans le dataset.\n');
    process.exit(0);
  }

  await client.transaction(present.reduce((tx, id) => tx.delete(id), client.transaction())).commit();
  present.forEach((id) => ok(`${id} — supprimé.`));
  console.log(`\n  ${present.length} document(s) retiré(s) de « ${dataset} ». Aucune image n’a été supprimée.\n`);
  process.exit(0);
}

const results = [];

for (const doc of documents) {
  const existing = await client.fetch('*[_id in $ids][0]._id', {
    ids: [doc._id, `drafts.${doc._id}`],
  });

  if (existing) {
    skip(`${doc.title} — déjà présent (${existing}), inchangé.`);
    results.push(false);
    continue;
  }

  await client.create(doc);
  /* Segment `projects` en français (voir `src/i18n/routes.ts`). */
  ok(`${doc.title} — publié (/experiences/${doc.slug.current}).`);
  results.push(true);
}

const created = results.filter(Boolean).length;

console.log(
  created > 0
    ? `\n  ${created} projet(s) de démonstration publié(s) dans « ${dataset} ».\n\n` +
        '  Ils apparaissent dans la grille des Expériences, en fin de catalogue.\n' +
        '  Pour les retirer : npm run projects:demo -- --remove\n'
    : '\n  Rien à créer : les trois gabarits existent déjà.\n',
);

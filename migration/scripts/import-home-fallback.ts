import { createReadStream } from 'node:fs';
import { basename, resolve } from 'node:path';
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2025-02-19' });
const root = process.cwd();

const assetSources = {
  etudeLune: 'src/assets/sections/etude-lune.webp',
  papierLumiere: 'src/assets/sections/papier-lumiere.webp',
  atelierBandes: 'src/assets/sections/atelier-bandes.webp',
  plancheMain: 'src/assets/sections/planche-main.webp',
  plancheCercle: 'src/assets/sections/planche-cercle.webp',
  laboDeCom: 'src/assets/sections/labo-de-com.webp',
  lettreManuscrite: 'src/assets/sections/lettre-manuscrite.webp',
} as const;

type AssetKey = keyof typeof assetSources;

async function uploadImage(key: AssetKey) {
  const path = resolve(root, assetSources[key]);
  const filename = basename(path);
  const existing = await client.fetch<string | null>(
    '*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id',
    { filename },
  );

  const assetId = existing ?? (await client.assets.upload('image', createReadStream(path), { filename }))._id;
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
}

async function main() {
  const preflight = await client.fetch<{
    pageId?: string;
    settings?: { _id: string; homePageId?: string };
  }>(`{
    "pageId": *[_type == "page" && language == "fr" && slug.current == "accueil"][0]._id,
    "settings": *[_type == "localizedSettings" && language == "fr"][0]{_id, "homePageId": homePage._ref}
  }`);

  if (preflight.pageId || preflight.settings) {
    if (preflight.pageId && preflight.settings?.homePageId === preflight.pageId) {
      console.log(
        JSON.stringify(
          { status: 'already-imported', pageId: preflight.pageId, settingsId: preflight.settings._id },
          null,
          2,
        ),
      );
      return;
    }

    throw new Error(
      'Une page « accueil » ou des réglages français existent déjà. Import interrompu avant toute écriture.',
    );
  }

  const images = Object.fromEntries(
    await Promise.all(
      (Object.keys(assetSources) as AssetKey[]).map(async (key) => [key, await uploadImage(key)]),
    ),
  ) as Record<AssetKey, { _type: 'image'; asset: { _type: 'reference'; _ref: string } }>;

  const sections = [
    {
      _key: 'hero',
      _type: 'manifestoHero',
      metaLines: [
        { _key: 'par', _type: 'object', label: 'Par', value: 'Studio Abime' },
        { _key: 'type', _type: 'object', label: 'Type', value: 'Labo de Com' },
        { _key: 'mail', _type: 'object', label: 'Mail', value: 'elodie@studioabime.com' },
        { _key: 'date', _type: 'object', label: 'Date', autoDate: true },
      ],
      hypothesisLabel: 'HYPOTHÈSE',
      hypothesis: "communiquer, c'est relier des systèmes.",
      intentionLabel: "NOTE D'INTENTION",
      intention: [
        "Ce qu'on montre est toujours un choix, jamais un hasard.",
        'Autant le faire consciemment.',
      ],
      tagline:
        "Studio Abime est un labo de com et d'identités sensorielles qui naissent d'une plongée sous le visible.",
    },
    {
      _key: 'services',
      _type: 'servicesMenu',
      image: { ...images.laboDeCom, alt: 'Composition graphique du Studio Abîme' },
      groups: [
        {
          _key: 'g1',
          _type: 'object',
          title: 'Labo de com',
          items: ['Recherche de Sens', 'Accompagnement', 'Audit'],
        },
        {
          _key: 'g2',
          _type: 'object',
          title: 'Définition',
          items: ['Direction artistique', 'Conception rédaction'],
        },
        {
          _key: 'g3',
          _type: 'object',
          title: 'Production',
          items: ['Identité sensorielle', 'Graphisme', 'Visuels', 'Rédaction'],
        },
        {
          _key: 'g4',
          _type: 'object',
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
      note:
        "— On étudie la communication à l'échelle humaine : celle des sens, des émotions et des moyens réels dont un projet dispose.",
      marker: '94,65+50,65',
      figures: [
        {
          _key: 'f5',
          _type: 'object',
          image: { ...images.etudeLune, alt: 'Étude lunaire' },
          number: 'fig.05',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'left',
        },
        {
          _key: 'f6',
          _type: 'object',
          image: { ...images.papierLumiere, alt: 'Papier traversé par la lumière' },
          number: 'fig.06',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'none',
        },
        {
          _key: 'f7',
          _type: 'object',
          image: { ...images.atelierBandes, alt: 'Recherche graphique en atelier' },
          number: 'fig.07',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'right',
          pushRight: true,
        },
        {
          _key: 'f8',
          _type: 'object',
          image: { ...images.plancheMain, alt: 'Contour de main dessiné sur papier' },
          number: 'fig.08',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'none',
        },
        {
          _key: 'f9',
          _type: 'object',
          image: { ...images.plancheCercle, alt: 'Empreinte circulaire sur papier' },
          number: 'fig.09',
          caption: 'Compréhension de la constitution',
          span: 5,
          bleed: 'none',
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
    },
    {
      _key: 'showcase',
      _type: 'projectShowcase',
    },
    {
      _key: 'lettre',
      _type: 'fullBleedImage',
      image: { ...images.lettreManuscrite, alt: 'Lettre manuscrite du Studio Abîme' },
    },
  ];

  const page = {
    _type: 'page',
    language: 'fr',
    title: 'Studio Abîme',
    slug: { _type: 'slug', current: 'accueil' },
    sections,
    seo: {
      _type: 'seo',
      title: 'Studio Abîme',
      description:
        "Studio Abîme est un labo de communication et d’identités sensorielles qui naissent d’une plongée sous le visible.",
      image: images.laboDeCom,
      noIndex: false,
    },
  };

  const savedPage = await client.create(page);

  await client.createIfNotExists({
    _id: 'siteSettings',
    _type: 'siteSettings',
  });

  await client.createIfNotExists({
    _id: 'localizedSettings-fr',
    _type: 'localizedSettings',
    language: 'fr',
    siteTitle: 'Studio Abîme',
    siteDescription:
      "Studio Abîme est un labo de communication et d’identités sensorielles qui naissent d’une plongée sous le visible.",
    defaultSeoImage: images.laboDeCom,
    homePage: { _type: 'reference', _ref: savedPage._id },
  });

  const validation = await client.fetch(`{
    "page": *[_id == $pageId][0]{_id, _type, title, language, "sectionCount": count(sections)},
    "settings": *[_id == "localizedSettings-fr"][0]{_id, language, "homePageId": homePage._ref},
    "assetCount": count(*[_type == "sanity.imageAsset" && originalFilename in $filenames])
  }`, {
    pageId: savedPage._id,
    filenames: Object.values(assetSources).map((path) => basename(path)),
  });

  console.log(JSON.stringify(validation, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

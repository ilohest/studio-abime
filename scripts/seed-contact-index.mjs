/**
 * Amorçage de l'index de la page Contact.
 *
 *   npm run index:seed
 *
 * L'index qui referme le site est CURATÉ : c'est un acte éditorial, et c'est
 * ce qui fait qu'on le lit. Ce script n'écrit donc pas l'index — il pose la
 * planche à élaguer :
 *
 *   1. une liste de notions du vocabulaire du studio, avec leur catégorie de
 *      glossaire et leurs renvois de section — à relire, à réécrire, à couper ;
 *   2. les ŒUVRES CITÉES, elles, sont trouvées dans le dataset : un projet ou
 *      un article n'est rattaché à une notion que si le mot figure RÉELLEMENT
 *      dans son titre ou son chapô. Aucune association n'est inventée.
 *
 * Les folios (« 01.2 ») ne sont écrits nulle part : ils sont calculés au rendu
 * depuis `src/lib/siteIndex.ts`. Ce script n'écrit que des clés de section.
 *
 * DEUX PARTIS PRIS, repris de `seed-legal-pages.mjs`
 *
 * 1. L'écriture va dans le BROUILLON de la page Contact, jamais dans la version
 *    publiée. Rien n'apparaît en ligne tant que le brouillon n'est pas publié
 *    depuis le Studio — le temps de relire des définitions que ce script a
 *    proposées mais que le studio seul peut valider.
 *
 * 2. Un index déjà saisi n'est jamais écrasé. Relancé, le script passe son tour.
 *
 *      npm run index:seed              amorce ce qui est vide
 *      npm run index:seed -- --replace REMPLACE l'index du brouillon
 *
 * Jeton d'écriture attendu dans `.env`, comme pour les autres scripts :
 *
 *   SANITY_API_WRITE_TOKEN="sk..."
 */
import { createClient } from '@sanity/client';

const replace = process.argv.includes('--replace');

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2025-02-19';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.error('PUBLIC_SANITY_PROJECT_ID manquant dans .env.');
  process.exit(1);
}

if (!token) {
  console.error(
    'SANITY_API_WRITE_TOKEN manquant dans .env.\n' +
      'À créer sur sanity.io/manage → API → Tokens, rôle « Editor ».',
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

/**
 * PLANCHE DE DÉPART — à réécrire.
 *
 * Ces définitions sont une PROPOSITION, tirée du vocabulaire déjà employé sur
 * le site ; elles n'engagent pas le studio tant qu'elles n'ont pas été
 * relues. Couper une notion vaut mieux que garder une définition tiède : un
 * index se juge à ce qu'on y a refusé.
 *
 * `sections` : clés de `src/lib/siteIndex.ts` — « labo », « labo:vision »,
 * « experiences », « experiences:references », « journal », « journal:actualites »,
 * « shop », « contact », « contact:enquete »…
 */
const NOTIONS = [
  { term: 'Abîme', category: 'n. m.', definition: 'Ce qui se tient sous la surface d’un projet, et qu’il faut aller chercher.', sections: ['labo', 'labo:vision'] },
  { term: 'Archive', category: 'n. f.', definition: 'Ce que le studio garde, classe et ressort — la matière d’avant le projet.', sections: ['labo:archives', 'experiences'] },
  { term: 'Atelier', category: 'n. m.', definition: 'Le lieu où les choses sont encore en morceaux.', sections: ['labo', 'labo:equipe'] },
  { term: 'Cahier de recherche', category: 'n. m.', definition: 'Le carnet public du studio : ce qui s’essaie avant de servir.', sections: ['journal:cahier-de-recherche'] },
  { term: 'Chapô', category: 'n. m.', definition: 'Les quelques lignes qui décident si le reste sera lu.', sections: ['journal'] },
  { term: 'Enquête', category: 'n. f.', definition: 'La fiche par laquelle un projet entre au studio.', sections: ['contact:enquete'] },
  { term: 'Épreuve', category: 'n. f.', definition: 'L’état intermédiaire qu’on regarde avant de décider.', sections: ['experiences', 'labo:services'] },
  { term: 'Figure', category: 'n. f.', definition: 'Une image légendée, numérotée, versée au dossier.', sections: ['experiences', 'journal'] },
  { term: 'Fragment', category: 'n. m.', definition: 'Un morceau gardé sans savoir encore de quoi il fera partie.', sections: ['contact:enquete', 'labo:archives'] },
  { term: 'Germe', category: 'n. m.', definition: 'L’état d’un projet qui existe sans avoir encore de forme.', sections: ['contact:enquete'] },
  { term: 'Grain', category: 'n. m.', definition: 'La texture d’un support, et ce qu’elle fait à une image.', sections: ['shop', 'experiences'] },
  { term: 'Impression', category: 'n. f.', definition: 'Le moment où une décision devient irréversible.', sections: ['shop', 'labo:services'] },
  { term: 'Labo', category: 'n. m.', definition: 'La part du studio qui cherche sans commande.', sections: ['labo'] },
  { term: 'Lumière', category: 'n. f.', definition: 'Ce qui traverse le papier et le rend lisible autrement.', sections: ['experiences', 'labo'] },
  { term: 'Matière', category: 'n. f.', definition: 'Ce qui résiste : le papier, l’encre, le budget, le temps.', sections: ['labo:services', 'shop'] },
  { term: 'Papier', category: 'n. m.', definition: 'Le premier support, et l’unité de mesure de tout le reste.', sections: ['shop', 'experiences'] },
  { term: 'Planche', category: 'n. f.', definition: 'Une série d’images composée pour être vue d’un seul regard.', sections: ['experiences:cas-etude'] },
  { term: 'Plongée', category: 'n. f.', definition: 'La méthode : descendre sous le visible avant de dessiner.', sections: ['labo:vision'] },
  { term: 'Référence', category: 'n. f.', definition: 'Un travail cité, non pour l’imiter mais pour situer le sien.', sections: ['experiences:references'] },
  { term: 'Relevé', category: 'n. m.', definition: 'La fiche d’un projet : client, année, canaux, services.', sections: ['experiences:cas-etude'] },
  { term: 'Trame', category: 'n. f.', definition: 'La grille sous l’image, celle qu’on ne voit qu’en s’approchant.', sections: ['experiences', 'labo:services'] },
  { term: 'Visible', category: 'adj. et n. m.', definition: 'La surface — point de départ, jamais point d’arrivée.', sections: ['labo:vision', 'experiences'] },
];

/** Compare sans accents ni casse : « Épreuve » trouve « epreuve ». */
const fold = (value) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/*
  Le terme doit figurer comme MOT, pas comme suite de lettres : « grain » ne
  doit pas être trouvé dans « engrainer ». Les bords sont testés à la main
  plutôt qu'avec `\b`, qui ne connaît pas les lettres accentuées.
*/
const mentions = (haystack, term) => {
  const text = fold(haystack);
  const needle = fold(term);
  if (!needle) return false;

  let from = 0;
  for (;;) {
    const at = text.indexOf(needle, from);
    if (at === -1) return false;

    const before = text[at - 1] ?? ' ';
    const after = text[at + needle.length] ?? ' ';
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;

    from = at + 1;
  }
};

const key = (prefix, index) => `${prefix}-${index}-${Math.random().toString(36).slice(2, 8)}`;

const contactPages = await client.fetch(
  `*[_type == "contactPage" && !(_id in path("drafts.**"))]{ _id, language }`,
);

if (contactPages.length === 0) {
  console.error('Aucune page Contact dans le dataset. Créez-la dans le Studio avant d’amorcer son index.');
  process.exit(1);
}

for (const page of contactPages) {
  const language = page.language ?? 'fr';
  const draftId = `drafts.${page._id}`;

  const existing = await client.fetch(
    `*[_id in [$draftId, $publishedId]][0]{ "count": count(index) }`,
    { draftId, publishedId: page._id },
  );

  if (existing?.count > 0 && !replace) {
    console.info(`[${language}] Index déjà saisi (${existing.count} entrées) — ignoré. Utilisez --replace pour le remplacer.`);
    continue;
  }

  /*
    Les œuvres candidates : projets et articles de la même langue. `coalesce`
    partout — un dataset en cours de remplissage a des champs vides, et un
    chapô manquant ne doit pas faire échouer l'amorçage.
  */
  const works = await client.fetch(
    `*[_type in ["project", "post"] && coalesce(language, $language) == $language && defined(slug.current)]{
      _id,
      _type,
      title,
      "haystack": coalesce(title, "") + " " + coalesce(excerpt, "") + " " + coalesce(headline, ""),
      "year": coalesce(year, string::split(coalesce(publishedAt, ""), "-")[0])
    }`,
    { language },
  );

  const entries = NOTIONS.map((notion, index) => {
    const cited = works
      .filter((work) => mentions(work.haystack, notion.term))
      // Une entrée d'index ne cite pas quinze titres : elle en cite quelques-uns.
      .slice(0, 4)
      .map((work, workIndex) => ({
        _key: key('work', `${index}-${workIndex}`),
        _type: 'indexWork',
        reference: { _type: 'reference', _ref: work._id },
        ...(work.year ? { year: String(work.year) } : {}),
      }));

    return {
      _key: key('entry', index),
      _type: 'indexEntry',
      term: notion.term,
      category: notion.category,
      definition: notion.definition,
      sections: notion.sections,
      ...(cited.length > 0 ? { works: cited } : {}),
    };
  });

  const draft = await client.fetch(`*[_id == $draftId][0]`, { draftId });
  const published = await client.fetch(`*[_id == $publishedId][0]`, { publishedId: page._id });

  await client.createOrReplace({
    ...(draft ?? published),
    _id: draftId,
    _type: 'contactPage',
    index: entries,
  });

  const citations = entries.reduce((total, entry) => total + (entry.works?.length ?? 0), 0);
  console.info(
    `[${language}] Brouillon amorcé : ${entries.length} entrées, ${citations} œuvres citées. ` +
      'À relire et publier depuis le Studio.',
  );
}

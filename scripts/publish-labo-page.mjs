/**
 * Report du contenu de la page Labo dans Sanity.
 *
 *   npm run labo:publish                          → aperçu, n'écrit rien
 *   npm run labo:publish -- --apply               → applique le patch
 *   npm run labo:publish -- --apply --purge-only  → efface les seuls champs
 *                                                   sortis du modèle
 *
 * POURQUOI CE SCRIPT
 *
 * La page Labo est éditable depuis le Studio : son contenu vit dans Sanity, pas
 * dans le dépôt. Deux évolutions du modèle ne peuvent pourtant pas être faites
 * à la main sans erreur — chaque paragraphe du manifeste porte désormais sa
 * largeur de composition, et chaque étape porte la liste des prestations
 * qu'elle couvre. Ce script pose la version de référence du dépôt
 * (`src/content/laboFallback.ts`) sur le document publié.
 *
 * CE QU'IL NE TOUCHE PAS
 *
 * Seuls les champs rendus par `fieldsFor()` sont écrits, et ceux listés dans
 * `RETIRED` effacés. Le reste du document — « Pourquoi un laboratoire », les
 * principes, le manifeste de conclusion, le SEO — est laissé tel quel, y
 * compris s'il a été retouché depuis le Studio.
 *
 * Sans `--apply`, le script se contente d'afficher, champ par champ, ce qui
 * changerait. Rien n'est écrit tant que l'option n'est pas passée.
 */
import { createClient } from '@sanity/client';

import { getLaboFallback } from '../src/content/laboFallback.ts';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2025-02-19';
const token = process.env.SANITY_API_WRITE_TOKEN;
const language = process.env.LABO_LANGUAGE || 'fr';
const apply = process.argv.includes('--apply');
/*
  Retirer un champ du modèle et republier le contenu de référence sont deux
  gestes distincts. Cette option ne garde que le premier : le document perd les
  champs de `RETIRED`, et tout ce qui a été écrit depuis le Studio reste intact.
*/
const purgeOnly = process.argv.includes('--purge-only');

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

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const content = getLaboFallback(language);

/*
  Les membres d'un tableau Sanity ont besoin d'un `_key` stable et d'un `_type`
  explicite : ce sont eux qui permettent au Studio de suivre un élément d'une
  révision à l'autre plutôt que de le recréer. Les clés viennent du contenu de
  référence — deux exécutions produisent donc le même document.
*/
const philosophy = content.philosophy.map((paragraph, index) => ({
  _key: typeof paragraph === 'string' ? `philosophy-${index}` : paragraph._key,
  _type: 'laboParagraph',
  text: typeof paragraph === 'string' ? paragraph : paragraph.text,
}));

const services = content.services.map((service) => ({
  _key: service._key,
  _type: 'laboService',
  title: service.title,
  description: service.description,
  tools: service.tools ?? [],
}));

/*
  Les cinq strates de la méthode. Même contrainte que les autres tableaux : une
  clé stable et un `_type` explicite, sans quoi le Studio recrée les membres à
  chaque report au lieu de les suivre.

  LE SPÉCIMEN N'EST PAS REPORTÉ. C'est une image téléversée dans Sanity, elle
  n'a pas d'équivalent dans le dépôt — et réécrire la strate sans lui
  l'effacerait à chaque passage. On reprend donc celui qui est déjà en place,
  document par document : le brouillon et le publié peuvent porter des images
  différentes, c'est même le propre d'un travail en cours.
*/
const methodFor = (document) =>
  content.method.map((strate) => {
    const existing = (document.method ?? []).find((item) => item?._key === strate._key);

    return {
      _key: strate._key,
      _type: 'laboStrate',
      word: strate.word,
      note: strate.note,
      ...(existing?.image ? { image: existing.image } : {}),
    };
  });

const fieldsFor = (document) => ({
  eyebrow: content.eyebrow,
  philosophy,
  servicesTitle: content.servicesTitle,
  services,
  teamTitle: content.teamTitle,
  teamLead: content.teamLead,
  teamBody: content.teamBody,
  foundationTitle: content.foundationTitle,
  foundationParagraphs: content.foundationParagraphs,
  foundationSignature: content.foundationSignature,
  methodTitle: content.methodTitle,
  method: methodFor(document),
});

/*
  Champs SORTIS DU MODÈLE. Retirer un champ du schéma le fait disparaître du
  Studio et des requêtes, mais sa valeur reste écrite dans le document : une
  donnée que plus rien n'affiche ni ne peut modifier. On l'efface franchement,
  plutôt que de la laisser dormir dans le dataset.

  Un champ n'entre ici qu'une fois retiré de `sanity/schemaTypes` — sinon le
  script effacerait à chaque passage un contenu que le Studio propose encore.
*/
const RETIRED = [
  // Note en marge de la section Services, supprimée du modèle.
  'note',
  // Photographie du feuillet : la note de fondation est devenue une note de
  // bas de page, qui ne porte pas de planche.
  'foundationImage',
  /*
    Largeur de composition des paragraphes du manifeste. Un chemin `[]` vise
    CHAQUE membre du tableau — c'est la notation de Sanity, et la seule façon
    de retirer un champ d'un objet répété sans réécrire le tableau entier.
  */
  'philosophy[].layout',
];

/*
  Chemins RÉELLEMENT à effacer dans un document donné, développés depuis un
  chemin de `RETIRED`. Un seul niveau de `[]` est géré : c'est tout ce que
  `RETIRED` demande.

  Le développement membre par membre n'est pas une précaution de style. Un
  `unset(['philosophy[].layout'])` est accepté par l'API — la transaction passe,
  aucune erreur — et ne retire RIEN : le caractère générique ne s'applique pas
  à `unset`. Seule la forme `philosophy[_key=="…"].layout` mord, et c'est
  pourquoi chaque membre est visé par sa clé.
*/
const expand = (document, path) => {
  const [head, tail] = path.split('[].');
  if (tail === undefined) return document[head] === undefined ? [] : [path];

  const array = document[head];
  if (!Array.isArray(array)) return [];

  return array
    .filter((item) => item?.[tail] !== undefined && item?._key)
    .map((item) => `${head}[_key=="${item._key}"].${tail}`);
};

const documentId = `laboPage-${language}`;

/*
  Le brouillon porte sa propre copie du document, et c'est LUI que le Studio
  publiera la prochaine fois. Écrire ou effacer sur le seul document publié
  laisserait donc l'ancien état revenir dès la publication suivante — et
  l'aperçu du site, qui lit les brouillons, continuerait d'afficher l'ancien
  contenu en attendant. Les deux documents reçoivent le même traitement.
*/
const documentIds = [documentId, `drafts.${documentId}`];
const documents = new Map(
  (await Promise.all(documentIds.map((id) => client.getDocument(id))))
    .map((document, index) => [documentIds[index], document])
    .filter(([, document]) => document),
);
const existing = documents.get(documentId);

if (!existing) {
  ko(`Document « ${documentId} » introuvable dans le dataset « ${dataset} ».`);
  process.exit(1);
}

// Un champ n'est effacé que là où il existe : un `unset` à vide est inutile.
const retiredByDocument = new Map(
  [...documents].map(([id, document]) => [
    id,
    RETIRED.flatMap((path) => expand(document, path)),
  ]),
);
const retiredCount = [...retiredByDocument.values()].reduce((total, fields) => total + fields.length, 0);

/*
  Comparaison INSENSIBLE À L'ORDRE DES CLÉS. Sanity renvoie les objets d'un
  tableau avec ses propres clés dans son propre ordre (`_key`, `_type`, puis le
  reste par ordre alphabétique) ; le contenu de référence, lui, les écrit dans
  l'ordre de lecture. Comparer les deux sérialisations telles quelles déclarait
  « Services » modifié à chaque passage, alors que pas un signe ne changeait —
  et le script ne pouvait jamais dire qu'il n'avait rien à faire.
*/
const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
};
const same = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

// Chaque document a son propre écart : le brouillon peut être en retard sur le
// publié, ou l'inverse.
const changedByDocument = new Map(
  [...documents].map(([id, document]) => [
    id,
    purgeOnly
      ? []
      : Object.entries(fieldsFor(document)).filter(([field, value]) => !same(document[field], value)),
  ]),
);
const changedCount = [...changedByDocument.values()].reduce((total, fields) => total + fields.length, 0);

if (changedCount === 0 && retiredCount === 0) {
  skip(`« ${documentId} » est déjà à jour.`);
  process.exit(0);
}

console.log(`\nDataset : ${dataset}\n`);
for (const [id, fields] of changedByDocument) {
  if (fields.length === 0) continue;
  const document = documents.get(id);
  console.log(`  ${id}`);
  for (const [field, value] of fields) {
    const before = Array.isArray(document[field])
      ? `${document[field].length} élément(s)`
      : (document[field] ?? '—');
    const after = Array.isArray(value) ? `${value.length} élément(s)` : value;
    console.log(`    ${field}`);
    console.log(`      avant : ${String(before).slice(0, 100)}`);
    console.log(`      après : ${String(after).slice(0, 100)}`);
  }
  console.log('');
}

for (const [id, paths] of retiredByDocument) {
  if (paths.length === 0) continue;
  console.log(`  ${id}`);
  for (const path of paths) console.log(`    ${path}  → effacé`);
  console.log('');
}

if (!apply) {
  skip(
    `${changedCount} champ(s) à écrire, ${retiredCount} à effacer. ` +
      'Relancez avec « -- --apply » pour appliquer.',
  );
  process.exit(0);
}

/*
  Une seule transaction : le document ne peut pas se retrouver avec le contenu
  de référence écrit mais l'ancien champ encore là, ou l'inverse.
*/
const transaction = client.transaction();
for (const [id, fields] of changedByDocument) {
  if (fields.length > 0) transaction.patch(id, (patch) => patch.set(Object.fromEntries(fields)));
}
for (const [id, paths] of retiredByDocument) {
  if (paths.length > 0) transaction.patch(id, (patch) => patch.unset(paths));
}
await transaction.commit();
const touched = new Set([
  ...[...changedByDocument].filter(([, fields]) => fields.length > 0).map(([id]) => id),
  ...[...retiredByDocument].filter(([, paths]) => paths.length > 0).map(([id]) => id),
]);
ok(`${changedCount} champ(s) écrits, ${retiredCount} effacé(s) sur ${touched.size} document(s).`);

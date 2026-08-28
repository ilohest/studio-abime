/**
 * Report du contenu de la page Labo dans Sanity.
 *
 *   npm run labo:publish            → aperçu, n'écrit rien
 *   npm run labo:publish -- --apply → applique le patch
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
 * Seuls les champs listés dans `FIELDS` sont écrits. Le reste du document —
 * « Pourquoi un laboratoire », les principes, le manifeste de conclusion, le
 * SEO — est laissé tel quel, y compris s'il a été retouché depuis le Studio.
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
  layout: typeof paragraph === 'string' ? 'colonne' : (paragraph.layout ?? 'colonne'),
}));

const services = content.services.map((service) => ({
  _key: service._key,
  _type: 'laboService',
  title: service.title,
  description: service.description,
  tools: service.tools ?? [],
}));

const FIELDS = {
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
};

const documentId = `laboPage-${language}`;
const existing = await client.getDocument(documentId);

if (!existing) {
  ko(`Document « ${documentId} » introuvable dans le dataset « ${dataset} ».`);
  process.exit(1);
}

const changed = Object.entries(FIELDS).filter(
  ([field, value]) => JSON.stringify(existing[field]) !== JSON.stringify(value),
);

if (changed.length === 0) {
  skip(`« ${documentId} » est déjà à jour.`);
  process.exit(0);
}

console.log(`\nDocument : ${documentId}  ·  dataset : ${dataset}\n`);
for (const [field, value] of changed) {
  const before = Array.isArray(existing[field])
    ? `${existing[field].length} élément(s)`
    : (existing[field] ?? '—');
  const after = Array.isArray(value) ? `${value.length} élément(s)` : value;
  console.log(`  ${field}`);
  console.log(`    avant : ${String(before).slice(0, 110)}`);
  console.log(`    après : ${String(after).slice(0, 110)}\n`);
}

if (!apply) {
  skip(`${changed.length} champ(s) à écrire. Relancez avec « -- --apply » pour appliquer.`);
  process.exit(0);
}

await client.patch(documentId).set(FIELDS).commit();
ok(`${changed.length} champ(s) écrits sur « ${documentId} ».`);

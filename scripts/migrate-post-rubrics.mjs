/**
 * Migration : la rubrique unique d'un article devient une liste de rubriques.
 *
 *   npm run posts:rubrics -- --dry-run   montre ce qui serait écrit
 *   npm run posts:rubrics                écrit
 *
 * ── Ce qui change ───────────────────────────────────────────────────────────
 * Le Journal avait deux rubriques et un article n'en portait qu'une, dans un
 * champ `category`. La Bibliothèque en a cinq, et un article peut appartenir à
 * plusieurs — le champ devient `rubrics`, un tableau.
 *
 * ── La correspondance ───────────────────────────────────────────────────────
 *   cahier-de-recherche → essais    (les articles de fond, les questions ouvertes)
 *   actualites          → journal   (les brèves du studio et du dehors)
 *
 * Elle n'est pas évidente et c'est normal : les anciennes rubriques n'étaient
 * pas des sous-ensembles des nouvelles. Le classement final relève de la
 * lectrice — ce script ne fait que placer chaque article quelque part de
 * défendable, à corriger depuis le Studio.
 *
 * ── Prudence ────────────────────────────────────────────────────────────────
 * Un article qui porte DÉJÀ des rubriques n'est pas touché : le script est
 * rejouable sans écraser un classement fait à la main. `category` est retiré
 * dans le même patch, sinon la requête continuerait de le replier et une
 * correction faite dans le Studio serait masquée par l'ancienne valeur.
 *
 * Brouillons compris : un article en cours d'écriture doit survivre à la
 * migration comme les autres.
 *
 * Variables d'environnement (fichier `.env`) :
 *   PUBLIC_SANITY_PROJECT_ID
 *   PUBLIC_SANITY_DATASET        (défaut : production)
 *   SANITY_API_WRITE_TOKEN       (sanity.io/manage → API → Tokens, rôle « Editor »)
 */
import { createClient } from '@sanity/client';

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2025-02-19';
const token = process.env.SANITY_API_WRITE_TOKEN;

const dryRun = process.argv.includes('--dry-run');

if (!projectId || (!token && !dryRun)) {
  console.error(
    '\nIl manque de quoi écrire dans Sanity.\n\n' +
      '    PUBLIC_SANITY_PROJECT_ID\n' +
      '    SANITY_API_WRITE_TOKEN   (sanity.io/manage → API → Tokens, rôle « Editor »)\n',
  );
  process.exit(1);
}

/** Ancienne rubrique → nouvelle. Toute valeur inconnue retombe sur le Journal. */
const MAPPING = {
  'cahier-de-recherche': 'essais',
  actualites: 'journal',
};

const FALLBACK = 'journal';

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const posts = await client.fetch(
  '*[_type == "post"]{ _id, title, category, rubrics }',
);

if (posts.length === 0) {
  console.info('Aucun article : rien à migrer.');
  process.exit(0);
}

const patches = [];

for (const post of posts) {
  if (Array.isArray(post.rubrics) && post.rubrics.length > 0) {
    console.info(`· ${post.title ?? post._id} — déjà classé (${post.rubrics.join(', ')}), ignoré.`);
    continue;
  }

  const rubric = MAPPING[post.category] ?? FALLBACK;
  patches.push({ id: post._id, title: post.title ?? post._id, from: post.category, rubric });
}

if (patches.length === 0) {
  console.info('\nTous les articles sont déjà classés.');
  process.exit(0);
}

for (const patch of patches) {
  console.info(`→ ${patch.title} : ${patch.from ?? '(aucune)'} → ${patch.rubric}`);
}

if (dryRun) {
  console.info(`\n[--dry-run] ${patches.length} article(s) auraient été migrés. Rien n'a été écrit.`);
  process.exit(0);
}

// Une seule transaction : la migration passe en entier, ou pas du tout.
const transaction = patches.reduce(
  (tx, patch) => tx.patch(patch.id, (p) => p.set({ rubrics: [patch.rubric] }).unset(['category'])),
  client.transaction(),
);

await transaction.commit();
console.info(`\n${patches.length} article(s) migré(s).`);

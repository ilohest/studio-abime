/**
 * Migration : retire les anciens champs d'article devenus sans interface.
 *
 *   npm run posts:cleanup -- --dry-run   montre ce qui serait écrit
 *   npm run posts:cleanup                migre puis retire les anciens champs
 *
 * L'ancienne `excerpt` devient `seo.description` lorsque cette dernière est
 * vide. L'ancien `body` devient un bloc `journalProse` seulement si la nouvelle
 * composition est encore vide. `listingFacts` n'a plus de destination : la
 * grille actuelle ne présente plus de fiche botanique. `category`, déjà migré
 * vers `rubrics`, est également retiré s'il subsiste dans un brouillon. Le
 * champ `template` disparaît puisque tous les articles emploient désormais la
 * composition « Planche illustrée ».
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

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
const posts = await client.fetch(/* groq */ `
  *[_type == "post" && (
    defined(excerpt) || defined(listingFacts) || defined(body) || defined(category) || defined(template)
  )]{
    _id,
    title,
    excerpt,
    listingFacts,
    body,
    blocks,
    category,
    rubrics,
    template,
    seo
  }
`);

if (posts.length === 0) {
  console.info('Aucun ancien champ d’article : rien à migrer.');
  process.exit(0);
}

const categoryToRubric = {
  'cahier-de-recherche': 'essais',
  actualites: 'journal',
};

for (const post of posts) {
  const actions = [];
  if (post.excerpt?.trim() && !post.seo?.description?.trim()) actions.push('accroche → SEO');
  if (post.body?.length && !post.blocks?.length) actions.push('ancien corps → composition');
  if (post.listingFacts?.length) actions.push(`${post.listingFacts.length} ligne(s) de carte retirée(s)`);
  if (post.category) actions.push('ancienne rubrique retirée');
  if (post.template) actions.push('ancien choix de modèle retiré');
  console.info(`→ ${post.title ?? post._id} : ${actions.join(', ') || 'anciens champs retirés'}`);
}

if (dryRun) {
  console.info(`\n[--dry-run] ${posts.length} article(s) seraient nettoyés. Rien n’a été écrit.`);
  process.exit(0);
}

const transaction = posts.reduce((tx, post) => {
  return tx.patch(post._id, (patch) => {
    let next = patch;

    if (post.excerpt?.trim() && !post.seo?.description?.trim()) {
      next = next
        .setIfMissing({ seo: { _type: 'seo' } })
        .set({ 'seo.description': post.excerpt.trim() });
    }

    if (post.body?.length && !post.blocks?.length) {
      next = next.set({
        blocks: [{ _key: 'migrated-legacy-body', _type: 'journalProse', body: post.body }],
      });
    }

    if ((!post.rubrics || post.rubrics.length === 0) && post.category) {
      next = next.set({ rubrics: [categoryToRubric[post.category] ?? 'journal'] });
    }

    return next.unset(['excerpt', 'listingFacts', 'body', 'category', 'template']);
  });
}, client.transaction());

await transaction.commit();
console.info(`\n${posts.length} article(s) nettoyé(s).`);

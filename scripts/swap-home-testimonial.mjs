/**
 * Remplace l'image de pied de page d'accueil par la section Témoignage.
 *
 *   npm run home:testimonial            → aperçu, n'écrit rien
 *   npm run home:testimonial -- --apply → applique
 *
 * POURQUOI UN SCRIPT
 *
 * La composition de la page d'accueil est VERROUILLÉE dans le Studio : ni
 * ajout, ni suppression, ni réordonnancement (voir `definePageBuilder`, option
 * `locked`). C'est délibéré — l'enchaînement des blocs porte la direction
 * artistique. Le corollaire est qu'on ne peut pas échanger un bloc depuis le
 * back-office : ce geste passe par ici.
 *
 * CE QU'IL FAIT, ET RIEN D'AUTRE
 *
 * Il remplace, DANS le tableau `sections`, le bloc `fullBleedImage` par un
 * bloc `testimonials` à la même place. Les autres blocs ne sont pas touchés,
 * et leur ordre est conservé.
 *
 * Relancé, il ne fait rien : si la section Témoignage est déjà là, il passe
 * son tour. Il n'écrase donc jamais des témoignages saisis depuis le Studio.
 *
 * LE BROUILLON AUSSI
 *
 * Le brouillon porte sa copie du document. Ne traiter que le publié laisserait
 * l'ancienne image revenir à la prochaine publication depuis le Studio.
 */
import { createClient } from '@sanity/client';

const apply = process.argv.includes('--apply');

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION || '2025-02-19';
const token = process.env.SANITY_API_WRITE_TOKEN;

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

/*
  Le bloc posé. La clé est FIXE et lisible : deux exécutions produiraient le
  même document, et le bloc se retrouve dans l'historique du Studio sous un nom
  qui dit ce qu'il est.

  Un témoignage d'amorçage, coché, pour que la section ne soit pas vide à
  l'arrivée — l'éditrice le remplace par un vrai depuis le Studio.
*/
const TESTIMONIAL_SECTION = {
  _key: 'temoignage',
  _type: 'testimonials',
  label: 'Témoignage',
  entries: [
    {
      _key: 'amorce',
      _type: 'testimonial',
      quote:
        'À remplacer par un vrai témoignage. Le texte se répartit tout seul sur deux colonnes : il n’y a rien à couper à la main. Pour en publier un autre, ajoutez-le à la suite et cochez « Afficher celui-ci » — celui d’avant reste en réserve, il n’a pas à être supprimé.',
      author: 'Signature',
      role: 'Fonction, structure',
      active: true,
    },
  ],
};

/* Le bloc remplacé. Nommé ici plutôt qu'en dur plus bas : c'est le sujet. */
const REPLACED_TYPE = 'fullBleedImage';

const pages = await client.fetch(
  `*[_type == "page" && count(sections[_type == $type]) > 0]{ _id, language, sections }`,
  { type: REPLACED_TYPE },
);

const drafts = await client.fetch(
  `*[_id in path("drafts.**") && _type == "page" && count(sections[_type == $type]) > 0]{ _id, language, sections }`,
  { type: REPLACED_TYPE },
);

const documents = [...pages, ...drafts];

if (documents.length === 0) {
  skip(`Aucune page ne porte de bloc « ${REPLACED_TYPE} » : rien à remplacer.`);
  process.exit(0);
}

console.log(`\nDataset : ${dataset}\n`);

const patches = [];

for (const page of documents) {
  const sections = page.sections ?? [];
  const at = sections.findIndex((section) => section._type === REPLACED_TYPE);

  if (sections.some((section) => section._type === 'testimonials')) {
    skip(`${page._id} — la section Témoignage est déjà posée.`);
    continue;
  }

  const next = [...sections];
  next.splice(at, 1, TESTIMONIAL_SECTION);

  console.log(`  ${page._id}  (${page.language ?? '—'})`);
  console.log(`    position ${at + 1} sur ${sections.length}`);
  console.log(`    avant : ${sections.map((s) => s._type).join(' · ')}`);
  console.log(`    après : ${next.map((s) => s._type).join(' · ')}\n`);

  patches.push({ id: page._id, sections: next });
}

if (patches.length === 0) process.exit(0);

if (!apply) {
  skip(`${patches.length} document(s) à modifier. Relancez avec « -- --apply » pour appliquer.`);
  process.exit(0);
}

/* Une seule transaction : publié et brouillon ne peuvent pas diverger. */
const transaction = client.transaction();
for (const patch of patches) {
  transaction.patch(patch.id, (p) => p.set({ sections: patch.sections }));
}
await transaction.commit();

ok(`${patches.length} document(s) modifié(s).`);

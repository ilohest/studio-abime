import { defineField, defineType } from 'sanity';

/**
 * Métadonnées de référencement.
 *
 * Tous les champs sont optionnels : le rendu retombe sur le titre du document
 * et sur les réglages du site. On ne force donc jamais l'éditeur à dupliquer
 * une information déjà présente.
 *
 * PAS DE CASE « NE PAS INDEXER » ICI. Il y en avait une, masquée, et les
 * requêtes projetaient `false` par-dessus : elle ne pouvait donc rien fermer,
 * et un jour quelqu'un l'aurait dé-masquée en la croyant branchée. Ce qui
 * ferme réellement l'indexation vit en code, là où c'est vérifiable —
 * l'environnement de déploiement et le mode maintenance dans
 * `src/lib/seo/indexing.ts`, la décision de la page (404, confirmation de
 * commande) dans la route elle-même.
 */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  // Le champ vit déjà dans un onglet « SEO » : un accordéon en plus obligerait
  // à deux clics pour atteindre les métadonnées. On affiche les champs directement.
  fields: [
    defineField({
      name: 'title',
      title: 'Titre (balise <title>)',
      type: 'string',
      description: 'Idéalement 50–60 caractères. Vide = titre du document.',
      validation: (rule) => rule.max(70).warning('Au-delà de 70 caractères, Google tronque le titre.'),
    }),
    defineField({
      name: 'description',
      title: 'Méta description',
      type: 'text',
      rows: 3,
      description: 'Idéalement 120–160 caractères.',
      validation: (rule) => rule.max(180).warning('Au-delà de 180 caractères, la description est tronquée.'),
    }),
    defineField({
      name: 'image',
      title: 'Image sociale (Open Graph)',
      type: 'image',
      description: 'Affichée sur les réseaux sociaux. Format recommandé : 1200 × 630 px.',
      options: { hotspot: true },
      hidden: ({ document }) => document?._type === 'project',
    }),
  ],
});

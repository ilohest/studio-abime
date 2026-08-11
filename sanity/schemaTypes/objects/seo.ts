import { defineField, defineType } from 'sanity';

/**
 * Métadonnées de référencement.
 *
 * Tous les champs sont optionnels : le rendu retombe sur le titre du document
 * et sur les réglages du site. On ne force donc jamais l'éditeur à dupliquer
 * une information déjà présente.
 */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
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
    defineField({
      name: 'noIndex',
      title: 'Exclure des moteurs de recherche',
      type: 'boolean',
      initialValue: false,
      hidden: true,
    }),
  ],
});

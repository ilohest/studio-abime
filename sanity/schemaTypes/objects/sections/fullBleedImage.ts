import { defineField, defineType } from 'sanity';

/**
 * Image pleine largeur — un visuel seul, d'un bord à l'autre de la page.
 *
 * Distinct de la « Galerie » : celle-ci compose plusieurs visuels dans une
 * grille recadrée, alors qu'ici l'image garde son format d'origine et occupe
 * toute la largeur disponible.
 */
export const fullBleedImage = defineType({
  name: 'fullBleedImage',
  title: 'Image pleine largeur',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Visuel',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texte alternatif',
          type: 'string',
          description: 'Laisser vide si le visuel est purement décoratif.',
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { media: 'image', alt: 'image.alt' },
    prepare: ({ media, alt }) => ({
      title: 'Image pleine largeur',
      subtitle: alt,
      media,
    }),
  },
});

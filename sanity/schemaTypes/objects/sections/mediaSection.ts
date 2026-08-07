import { defineArrayMember, defineField, defineType } from 'sanity';

export const mediaSection = defineType({
  name: 'mediaSection',
  title: 'Galerie',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Visuels',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texte alternatif',
              type: 'string',
              validation: (rule) => rule.required().warning('Requis pour l’accessibilité.'),
            }),
            defineField({ name: 'caption', title: 'Légende', type: 'string' }),
          ],
        }),
      ],
      options: { layout: 'grid' },
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'columns',
      title: 'Colonnes',
      type: 'number',
      initialValue: 2,
      options: {
        list: [
          { value: 1, title: '1' },
          { value: 2, title: '2' },
          { value: 3, title: '3' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'ratio',
      title: 'Format',
      type: 'string',
      initialValue: 'landscape',
      options: {
        list: [
          { value: 'square', title: 'Carré (1:1)' },
          { value: 'portrait', title: 'Portrait (3:4)' },
          { value: 'landscape', title: 'Paysage (16:9)' },
          { value: 'cinema', title: 'Cinémascope (21:9)' },
        ],
      },
    }),
  ],
  preview: {
    select: { items: 'items', columns: 'columns' },
    prepare: ({ items, columns }) => ({
      title: `Galerie — ${items?.length ?? 0} visuel(s)`,
      subtitle: `${columns ?? 2} colonne(s)`,
      media: items?.[0],
    }),
  },
});

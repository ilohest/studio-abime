import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Planche — une double page d'herbier, sur laquelle viennent se poser des
 * figures.
 *
 * Le fond porte la page imprimée ; les figures sont superposées par-dessus,
 * réparties de part et d'autre du pli. Le fond est volontairement effacé au
 * rendu : il fait office de trame, pas d'image principale.
 */
export const plateSpread = defineType({
  name: 'plateSpread',
  title: 'Planche',
  type: 'object',
  fields: [
    defineField({
      name: 'background',
      title: 'Fond',
      type: 'image',
      options: { hotspot: true },
      description: 'Double page imprimée. Vide = planche livrée avec le site.',
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    defineField({
      name: 'figures',
      title: 'Figures',
      type: 'array',
      description: 'Posées sur le fond, de part et d’autre du pli. Deux figures dans la mise en page d’origine.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Visuel',
              type: 'image',
              options: { hotspot: true },
              fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'number', title: 'Numéro', type: 'string', description: 'Ex. « fig.01 ».' }),
            defineField({ name: 'caption', title: 'Légende', type: 'string' }),
          ],
          preview: {
            select: { number: 'number', caption: 'caption', media: 'image' },
            prepare: ({ number, caption, media }) => ({
              title: [number, caption].filter(Boolean).join(' — ') || 'Figure',
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { figures: 'figures', media: 'background' },
    prepare: ({ figures, media }) => ({
      title: 'Planche',
      subtitle: `${figures?.length ?? 0} figure(s)`,
      media,
    }),
  },
});

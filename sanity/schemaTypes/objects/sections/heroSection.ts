import { defineField, defineType } from 'sanity';

export const heroSection = defineType({
  name: 'heroSection',
  title: 'En-tête (hero)',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Titre',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'subheading', title: 'Sous-titre', type: 'text', rows: 2 }),
    defineField({
      name: 'media',
      title: 'Visuel',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    defineField({
      name: 'layout',
      title: 'Mise en page',
      type: 'string',
      initialValue: 'centered',
      options: {
        list: [
          { value: 'centered', title: 'Centré' },
          { value: 'split', title: 'Deux colonnes' },
          { value: 'fullBleed', title: 'Pleine page' },
        ],
        layout: 'radio',
      },
    }),
    defineField({ name: 'cta', title: 'Bouton', type: 'link' }),
  ],
  preview: {
    select: { title: 'heading', subtitle: 'layout', media: 'media' },
    prepare: ({ title, subtitle, media }) => ({
      title: title || 'En-tête',
      subtitle: `En-tête · ${subtitle ?? 'centré'}`,
      media,
    }),
  },
});

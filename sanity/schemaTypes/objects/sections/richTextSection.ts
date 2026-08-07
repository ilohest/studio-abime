import { defineField, defineType } from 'sanity';

export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Bloc de texte',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Surtitre',
      type: 'string',
      description: 'Court label affiché au-dessus du titre (style Sous-titre).',
    }),
    defineField({ name: 'heading', title: 'Titre', type: 'string' }),
    defineField({
      name: 'body',
      title: 'Contenu',
      type: 'richText',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'width',
      title: 'Largeur',
      type: 'string',
      initialValue: 'default',
      options: {
        list: [
          { value: 'narrow', title: 'Étroite (lecture)' },
          { value: 'default', title: 'Standard' },
          { value: 'wide', title: 'Large' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: { heading: 'heading', eyebrow: 'eyebrow' },
    prepare: ({ heading, eyebrow }) => ({
      title: heading || eyebrow || 'Bloc de texte',
      subtitle: 'Texte',
    }),
  },
});

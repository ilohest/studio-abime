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
  ],
  preview: {
    select: { heading: 'heading', eyebrow: 'eyebrow' },
    prepare: ({ heading, eyebrow }) => ({
      title: heading || eyebrow || 'Bloc de texte',
      subtitle: 'Texte',
    }),
  },
});

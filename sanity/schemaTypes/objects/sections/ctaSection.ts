import { defineField, defineType } from 'sanity';

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Appel à action',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Titre',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'body', title: 'Texte', type: 'text', rows: 3 }),
    defineField({ name: 'cta', title: 'Bouton', type: 'link' }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Appel à action', subtitle: 'Appel à action' }),
  },
});

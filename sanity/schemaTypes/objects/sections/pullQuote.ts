import { defineField, defineType } from 'sanity';

/**
 * Citation manifeste — une prise de parole isolée, centrée, sur fond papier.
 *
 * Volontairement distincte du « Manifeste illustré » : celui-ci articule un
 * texte, une note et une planche de figures ; ici le texte est seul et c'est
 * le blanc autour de lui qui porte le propos.
 */
export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Citation manifeste',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Texte',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'measure',
      title: 'Largeur de composition',
      type: 'string',
      initialValue: 'narrow',
      description: 'Détermine la longueur des lignes, donc la densité du bloc.',
      options: {
        list: [
          { value: 'narrow', title: 'Étroite' },
          { value: 'default', title: 'Standard' },
          { value: 'wide', title: 'Large' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'fullHeight',
      title: 'Occuper toute la hauteur de l’écran',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare: ({ text }) => ({
      title: 'Citation manifeste',
      subtitle: text?.slice(0, 70),
    }),
  },
});

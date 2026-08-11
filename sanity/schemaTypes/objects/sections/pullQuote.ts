import { defineField, defineType } from 'sanity';

/**
 * Citation manifeste — une prise de parole isolée, centrée, sur fond papier.
 *
 * Volontairement distincte du « Manifeste illustré » : celui-ci articule un
 * texte, une note et une planche de figures ; ici le texte est seul et c'est
 * le blanc autour de lui qui porte le propos.
 *
 * La composition — pleine hauteur, lignes au large — appartient à la direction
 * artistique et vit dans le composant : le CMS ne porte que le texte.
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
  ],
  preview: {
    select: { text: 'text' },
    prepare: ({ text }) => ({
      title: 'Citation manifeste',
      subtitle: text?.slice(0, 70),
    }),
  },
});

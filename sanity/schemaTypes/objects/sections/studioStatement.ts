import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Manifeste illustré — déclaration en grand, note de bas de bloc et planche de
 * figures légendées.
 *
 * Les numéros de figure (fig.04, fig.05…) sont saisis à la main et non générés :
 * la numérotation court d'une section à l'autre sur toute la page, une
 * numérotation automatique par section la casserait au premier réagencement.
 */
export const studioStatement = defineType({
  name: 'studioStatement',
  title: 'Manifeste illustré',
  type: 'object',
  groups: [
    { name: 'text', title: 'Textes', default: true },
    { name: 'figures', title: 'Figures' },
  ],
  fields: [
    defineField({
      name: 'statement',
      title: 'Déclaration',
      type: 'text',
      rows: 4,
      group: 'text',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 3,
      group: 'text',
      /*
        Le repère et le texte tiennent dans un seul champ : `figureLabel()` les
        sépare au rendu. La description doit donc dire la CONVENTION, pas
        donner un exemple isolé — « Fig. 04 » seul se lisait comme une étiquette
        du champ, et personne ne devinait qu'il fallait l'écrire dans le texte.
      */
      description:
        'Commencez par le repère, puis la note : « fig.04 — On étudie la communication… ». Le repère est détaché et composé à part. Sans lui, seule la note s’affiche.',
    }),
    defineField({
      name: 'marker',
      title: 'Mention technique',
      type: 'string',
      group: 'text',
      description: 'Courte annotation posée entre les figures.',
    }),
    defineField({
      name: 'figures',
      title: 'Figures',
      type: 'array',
      group: 'figures',
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
            defineField({
              name: 'caption',
              title: 'Légende',
              type: 'string',
              description:
                'Ex. « fig.05 — Compréhension de la constitution ». Le repère de tête est mis en forme automatiquement.',
            }),
            defineField({
              name: 'span',
              title: 'Largeur',
              type: 'number',
              initialValue: 3,
              description: 'Nombre de colonnes occupées, sur une grille de 12.',
              validation: (rule) => rule.min(1).max(12).integer(),
            }),
            defineField({
              name: 'bleed',
              title: 'Débord',
              type: 'string',
              initialValue: 'none',
              options: {
                list: [
                  { value: 'none', title: 'Aucun' },
                  { value: 'left', title: 'Sort par la gauche' },
                  { value: 'right', title: 'Sort par la droite' },
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
            }),
            defineField({
              name: 'pushRight',
              title: 'Repousser à droite',
              type: 'boolean',
              initialValue: false,
              description: 'Occupe l’espace libre restant avant cette figure.',
            }),
          ],
          preview: {
            select: { caption: 'caption', media: 'image' },
            prepare: ({ caption, media }) => ({
              title: caption || 'Figure',
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { statement: 'statement', figures: 'figures' },
    prepare: ({ statement, figures }) => ({
      title: 'Manifeste illustré',
      subtitle: statement?.slice(0, 60),
      media: figures?.[0]?.image,
    }),
  },
});

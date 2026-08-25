import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Blocs de composition d'un article du Journal.
 *
 * Un seul modèle de contenu sert les deux modèles de page : l'éditrice
 * intercale librement textes, figures et notes, et le modèle choisi ne décide
 * que de la MISE EN PAGE (largeur de la colonne, échelle des images).
 * Changer de modèle ne demande donc jamais de ressaisir quoi que ce soit.
 *
 * La numérotation — « Fig. I », « [1] » — est calculée au rendu, dans l'ordre
 * des blocs. Rien à tenir à jour à la main.
 */

export const journalProse = defineType({
  name: 'journalProse',
  title: 'Texte',
  type: 'object',
  fields: [
    defineField({
      name: 'body',
      title: 'Texte',
      type: 'richText',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { body: 'body' },
    prepare: ({ body }) => {
      const first = Array.isArray(body)
        ? body.find((block: { _type?: string }) => block?._type === 'block')
        : null;
      const text = first?.children?.map((child: { text?: string }) => child.text).join('') ?? '';
      return { title: text.slice(0, 70) || 'Texte', subtitle: 'Texte' };
    },
  },
});

export const journalFigure = defineType({
  name: 'journalFigure',
  title: 'Figure',
  type: 'object',
  description: 'Une à trois images côte à côte, avec une légende commune.',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      description: 'Jusqu’à trois images, disposées côte à côte dans l’ordre de la liste.',
      of: [
        defineArrayMember({
          name: 'figureImage',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texte alternatif',
              type: 'string',
              description: "Décrit l'image pour les lecteurs d'écran et le référencement.",
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(1).max(3),
    }),
    defineField({
      name: 'caption',
      title: 'Légende',
      type: 'text',
      rows: 3,
      description: 'Le numéro de figure est ajouté automatiquement devant la légende.',
    }),
    defineField({
      name: 'placement',
      title: 'Emplacement',
      type: 'string',
      initialValue: 'texte',
      options: {
        layout: 'radio',
        list: [
          { value: 'texte', title: 'Dans la colonne de texte' },
          { value: 'marge', title: 'En marge, en tout petit' },
        ],
      },
      description: 'En marge, la figure vient se placer à côté du texte qui la précède.',
    }),
    defineField({
      name: 'scale',
      title: 'Échelle',
      type: 'string',
      initialValue: 'colonne',
      options: {
        layout: 'radio',
        list: [
          { value: 'petite', title: 'Petite — un peu moins de la moitié de la colonne' },
          { value: 'colonne', title: 'Moyenne — les trois quarts de la colonne' },
          { value: 'pleine', title: 'Large — toute la colonne' },
        ],
      },
      hidden: ({ parent }) => parent?.placement === 'marge',
    }),
  ],
  preview: {
    select: { caption: 'caption', media: 'images.0', count: 'images', placement: 'placement' },
    prepare: ({ caption, media, count, placement }) => ({
      title: caption?.slice(0, 70) || 'Figure sans légende',
      subtitle: [
        `${Array.isArray(count) ? count.length : 0} image(s)`,
        placement === 'marge' ? 'en marge' : null,
      ]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
});

export const journalNote = defineType({
  name: 'journalNote',
  title: 'Note de marge',
  type: 'object',
  description: 'Note numérotée, placée en marge du texte qui la précède.',
  fields: [
    defineField({
      name: 'text',
      title: 'Note',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare: ({ text }) => ({ title: text?.slice(0, 70) || 'Note', subtitle: 'Note de marge' }),
  },
});

export const journalBlockTypes = [journalProse, journalFigure, journalNote];

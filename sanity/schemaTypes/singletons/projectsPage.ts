import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/** Contenu éditorial propre à la page qui liste les projets. */
export const projectsPage = defineType({
  name: 'projectsPage',
  title: 'Page Projets',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Titre de la page',
      type: 'string',
      group: 'content',
      initialValue: 'Projets',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Texte d’introduction',
      type: 'text',
      rows: 5,
      group: 'content',
      description: 'Texte affiché au-dessus de la grille des projets.',
    }),
    defineField({
      name: 'editorialCards',
      title: 'Cartes éditoriales',
      type: 'array',
      group: 'content',
      description:
        'Ajoutez une carte vide (avec diagonale) ou une carte contenant une phrase. Elle prend une case et décale les projets suivants sans en masquer aucun.',
      of: [
        defineArrayMember({
          name: 'projectsEditorialCard',
          title: 'Carte éditoriale',
          type: 'object',
          fields: [
            defineField({
              name: 'kind',
              title: 'Type de carte',
              type: 'string',
              initialValue: 'empty',
              options: {
                layout: 'radio',
                list: [
                  { title: 'Carte vide avec diagonale', value: 'empty' },
                  { title: 'Carte avec une phrase', value: 'text' },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'text',
              title: 'Phrase',
              type: 'text',
              rows: 4,
              hidden: ({ parent }) => parent?.kind !== 'text',
              validation: (rule) =>
                rule.custom((value, context) => {
                  const parent = context.parent as { kind?: string } | undefined;
                  return parent?.kind !== 'text' || value?.trim()
                    ? true
                    : 'La phrase est requise pour ce type de carte.';
                }),
            }),
            defineField({
              name: 'position',
              title: 'Position dans la grille',
              type: 'number',
              description:
                '1 = première case en haut à gauche, puis de gauche à droite et ligne après ligne. Laissé vide, la carte est placée en dernier.',
              validation: (rule) => rule.min(1).integer(),
            }),
          ],
          preview: {
            select: { kind: 'kind', text: 'text', position: 'position' },
            prepare: ({ kind, text, position }) => ({
              title: kind === 'text' ? text?.slice(0, 60) || 'Carte avec une phrase' : 'Carte vide',
              subtitle: position ? `Position ${position}` : 'En fin de grille',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      options: { collapsible: false },
    }),
  ],
  preview: {
    select: { language: 'language' },
    prepare: ({ language }) => ({
      title: 'Page Projets',
      subtitle: language?.toUpperCase() ?? '—',
    }),
  },
});

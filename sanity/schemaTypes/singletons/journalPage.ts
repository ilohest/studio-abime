import { defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/** Contenu éditorial propre à l'index du Journal. */
export const journalPage = defineType({
  name: 'journalPage',
  title: 'Page Journal',
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
      initialValue: 'Journal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Texte d’introduction',
      type: 'text',
      rows: 5,
      group: 'content',
      description: 'Texte affiché au-dessus de la grille des articles.',
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
      title: 'Page Journal',
      subtitle: language?.toUpperCase() ?? '—',
    }),
  },
});

import { defineArrayMember, defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../../lib/i18n';

/** Liste de projets — sélection manuelle, ou les N projets les plus récents. */
export const projectListSection = defineType({
  name: 'projectListSection',
  title: 'Liste de projets',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Titre', type: 'string' }),
    defineField({
      name: 'mode',
      title: 'Sélection',
      type: 'string',
      initialValue: 'latest',
      options: {
        list: [
          { value: 'latest', title: 'Projets les plus récents' },
          { value: 'manual', title: 'Sélection manuelle' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'projects',
      title: 'Projets',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'project' }],
          options: { filter: sameLanguageFilter },
        }),
      ],
      hidden: ({ parent }) => parent?.mode !== 'manual',
    }),
    defineField({
      name: 'limit',
      title: 'Nombre de projets',
      type: 'number',
      initialValue: 6,
      validation: (rule) => rule.min(1).max(24),
      hidden: ({ parent }) => parent?.mode !== 'latest',
    }),
  ],
  preview: {
    select: { heading: 'heading', mode: 'mode' },
    prepare: ({ heading, mode }) => ({
      title: heading || 'Liste de projets',
      subtitle: mode === 'manual' ? 'Sélection manuelle' : 'Projets récents',
    }),
  },
});

import { defineArrayMember, defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../../lib/i18n';

/**
 * Liste de projets — c'est cette section qui alimente le composant Vue interactif
 * (`ProjectExplorer.vue`) lorsque les filtres sont activés.
 */
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
    defineField({
      name: 'showFilters',
      title: 'Afficher les filtres par catégorie',
      type: 'boolean',
      initialValue: false,
      description: 'Active le filtrage interactif côté client.',
    }),
  ],
  preview: {
    select: { heading: 'heading', mode: 'mode', showFilters: 'showFilters' },
    prepare: ({ heading, mode, showFilters }) => ({
      title: heading || 'Liste de projets',
      subtitle: [
        mode === 'manual' ? 'Sélection manuelle' : 'Projets récents',
        showFilters ? 'avec filtres' : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});

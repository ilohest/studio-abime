import { defineArrayMember, defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../../lib/i18n';

/**
 * Sélection de projets — planche défilante.
 *
 * Les projets choisis sont posés côte à côte, légèrement de travers, et se
 * parcourent horizontalement : ceux qui dépassent du cadre se découvrent au
 * défilement. Chaque visuel garde son format d'origine — c'est la variété des
 * proportions qui fait la composition.
 *
 * Le visuel affiché est celui mis en avant sur le projet (vignette, à défaut
 * couverture) : le même que dans la page portfolio, sans réglage séparé ici.
 */
export const projectShowcase = defineType({
  name: 'projectShowcase',
  title: 'Sélection de projets',
  type: 'object',
  fields: [
    defineField({
      name: 'projects',
      title: 'Projets',
      type: 'array',
      description: 'L’ordre de la liste est celui de l’affichage.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'project' }],
          options: { filter: sameLanguageFilter },
        }),
      ],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'startNumber',
      title: 'Premier numéro de figure',
      type: 'number',
      initialValue: 1,
      description:
        'La numérotation suit l’ordre des projets. À ajuster si les figures poursuivent une série déjà commencée plus haut dans la page.',
      validation: (rule) => rule.min(1).integer(),
    }),
  ],
  preview: {
    select: { projects: 'projects' },
    prepare: ({ projects }) => ({
      title: 'Sélection de projets',
      subtitle: `${projects?.length ?? 0} projet(s)`,
    }),
  },
});

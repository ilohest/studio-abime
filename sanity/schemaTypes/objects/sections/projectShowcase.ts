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
      title: 'Projets affichés',
      type: 'array',
      description: 'Sélectionner jusqu’à 5 projets. L’ordre de la liste est celui de l’affichage.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'project' }],
          options: { filter: sameLanguageFilter },
        }),
      ],
      /*
        Avertissement et non erreur : une sélection vide n'affiche simplement
        rien. En faire une erreur empêcherait de publier une page d'accueil
        dont la sélection n'est pas encore arrêtée.
      */
      validation: (rule) => [
        rule.min(1).warning('Aucun projet sélectionné : les visuels temporaires seront utilisés.'),
        rule.max(5).error('La page d’accueil peut afficher au maximum 5 projets.'),
        rule.unique().error('Un même projet ne peut être sélectionné qu’une fois.'),
      ],
    }),
    defineField({
      name: 'placeholderItems',
      title: 'Visuels temporaires',
      type: 'array',
      description:
        'Affichés uniquement tant qu’aucun projet réel n’est sélectionné. Ils permettent de préparer la composition de la page d’accueil.',
      hidden: ({ parent }) => (parent?.projects?.length ?? 0) > 0,
      of: [
        defineArrayMember({
          name: 'placeholderItem',
          title: 'Visuel temporaire',
          type: 'object',
          fields: [
            /*
              Avertissements et non erreurs : la liste est masquée dès qu'un
              projet réel est sélectionné. Une erreur bloquerait alors la
              publication à cause d'un champ que l'éditeur ne voit même plus.
              Une entrée incomplète est simplement ignorée au rendu.
            */
            defineField({
              name: 'title',
              title: 'Titre',
              type: 'string',
              validation: (rule) =>
                rule.warning('Sans titre, ce visuel ne sera pas affiché.'),
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
              validation: (rule) =>
                rule.warning('Sans image, ce visuel ne sera pas affiché.'),
            }),
            defineField({
              name: 'href',
              title: 'Lien facultatif',
              type: 'url',
              validation: (rule) =>
                rule.uri({ scheme: ['http', 'https'], allowRelative: true }),
            }),
          ],
          preview: {
            select: { title: 'title', media: 'image' },
          },
        }),
      ],
      validation: (rule) => rule.max(5).error('Maximum 5 visuels temporaires.'),
    }),
  ],
  preview: {
    select: { projects: 'projects', placeholders: 'placeholderItems' },
    prepare: ({ projects, placeholders }) => ({
      title: 'Sélection de projets',
      subtitle:
        (projects?.length ?? 0) > 0
          ? `${projects.length} projet(s)`
          : `${placeholders?.length ?? 0} visuel(s) temporaire(s)`,
    }),
  },
});

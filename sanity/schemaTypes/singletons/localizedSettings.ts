import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField, sameLanguageFilter } from '../../lib/i18n';

/**
 * Réglages PAR LANGUE — un document par langue active.
 *
 * Contient tout ce qui se traduit : navigation, titre du site, page d'accueil,
 * textes de pied de page. Activer une nouvelle langue revient à créer une
 * traduction de ce document depuis le back-office ; rien à modifier dans le code.
 */
export const localizedSettings = defineType({
  name: 'localizedSettings',
  title: 'Réglages du site',
  type: 'document',
  groups: [
    { name: 'general', title: 'Général', default: true },
    { name: 'navigation', title: 'Navigation' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'siteTitle',
      title: 'Nom du site',
      type: 'string',
      group: 'general',
      initialValue: 'Studio Abîme',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'siteDescription',
      title: 'Description du site',
      type: 'text',
      rows: 3,
      group: 'general',
      description: 'Méta description par défaut, utilisée quand une page n’en définit pas.',
    }),
    defineField({
      name: 'defaultSeoImage',
      title: 'Image de partage par défaut',
      type: 'image',
      group: 'general',
      options: { hotspot: true },
    }),
    defineField({
      name: 'homePage',
      title: 'Page d’accueil',
      type: 'reference',
      to: [{ type: 'page' }],
      group: 'general',
      options: { filter: sameLanguageFilter },
      description: 'Page servie à la racine du site pour cette langue.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'projectsIntro',
      title: 'Introduction du portfolio',
      type: 'text',
      rows: 3,
      group: 'general',
      description: 'Texte affiché en tête de la page listant les projets.',
    }),

    defineField({
      name: 'projectsNotes',
      title: 'Cartes de texte — page Projets',
      type: 'array',
      group: 'general',
      description:
        'Occupent un emplacement de la grille à la place d’un projet. Le texte s’affiche en bas à droite de la carte, en italique.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'text',
              title: 'Texte',
              type: 'text',
              rows: 4,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'position',
              title: 'Emplacement',
              type: 'number',
              description:
                'Rang occupé dans la grille : 1 pour la première carte, 2 pour la deuxième… Vide ou au-delà de la grille : la carte se place en dernier.',
              validation: (rule) => rule.min(1).integer(),
            }),
          ],
          preview: {
            select: { text: 'text', position: 'position' },
            prepare: ({ text, position }) => ({
              title: text?.slice(0, 60) || 'Carte de texte',
              subtitle: position ? `Emplacement ${position}` : 'En fin de grille',
            }),
          },
        }),
      ],
    }),

    defineField({
      name: 'headerNav',
      title: 'Menu principal',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
      group: 'navigation',
    }),
    defineField({
      name: 'footerNav',
      title: 'Menu de pied de page',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
      group: 'navigation',
    }),
    defineField({
      name: 'footerText',
      title: 'Texte de pied de page',
      type: 'richText',
      group: 'navigation',
    }),
  ],
  preview: {
    select: { title: 'siteTitle', language: 'language' },
    prepare: ({ title, language }) => ({
      title: `Réglages — ${language?.toUpperCase() ?? '—'}`,
      subtitle: title,
    }),
  },
});

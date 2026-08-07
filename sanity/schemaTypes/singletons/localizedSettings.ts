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

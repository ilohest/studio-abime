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
  title: 'Textes et SEO',
  type: 'document',
  groups: [
    { name: 'general', title: 'Général', default: true },
    { name: 'seo', title: 'SEO' },
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
      group: 'seo',
      description: 'Méta description par défaut, utilisée quand une page n’en définit pas.',
      validation: (rule) =>
        rule.max(180).warning('Au-delà de 180 caractères, la description est généralement tronquée.'),
    }),
    defineField({
      name: 'defaultSeoImage',
      title: 'Image sociale par défaut (Open Graph)',
      type: 'image',
      group: 'seo',
      options: { hotspot: true },
      description: 'Utilisée lorsqu’une page ou un projet ne définit pas sa propre image. Format recommandé : 1200 × 630 px.',
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
      name: 'headerNav',
      title: 'Menu principal',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
      readOnly: true,
      hidden: true,
      deprecated: { reason: 'La navigation n’est plus administrée depuis le Studio.' },
    }),
    defineField({
      name: 'footerNav',
      title: 'Menu de pied de page',
      type: 'array',
      of: [defineArrayMember({ type: 'link' })],
      readOnly: true,
      hidden: true,
      deprecated: { reason: 'La navigation n’est plus administrée depuis le Studio.' },
    }),
    /*
      La baseline du pied de page. Elle était partie avec la navigation, dont
      elle n'a jamais relevé : une navigation est une structure, cette phrase
      est du texte — et le texte se rédige au Studio.

      Une chaîne, et non du texte riche : ce qui s'affiche est une seule ligne
      de prose, au corps de note. Le texte riche y aurait ouvert titres, listes
      et images, autant d'affordances qu'aucun pied de page ne peut honorer.
    */
    defineField({
      name: 'footerText',
      title: 'Phrase de pied de page',
      type: 'string',
      group: 'general',
      description:
        'Baseline affichée sous la mention de copyright. Laissée vide, c’est la phrase par défaut du site qui s’affiche.',
      validation: (rule) =>
        rule
          .max(200)
          .warning('Au-delà de 200 caractères, la phrase ne tient plus sur la ligne du pied de page.'),
    }),
  ],
  preview: {
    select: { title: 'siteTitle', language: 'language' },
    prepare: ({ title, language }) => ({
      title: `Contenu du site — ${language?.toUpperCase() ?? '—'}`,
      subtitle: title,
    }),
  },
});

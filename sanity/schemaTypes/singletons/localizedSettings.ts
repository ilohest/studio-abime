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
      name: 'projectsIntro',
      title: 'Texte d’introduction',
      type: 'text',
      rows: 4,
      hidden: true,
      deprecated: { reason: 'Ce contenu a été déplacé dans Pages → Page Projets.' },
    }),

    defineField({
      name: 'projectsNotes',
      title: 'Cartes de texte — page Projets',
      type: 'array',
      hidden: true,
      deprecated: { reason: 'Ces cartes ont été déplacées dans Pages → Page Projets.' },
      description:
        'Chaque texte occupe une case de la grille à la place d’un projet — les projets suivants se décalent, aucun n’est masqué. Le texte s’affiche en bas à droite de la case, en italique.',
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
              title: 'Position dans la grille',
              type: 'number',
              description:
                'On compte les cases à partir de 1 pour celle en haut à gauche, puis de gauche à droite (2, 3, 4…) et ligne après ligne. Laissé vide, ou au-delà du nombre de cases, le texte se place en dernier.',
              validation: (rule) => rule.min(1).integer(),
            }),
          ],
          preview: {
            select: { text: 'text', position: 'position' },
            prepare: ({ text, position }) => ({
              title: text?.slice(0, 60) || 'Carte de texte',
              subtitle: position ? `Position ${position}` : 'En fin de grille',
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
    defineField({
      name: 'footerText',
      title: 'Texte de pied de page',
      type: 'richText',
      readOnly: true,
      hidden: true,
      deprecated: { reason: 'La navigation n’est plus administrée depuis le Studio.' },
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

import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField, sameLanguageFilter } from '../../lib/i18n';
import { definePageBuilder } from '../objects/sections';
import { PROJECT_TEMPLATES } from '../../lib/projectTemplates';

/**
 * Projet du portfolio.
 *
 * ┌─ Modèle de page ────────────────────────────────────────────────────────┐
 * │ Chaque cas client peut avoir une structure très différente. Le schéma   │
 * │ combine donc deux leviers :                                             │
 * │                                                                         │
 * │  1. `template` — choisit l'ENVELOPPE de la page (mise en page de        │
 * │     l'en-tête, du fil de lecture, du pied de page projet). Un template  │
 * │     = un composant Astro dans `src/templates/project/`.                 │
 * │                                                                         │
 * │  2. `sections` — compose le CORPS de la page librement, bloc par bloc.  │
 * │                                                                         │
 * │ Ajouter un template : une entrée dans `sanity/lib/projectTemplates.ts`  │
 * │ + un composant dans le registre `src/templates/project/index.ts`.       │
 * │ Aucun contenu existant n'est impacté.                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const project = defineType({
  name: 'project',
  title: 'Projet',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'meta', title: 'Fiche projet' },
    { name: 'template', title: 'Modèle de page' },
    { name: 'seo', title: 'Référencement' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Accroche',
      type: 'text',
      rows: 3,
      group: 'content',
      description: "Résumé court affiché dans les listes de projets et les partages.",
      validation: (rule) => rule.max(280),
    }),

    /* ── Fiche projet ─────────────────────────────────────────────────────── */
    defineField({ name: 'client', title: 'Client', type: 'string', group: 'meta' }),
    defineField({
      name: 'year',
      title: 'Année',
      type: 'number',
      group: 'meta',
      validation: (rule) => rule.min(1990).max(new Date().getFullYear() + 2).integer(),
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      group: 'meta',
    }),
    defineField({
      name: 'listingFacts',
      title: 'Champs de la carte projet',
      type: 'array',
      group: 'meta',
      description:
        "Jusqu’à 5 lignes libres affichées entre l’image et l’accroche sur la page Projets. Une ligne incomplète n’est pas affichée.",
      of: [
        defineArrayMember({
          name: 'listingFact',
          title: 'Champ',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Intitulé',
              type: 'string',
              description: 'Ex. Discipline, Livrable, Matière…',
            }),
            defineField({
              name: 'value',
              title: 'Valeur',
              type: 'string',
              description: 'Ex. Identité visuelle, Papier, 2026…',
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'value' },
            prepare: ({ title, subtitle }) => ({
              title: title || 'Champ sans intitulé',
              subtitle: subtitle || 'Aucune valeur — cette ligne ne sera pas affichée',
            }),
          },
        }),
      ],
      validation: (rule) => rule.max(5),
    }),
    defineField({
      name: 'categories',
      title: 'Catégories',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'category' }],
          options: { filter: sameLanguageFilter },
        }),
      ],
      group: 'meta',
      description: 'Sert au filtrage interactif de la page portfolio.',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Vignette',
      type: 'image',
      group: 'meta',
      options: { hotspot: true },
      description: 'Visuel utilisé dans les listes. À défaut, la couverture est reprise.',
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    defineField({
      name: 'coverImage',
      title: 'Couverture',
      type: 'image',
      group: 'meta',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),

    /* ── Modèle de page ───────────────────────────────────────────────────── */
    defineField({
      name: 'template',
      title: 'Modèle de page',
      type: 'string',
      group: 'template',
      initialValue: 'standard',
      options: {
        list: PROJECT_TEMPLATES.map(({ value, title }) => ({ value, title })),
        layout: 'radio',
      },
      description: PROJECT_TEMPLATES.map((t) => `${t.title} — ${t.description}`).join('\n'),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'templateOptions',
      title: 'Options du modèle',
      type: 'projectTemplateOptions',
      group: 'template',
    }),

    /* ── Corps de la page ─────────────────────────────────────────────────── */
    definePageBuilder({ title: 'Contenu du projet' }),

    defineField({ name: 'seo', title: 'Référencement', type: 'seo', group: 'seo' }),
  ],
  orderings: [
    {
      name: 'yearDesc',
      title: 'Année (récent → ancien)',
      by: [
        { field: 'year', direction: 'desc' },
        { field: '_createdAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      client: 'client',
      year: 'year',
      language: 'language',
      media: 'thumbnail',
      cover: 'coverImage',
    },
    prepare: ({ title, client, year, language, media, cover }) => ({
      title,
      subtitle: [language?.toUpperCase(), client, year].filter(Boolean).join(' · '),
      media: media ?? cover,
    }),
  },
});

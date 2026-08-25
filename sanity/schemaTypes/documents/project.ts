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
    { name: 'meta', title: 'Fiche projet', default: true },
    { name: 'content', title: 'Contenu' },
    { name: 'template', title: 'Modèle de page' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Nom du projet',
      type: 'string',
      group: 'meta',
      description: 'Affiché entre parenthèses au-dessus du titre, et dans les listes.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Identifiant d’URL',
      type: 'slug',
      hidden: true,
      options: { source: 'title', maxLength: 96 },
      description: 'Généré automatiquement à la première publication.',
    }),
    defineField({
      name: 'headline',
      title: 'Titre affiché',
      type: 'text',
      rows: 2,
      group: 'meta',
      description:
        'Grande phrase en tête de la page projet, sous le nom entre parenthèses. Vide = le nom du projet.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'excerpt',
      title: 'Accroche',
      type: 'text',
      rows: 3,
      group: 'meta',
      description:
        "Résumé court affiché dans les listes de projets et les partages. N'apparaît pas sur la page du projet.",
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
      name: 'channels',
      title: 'Canaux',
      type: 'array',
      group: 'meta',
      description:
        'Où le projet est visible : site, compte Instagram, boutique… Affiché dans la fiche projet.',
      of: [
        defineArrayMember({
          name: 'channel',
          title: 'Canal',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Intitulé',
              type: 'string',
              description: 'Ex. Site, Instagram, Boutique.',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto'] }),
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'url' },
            prepare: ({ title, subtitle }) => ({
              title: title || 'Canal sans intitulé',
              subtitle: subtitle || 'Aucune URL — ce canal ne sera pas affiché',
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'listingFacts',
      title: 'Champs de la carte projet',
      type: 'array',
      group: 'meta',
      description:
        "Jusqu’à 5 lignes libres affichées entre l’image et l’accroche sur la page Expériences. Une ligne incomplète n’est pas affichée.",
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
      description: 'Visuel du projet dans les listes et en tête de page.',
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    defineField({
      name: 'coverVideoUrl',
      title: 'Vidéo de couverture',
      type: 'url',
      group: 'content',
      description: 'Fichier .mp4 en lecture automatique et muette. Remplace le visuel de tête.',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
      hidden: ({ document }) =>
        ((document?.template as string | undefined) ?? 'standard') !== 'immersive',
    }),

    defineField({
      name: 'backgroundImage',
      title: 'Arrière-plan fixe',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description:
        "Image affichée derrière toute la page du projet. Elle couvre tout l’écran et reste fixe pendant le défilement. Vide = fond jaune du site.",
    }),

    defineField({
      name: 'backgroundOpacity',
      title: 'Opacité de l’arrière-plan',
      type: 'number',
      group: 'content',
      initialValue: 100,
      description: 'Saisissez une valeur de 0 à 100 %. 0 = invisible · 100 = image totalement opaque.',
      hidden: ({ document }) => !document?.backgroundImage,
      validation: (rule) => rule.min(0).max(100).integer(),
    }),

    /* ── Corps de la page ────────────────────────────────────────────────────── */
    /*
      Liste volontairement restreinte : les blocs du site sont écrits pour la
      pleine page (Hero manifeste, Menu des services, Planche…) et n'ont pas de
      sens dans la colonne d'une page projet. On ne propose donc que ceux qui y
      tiennent vraiment.
    */
    definePageBuilder({
      title: 'Contenu du projet',
      group: 'content',
      allowed: ['richTextSection', 'fullBleedImage'],
    }),

    /* ── Planche d'images (modèles « Colonne fixe » et « Bandeau ») ───────── */
    defineField({
      name: 'gallery',
      title: 'Images du projet',
      type: 'array',
      group: 'content',
      description:
        'Visuels de la planche, dans l’ordre de la liste. Chaque image occupe une case de la trame ou toute la largeur.',
      hidden: ({ document }) =>
        !['split', 'banner'].includes((document?.template as string | undefined) ?? ''),
      of: [
        defineArrayMember({
          name: 'galleryItem',
          title: 'Visuel',
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
            }),
            /*
              Deux champs plutôt qu'un : les deux modèles n'ont pas la même
              trame, et une liste d'options ne peut pas varier selon le
              document. Chacun ne voit donc que les largeurs qui existent
              vraiment chez lui.
            */
            defineField({
              name: 'span',
              title: 'Largeur',
              type: 'string',
              initialValue: '1',
              options: {
                list: [
                  { value: '1', title: '1 colonne' },
                  { value: '2', title: '2 colonnes' },
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
              description: 'Sur les 2 colonnes de la planche du modèle Colonne fixe.',
              hidden: ({ document }) => (document?.template as string | undefined) !== 'split',
            }),
            defineField({
              name: 'spanWide',
              title: 'Largeur',
              type: 'string',
              initialValue: '1',
              options: {
                list: [
                  { value: '1', title: '1 colonne' },
                  { value: '2', title: '2 colonnes' },
                  { value: '3', title: '3 colonnes' },
                ],
                layout: 'radio',
                direction: 'horizontal',
              },
              description: 'Sur les 3 colonnes de la planche du modèle Bandeau.',
              hidden: ({ document }) => (document?.template as string | undefined) !== 'banner',
            }),
            defineField({ name: 'caption', title: 'Légende', type: 'string' }),
          ],
          preview: {
            select: { caption: 'caption', span: 'span', spanWide: 'spanWide', media: 'image' },
            prepare: ({ caption, span, spanWide, media }) => ({
              title: caption || 'Visuel',
              subtitle: `${Number(spanWide ?? span) || (span === 'full' ? 3 : 1)} colonne(s)`,
              media,
            }),
          },
        }),
      ],
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

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      options: { collapsible: false },
    }),
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
    },
    prepare: ({ title, client, year, language, media }) => ({
      title,
      subtitle: [language?.toUpperCase(), client, year].filter(Boolean).join(' · '),
      media,
    }),
  },
});

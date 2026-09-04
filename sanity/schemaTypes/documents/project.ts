import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';
import { previousSlugsField, slugField } from '../../lib/slugFields';
import { definePageBuilder } from '../objects/sections';
import { DEFAULT_PROJECT_TEMPLATE, PROJECT_TEMPLATES } from '../../lib/projectTemplates';
import { MAX_FEATURED_PROJECTS } from '../../../src/lib/references';

const API_VERSION = '2025-02-19';

/**
 * Projet du portfolio.
 *
 * ┌─ Modèle de page ────────────────────────────────────────────────────────┐
 * │ `template` ouvre l'onglet « Contenu », parce qu'il commande ce qui s'y  │
 * │ saisit ensuite : chaque modèle a SON corps, et les autres se masquent.  │
 * │                                                                         │
 * │  · Colonne fixe / Bandeau — texte en blocs (`sections`) et planche      │
 * │    d'images (`gallery`) ;                                               │
 * │  · Composition libre     — textes, figures et notes intercalés          │
 * │    (`blocks`), la saisie même des articles du Journal.                  │
 * │                                                                         │
 * │ Ajouter un modèle : une entrée dans `sanity/lib/projectTemplates.ts`    │
 * │ + un composant dans `src/templates/project/`. Aucun contenu existant    │
 * │ n'est impacté.                                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const project = defineType({
  name: 'project',
  title: 'Projet',
  type: 'document',
  groups: [
    { name: 'meta', title: 'Fiche projet', default: true },
    { name: 'content', title: 'Contenu' },
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
    slugField,
    previousSlugsField,

    /* ── Diffusion ────────────────────────────────────────────────────────── */
    defineField({
      name: 'visible',
      title: 'Visible sur le site',
      type: 'boolean',
      group: 'meta',
      initialValue: true,
      description:
        'Désactivé, le projet disparaît de tout le site : grille des Expériences, page d’accueil, archive du Labo, et sa page n’est plus publiée.',
    }),
    defineField({
      name: 'featured',
      title: 'Projet favori',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
      description:
        `Les ${MAX_FEATURED_PROJECTS} premiers favoris (du plus récent au plus ancien) occupent les cases réservées de la table des éléments, la sélection de la page d’accueil et l’archive du Labo.`,
      /*
        Un avertissement, pas une erreur : la limite dépend des AUTRES documents.
        Une erreur bloquerait la publication d'un projet à cause d'un état que
        l'éditeur ne voit pas depuis cette fiche. Au rendu, seuls les
        MAX_FEATURED_PROJECTS premiers favoris sont retenus.
      */
      validation: (rule) =>
        rule
          .custom(async (value, context) => {
            if (value !== true) return true;

            const document = context.document;
            const language = typeof document?.language === 'string' ? document.language : 'fr';
            const publishedId = (document?._id ?? '').replace(/^drafts\./, '');
            const client = context.getClient({ apiVersion: API_VERSION });
            const others = await client.fetch<number>(
              /* groq */ `count(*[
                _type == "project" &&
                language == $language &&
                featured == true &&
                coalesce(visible, true) == true &&
                !(_id in [$publishedId, "drafts." + $publishedId])
              ])`,
              { language, publishedId },
            );

            return others >= MAX_FEATURED_PROJECTS
              ? `Déjà ${others} projets favoris : au-delà de ${MAX_FEATURED_PROJECTS}, seuls les plus récents seront affichés.`
              : true;
          })
          .warning(),
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
      name: 'sector',
      title: 'Secteur',
      type: 'string',
      group: 'meta',
      description:
        'Domaine d’activité du client — ex. Gastronomie, Édition, Musique. Affiché sous l’initiale dans la table des éléments, à la place du mot « élément ».',
      validation: (rule) => rule.max(40),
    }),
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
      name: 'thumbnail',
      title: 'Vignette',
      type: 'image',
      group: 'meta',
      options: { hotspot: true },
      description: 'Visuel du projet dans les listes et en tête de page.',
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    /* ── Corps de la page ────────────────────────────────────────────────────── */
    /*
      Le modèle ouvre l'onglet : il décide de ce qui se saisit en dessous. Les
      corps des autres modèles se masquent, mais rien n'est effacé — repasser au
      modèle précédent retrouve la saisie intacte.
    */
    defineField({
      name: 'template',
      title: 'Modèle de page',
      type: 'string',
      group: 'content',
      initialValue: DEFAULT_PROJECT_TEMPLATE,
      options: {
        list: PROJECT_TEMPLATES.map(({ value, title }) => ({ value, title })),
        layout: 'radio',
      },
      description: PROJECT_TEMPLATES.map((t) => `${t.title} — ${t.description}`).join('\n'),
      validation: (rule) => rule.required(),
    }),

    /*
      Le titre affiché ouvre la saisie du contenu : c'est la première phrase que
      lit le visiteur, pas une donnée de la fiche. Il vivait avec le relevé —
      client, secteur, année, services —, là où on ne pense pas à le chercher au
      moment d'écrire la page.
    */
    defineField({
      name: 'headline',
      title: 'Titre affiché',
      type: 'text',
      rows: 2,
      group: 'content',
      description:
        'Grande phrase en tête de la page projet, sous le nom entre parenthèses. Vide = le nom du projet.',
      validation: (rule) => rule.max(160),
    }),

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
      hidden: ({ document }) => (document?.template as string | undefined) === 'composition',
    }),

    /* ── Composition libre (modèle « Composition libre ») ─────────────────── */
    /*
      Exactement les blocs du Journal — mêmes types, même appareil de figures et
      de notes. C'est délibéré : l'éditrice n'a qu'une grammaire de composition à
      apprendre, et un projet raconté comme un article se saisit comme un
      article. Le rendu passe d'ailleurs par le même composant.
    */
    defineField({
      name: 'blocks',
      title: 'Composition du projet',
      type: 'array',
      group: 'content',
      description:
        'Intercalez autant de textes, de figures et de notes que vous le souhaitez. Les figures et les notes sont numérotées automatiquement, dans l’ordre de la liste.',
      hidden: ({ document }) => (document?.template as string | undefined) !== 'composition',
      of: [
        defineArrayMember({ type: 'journalProse' }),
        defineArrayMember({ type: 'journalFigure' }),
        defineArrayMember({ type: 'journalNote' }),
      ],
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
      featured: 'featured',
      visible: 'visible',
      media: 'thumbnail',
    },
    prepare: ({ title, client, year, language, featured, visible, media }) => {
      /*
        Deux repères lus d'un coup d'œil dans la liste : ★ favori, ⊘ masqué.
        Le mot « Masqué » reste dans le sous-titre — un projet retiré du site
        est un état exceptionnel, il ne doit pas dépendre d'un glyphe à
        déchiffrer.
      */
      const marks = [featured ? '★' : null, visible === false ? '⊘' : null]
        .filter(Boolean)
        .join(' ');

      return {
        title: marks ? `${marks} ${title}` : title,
        subtitle: [language?.toUpperCase(), client, year, visible === false ? 'Masqué' : null]
          .filter(Boolean)
          .join(' · '),
        media,
      };
    },
  },
});

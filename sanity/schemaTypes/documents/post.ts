import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "../../lib/i18n";
import {
  JOURNAL_CATEGORIES,
  defaultJournalCategory,
} from "../../../src/content/journalCategories";

/**
 * Article du Journal.
 *
 * Le Journal n'a que deux rubriques, fixées en code
 * (`src/content/journalCategories.ts`) :
 *
 *  - « Cahier de recherche » — articles de fond, texte long ;
 *  - « Actualités »          — brèves du studio.
 *
 * Elles ne sont pas des documents `category` (réservés au portfolio) parce
 * qu'elles structurent la page autant qu'elles classent le contenu : les
 * filtres, l'ordre et la mise en scène en dépendent.
 */
export const post = defineType({
  name: "post",
  title: "Article",
  type: "document",
  groups: [
    { name: "meta", title: "Fiche article", default: true },
    { name: "content", title: "Contenu" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    languageField,
    defineField({
      name: "title",
      title: "Titre",
      type: "string",
      group: "meta",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Identifiant d’URL",
      type: "slug",
      hidden: true,
      options: { source: "title", maxLength: 96 },
      description: "Généré automatiquement à la première publication.",
    }),
    defineField({
      name: "category",
      title: "Rubrique",
      type: "string",
      group: "meta",
      initialValue: defaultJournalCategory,
      options: {
        layout: "radio",
        list: JOURNAL_CATEGORIES.map(({ value, title }) => ({ value, title })),
      },
      description: JOURNAL_CATEGORIES.map(
        (c) => `${c.title} — ${c.description}`,
      ).join("\n"),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Date de publication",
      type: "date",
      group: "meta",
      options: { dateFormat: "DD/MM/YYYY" },
      description:
        "Détermine la place de l’article dans le Journal : le plus récent en premier.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Accroche",
      type: "text",
      rows: 3,
      group: "meta",
      description: "Résumé court affiché dans la grille du Journal.",
      validation: (rule) => rule.max(280),
    }),
    defineField({
      name: "listingFacts",
      title: "Champs de la carte article",
      type: "array",
      group: "meta",
      description:
        "Jusqu’à 5 lignes libres affichées entre l’image et l’accroche sur la page Journal, à la manière d’une planche de botanique. Une ligne incomplète n’est pas affichée.",
      of: [
        defineArrayMember({
          name: "listingFact",
          title: "Champ",
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Intitulé",
              type: "string",
              description: "Ex. Famille, Genre, Espèce, Saison…",
            }),
            defineField({
              name: "value",
              title: "Valeur",
              type: "string",
              description: "Ex. Abacardiacées, Vicia, Été…",
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
            prepare: ({ title, subtitle }) => ({
              title: title || "Champ sans intitulé",
              subtitle:
                subtitle || "Aucune valeur — cette ligne ne sera pas affichée",
            }),
          },
        }),
      ],
      validation: (rule) => rule.max(5),
    }),
    defineField({
      name: "coverImage",
      title: "Visuel",
      type: "image",
      group: "meta",
      options: { hotspot: true },
      description: "Visuel de l’article dans la grille et en tête de page.",
      fields: [
        defineField({ name: "alt", title: "Texte alternatif", type: "string" }),
      ],
    }),

    defineField({
      name: "template",
      title: "Modèle de page",
      type: "string",
      group: "content",
      initialValue: "revue",
      options: {
        layout: "radio",
        list: [
          { value: "revue", title: "Article de revue" },
          { value: "planche", title: "Planche illustrée" },
        ],
      },
      description: [
        "Article de revue — colonne de lecture étroite, figures réduites, notes en marge. Pour un texte long.",
        "Planche illustrée — colonne plus large et images plus présentes. Pour un article porté par ses visuels.",
        "Le contenu est le même dans les deux cas : changer de modèle ne demande aucune ressaisie.",
      ].join("\n"),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "standfirst",
      title: "Chapô",
      type: "text",
      rows: 3,
      group: "content",
      description:
        "Phrase d’ouverture affichée en grand sous le titre de l’article.",
      validation: (rule) => rule.max(320),
    }),
    defineField({
      name: "blocks",
      title: "Composition de l’article",
      type: "array",
      group: "content",
      description:
        "Intercalez autant de textes, de figures et de notes que vous le souhaitez. Les figures et les notes sont numérotées automatiquement, dans l’ordre de la liste.",
      of: [
        defineArrayMember({ type: "journalProse" }),
        defineArrayMember({ type: "journalFigure" }),
        defineArrayMember({ type: "journalNote" }),
      ],
    }),

    /*
      Ancienne saisie : un corps de texte unique, sans figures ni notes. Elle
      reste lue au rendu tant que la composition est vide, afin qu'aucun
      article écrit avant les blocs ne se retrouve amputé.
    */
    defineField({
      name: "body",
      title: "Corps de l’article (ancienne saisie)",
      type: "richText",
      group: "content",
      hidden: ({ document }) =>
        ((document?.blocks as unknown[] | undefined)?.length ?? 0) > 0,
      description:
        "Repris tel quel tant que la composition ci-dessus est vide. Recopiez-le dans un bloc « Texte » pour pouvoir y intercaler des figures.",
    }),

    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
      options: { collapsible: false },
    }),
  ],
  orderings: [
    {
      name: "publishedAtDesc",
      title: "Date (récent → ancien)",
      by: [
        { field: "publishedAt", direction: "desc" },
        { field: "_createdAt", direction: "desc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      publishedAt: "publishedAt",
      language: "language",
      media: "coverImage",
    },
    prepare: ({ title, category, publishedAt, language, media }) => ({
      title: title || "Article sans titre",
      subtitle: [
        language?.toUpperCase(),
        JOURNAL_CATEGORIES.find((entry) => entry.value === category)?.title,
        publishedAt,
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});

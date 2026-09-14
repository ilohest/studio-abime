import { defineArrayMember, defineField, defineType } from "sanity";
import { languageField } from "../../lib/i18n";
import { previousSlugsField, slugField } from "../../lib/slugFields";
import {
  LIBRARY_RUBRICS,
  defaultLibraryRubric,
} from "../../../src/content/libraryRubrics";

/**
 * Article de la Bibliothèque.
 *
 * Les cinq rubriques sont fixées en code (`src/content/libraryRubrics.ts`) :
 * Journal, Carnet de voyages, Correspondances, Références, Essais.
 *
 * Elles ne sont pas des documents `category` (réservés au portfolio) parce
 * qu'elles structurent le site autant qu'elles classent le contenu : chacune a
 * sa page, son adresse et son mot dans le texte d'accueil.
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
    slugField,
    previousSlugsField,
    defineField({
      /*
        Plusieurs rubriques par article, et non une seule.

        Un récit de voyage qui cite trois lectures appartient autant au carnet
        qu'aux références ; l'obliger à choisir le ferait disparaître d'un côté
        ou de l'autre. L'article paraît donc dans chaque grille qu'il coche, et
        sa fiche les annonce toutes.

        `unique()` parce que l'interface à cases ne l'empêche pas côté données :
        un import ou une correction à l'API pourrait doubler une valeur, et le
        même article s'afficherait deux fois dans la même grille.
      */
      name: "rubrics",
      title: "Rubriques",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      group: "meta",
      initialValue: [defaultLibraryRubric],
      /*
        UNE RUBRIQUE PAR LIGNE, SON EXPLICATION AVEC ELLE.

        Deux défauts se corrigent ici d'un même geste :

        · La disposition en grille rangeait cinq cases sur une seule ligne. Les
          intitulés longs — « Carnet de voyages », « Correspondances » — y
          passaient à la ligne ou chevauchaient la case suivante, et on ne
          savait plus quelle case allait avec quel nom. La liste donne une
          ligne pleine à chacune : plus rien ne se dispute la largeur.

        · La description du champ empilait les cinq explications bout à bout.
          Sanity la rend en un seul paragraphe — les retours à la ligne y sont
          avalés — et il en sortait un pavé où il fallait deviner où finissait
          une rubrique et où commençait la suivante. Chaque explication est
          donc DANS son intitulé, à côté de sa case. Le champ, lui, ne dit plus
          que ce qu'il attend.

        La valeur stockée reste le seul identifiant : c'est le libellé affiché
        qui s'enrichit, pas la donnée.
      */
      options: {
        layout: "list",
        list: LIBRARY_RUBRICS.map(({ value, title, description }) => ({
          value,
          title: `${title} — ${description}`,
        })),
      },
      description:
        "Un article peut appartenir à plusieurs rubriques : cocher toutes celles qui conviennent.",
      validation: (rule) => rule.required().min(1).unique(),
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
      name: "coverImage",
      title: "Visuel",
      type: "image",
      group: "meta",
      options: { hotspot: true },
      /*
        Ce visuel sert à QUATRE endroits, et l'éditrice doit le savoir avant de
        le choisir : recadré au carré dans la grille d'une rubrique, présenté en
        tête de l'article, repris en petit sur la fiche « article suivant », et
        employé comme image de partage à défaut d'une image SEO propre. Un
        visuel qui ne tient qu'en pleine largeur se retrouvera donc rogné
        ailleurs — mieux vaut l'annoncer que de le laisser découvrir.
      */
      description:
        "Recadré au carré dans la grille d’une rubrique, présenté en tête de l’article, " +
        "repris sur la fiche « article suivant », et utilisé au partage si aucune image SEO " +
        "n’est renseignée.",
      fields: [
        defineField({ name: "alt", title: "Texte alternatif", type: "string" }),
      ],
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
      rubrics: "rubrics",
      publishedAt: "publishedAt",
      language: "language",
      media: "coverImage",
    },
    prepare: ({ title, rubrics, publishedAt, language, media }) => {
      // Les cotes plutôt que les intitulés : « JO · CV » tient dans la liste
      // du Studio là où « Journal, Carnet de voyages » la ferait déborder.
      const marks = LIBRARY_RUBRICS.filter((rubric) =>
        (rubrics ?? []).includes(rubric.value),
      )
        .map((rubric) => rubric.mark)
        .join(" · ");

      return {
        title: title || "Article sans titre",
        subtitle: [language?.toUpperCase(), marks, publishedAt]
          .filter(Boolean)
          .join(" · "),
        media,
      };
    },
  },
});

import { defineArrayMember, defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../lib/i18n';

/**
 * Une entrée de l'index qui referme la page Contact.
 *
 * L'index reprend les codes d'un index de livre : un terme, sa catégorie
 * grammaticale, ses renvois — « Archive, n. f. 01.4, 02 » — et sous lui, en
 * italique, les œuvres où il apparaît.
 *
 * ── Ce qui ne se saisit PAS ici : les folios ────────────────────────────────
 * Un projet appartient aux Expériences, un article au Journal : on désigne le
 * document, le NUMÉRO suit, calculé au rendu depuis `src/lib/siteIndex.ts`.
 * Saisir « 02 » à la main marcherait le jour de la saisie et mentirait au
 * premier réordonnancement du menu — et un index dont les renvois sont faux ne
 * vaut rien.
 */
const indexWork = defineType({
  name: 'indexWork',
  title: 'Œuvre citée',
  type: 'object',
  fields: [
    defineField({
      name: 'reference',
      title: 'Projet ou article',
      type: 'reference',
      to: [{ type: 'project' }, { type: 'post' }],
      options: { filter: sameLanguageFilter },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Titre affiché',
      type: 'string',
      description:
        'Laisser vide pour reprendre le titre du document. À ne remplir que si l’index doit citer l’œuvre sous un autre nom.',
    }),
    defineField({
      name: 'year',
      title: 'Année',
      type: 'string',
      description: 'Affichée entre parenthèses, comme dans un index de livre : « (2024) ».',
    }),
  ],
  preview: {
    select: { label: 'label', title: 'reference.title', year: 'year' },
    prepare: ({ label, title, year }) => ({
      title: label || title || 'Œuvre',
      subtitle: year || undefined,
    }),
  },
});

/*
 * Lien porté par un terme d'index.
 *
 * Type propre plutôt que le `link` commun du site : celui-ci demande un
 * libellé, or il n'y a rien à libeller — c'est LE TERME qui devient cliquable.
 * Un champ qu'on ne lit pas n'a rien à faire dans un formulaire.
 */
const indexLink = defineType({
  name: 'indexLink',
  title: 'Lien',
  type: 'object',
  fields: [
    defineField({
      name: 'internal',
      title: 'Destination',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'project' }, { type: 'post' }, { type: 'projectsPage' }],
      options: { filter: sameLanguageFilter },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Ouvrir dans un nouvel onglet',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'internal.title' },
    prepare: ({ title }) => ({ title: title || 'Destination' }),
  },
});

const indexEntry = defineType({
  name: 'indexEntry',
  title: 'Entrée d’index',
  type: 'object',
  fields: [
    defineField({
      name: 'term',
      title: 'Terme',
      type: 'string',
      description: 'Le mot tel qu’il se classe alphabétiquement. Exemple : « Abîme ».',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      description:
        'Le code de glossaire qui suit le terme : « n. m. », « n. f. », « procédé », « v. tr. ». C’est lui qui distingue un glossaire d’une simple table.',
    }),
    defineField({
      name: 'definition',
      title: 'Définition',
      type: 'text',
      rows: 2,
      description: 'Une ligne, deux au plus. La profondeur de l’index tient à ce champ.',
    }),
    /*
      Le terme devient cliquable. Les « Renvois » sont bornés aux sections du
      site et les « Œuvres citées » à des projets ou des articles : il manquait
      de quoi mener le mot lui-même quelque part.
    */
    defineField({
      name: 'link',
      title: 'Lien complémentaire',
      type: 'indexLink',
      description: 'Facultatif. Rend le terme cliquable vers la page choisie.',
    }),
    defineField({
      name: 'works',
      title: 'Œuvres citées',
      type: 'array',
      of: [defineArrayMember({ type: 'indexWork' })],
      description: 'Les sous-entrées en italique : projets et articles où le terme est à l’œuvre.',
    }),
  ],
  preview: {
    select: { term: 'term', category: 'category', definition: 'definition' },
    prepare: ({ term, category, definition }) => ({
      title: [term, category].filter(Boolean).join(', '),
      subtitle: definition || undefined,
    }),
  },
});

export const indexEntryTypes = [indexEntry, indexWork, indexLink];

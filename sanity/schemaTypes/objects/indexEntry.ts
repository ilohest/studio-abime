import { defineArrayMember, defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../lib/i18n';
import { IndexLinkInput } from '../../components/IndexLinkInput';
import { IndexWorksInput } from '../../components/IndexWorksInput';

/**
 * Une entrée de l'index qui referme la page Contact.
 *
 * L'index reprend les codes d'un index de livre : un terme, sa catégorie
 * grammaticale, sa définition et, sous lui, les œuvres où il apparaît.
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
      hidden: true,
      readOnly: true,
      deprecated: { reason: 'Le titre du document est maintenant toujours repris automatiquement.' },
    }),
    defineField({
      name: 'year',
      title: 'Année',
      type: 'string',
      hidden: true,
      readOnly: true,
      deprecated: { reason: 'L’année n’est plus affichée dans l’index.' },
    }),
  ],
  preview: {
    select: { title: 'reference.title' },
    prepare: ({ title }) => ({ title: title || 'Œuvre' }),
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
  components: { input: IndexLinkInput },
  fields: [
    defineField({
      name: 'internal',
      title: 'Destination',
      type: 'reference',
      to: [
        { type: 'page' },
        { type: 'project' },
        { type: 'post' },
        { type: 'projectsPage' },
        { type: 'journalPage' },
      ],
      options: { filter: sameLanguageFilter },
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as
            | { shopifyType?: string; externalUrl?: string }
            | undefined;
          return value || parent?.shopifyType || parent?.externalUrl?.trim()
            ? true
            : 'Sélectionner une destination.';
        }),
    }),
    defineField({
      name: 'shopifyType',
      title: 'Type de destination Shopify',
      type: 'string',
      options: { list: ['shop', 'collection', 'product'] },
      hidden: true,
    }),
    defineField({
      name: 'shopifyHandle',
      title: 'Identifiant Shopify',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'shopifyTitle',
      title: 'Titre Shopify',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'externalUrl',
      title: 'URL ou chemin',
      type: 'url',
      hidden: true,
      validation: (rule) =>
        rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Ouvrir dans un nouvel onglet',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'internal.title',
      shopifyTitle: 'shopifyTitle',
      externalUrl: 'externalUrl',
    },
    prepare: ({ title, shopifyTitle, externalUrl }) => ({
      title: title || shopifyTitle || externalUrl || 'Destination',
    }),
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
      components: { input: IndexWorksInput },
      description:
        'Ajouter directement les projets et articles où le terme est à l’œuvre.',
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

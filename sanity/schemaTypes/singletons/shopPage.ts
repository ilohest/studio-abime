import { defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/**
 * Contenu éditorial propre à l'index de la boutique.
 *
 * Le catalogue — tirages, prix, stock, variantes — vit dans Shopify et n'a
 * aucune raison d'être recopié ici. Ce singleton ne porte que ce que Shopify ne
 * sait pas dire : le titre de la page et le texte d'ouverture qui cadre la
 * lecture de toutes les fiches.
 */
export const shopPage = defineType({
  name: 'shopPage',
  title: 'Page Shop',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Titre de la page',
      type: 'string',
      group: 'content',
      initialValue: 'Shop',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Texte d’introduction',
      type: 'text',
      rows: 5,
      group: 'content',
      description:
        'Texte affiché au-dessus de la grille des tirages. C’est ici que se pose la vision : les fiches, elles, restent factuelles.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      options: { collapsible: false },
    }),
  ],
  preview: {
    select: { language: 'language' },
    prepare: ({ language }) => ({
      title: 'Page Shop',
      subtitle: language?.toUpperCase() ?? '—',
    }),
  },
});

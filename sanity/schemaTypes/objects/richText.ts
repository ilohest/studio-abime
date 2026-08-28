import { defineArrayMember, defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../lib/i18n';

/**
 * Image insérée dans un flux de texte riche.
 * Séparée du type `image` natif pour porter légende et texte alternatif.
 */
export const inlineImage = defineType({
  name: 'inlineImage',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Texte alternatif',
      type: 'string',
      description: "Décrit l'image pour les lecteurs d'écran et le référencement.",
      validation: (rule) => rule.required().warning('Un texte alternatif est requis pour l’accessibilité.'),
    }),
    defineField({ name: 'caption', title: 'Légende', type: 'string' }),
  ],
});

/**
 * Texte riche (Portable Text).
 *
 * Les styles proposés reflètent la charte typographique : Titre / Sous-titre /
 * Copy / Annotation. Aucun style « libre » n'est exposé afin que le rendu reste
 * strictement dans le design system.
 */
export const richText = defineType({
  name: 'richText',
  title: 'Texte riche',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Copy', value: 'normal' },
        { title: 'Titre', value: 'h2' },
        { title: 'Sous-titre', value: 'h3' },
        { title: 'Annotation', value: 'blockquote' },
      ],
      lists: [
        { title: 'Puces', value: 'bullet' },
        { title: 'Numérotée', value: 'number' },
      ],
      /*
        Objets EN LIGNE — insérés dans le fil d'une phrase, à la différence des
        membres du tableau parent (`inlineImage`), qui occupent un bloc entier.
      */
      of: [defineArrayMember({ type: 'identityValue' })],
      marks: {
        decorators: [
          { title: 'Italique', value: 'em' },
          { title: 'Gras', value: 'strong' },
        ],
        annotations: [
          {
            name: 'linkMark',
            title: 'Lien',
            type: 'object',
            fields: [
              defineField({
                name: 'kind',
                title: 'Type de lien',
                type: 'string',
                initialValue: 'internal',
                options: {
                  list: [
                    { value: 'internal', title: 'Page du site' },
                    { value: 'external', title: 'URL externe' },
                  ],
                  layout: 'radio',
                  direction: 'horizontal',
                },
              }),
              defineField({
                name: 'internal',
                title: 'Destination',
                type: 'reference',
                to: [{ type: 'page' }, { type: 'project' }],
                options: { filter: sameLanguageFilter },
                hidden: ({ parent }) => parent?.kind !== 'internal',
              }),
              defineField({
                name: 'externalUrl',
                title: 'URL',
                type: 'url',
                validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
                hidden: ({ parent }) => parent?.kind !== 'external',
              }),
              defineField({
                name: 'openInNewTab',
                title: 'Ouvrir dans un nouvel onglet',
                type: 'boolean',
                initialValue: false,
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: 'inlineImage' }),
  ],
});

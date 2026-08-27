import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Réglages GLOBAUX — partagés par toutes les langues.
 *
 * Règle de partage : tout ce qui ne se traduit pas vit ici (réseaux sociaux,
 * identifiants d'analytics). Tout ce qui se traduit vit dans
 * `localizedSettings`. Cette séparation évite de dupliquer — et de désynchroniser —
 * des informations identiques à chaque ajout de langue.
 *
 * Document singleton : instance unique, `_id` figé (voir la structure du back-office).
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Réseaux sociaux',
  type: 'document',
  fields: [
    defineField({
      name: 'socialLinks',
      title: 'Réseaux sociaux',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Plateforme',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required().uri({ scheme: ['https'] }),
            }),
          ],
          preview: {
            select: { title: 'platform', subtitle: 'url' },
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Logo et réseaux sociaux' }),
  },
});

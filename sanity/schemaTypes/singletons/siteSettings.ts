import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Réglages GLOBAUX — partagés par toutes les langues.
 *
 * Règle de partage : tout ce qui ne se traduit pas vit ici (réseaux sociaux,
 * identité de l'entreprise). Tout ce qui se traduit vit dans
 * `localizedSettings`. Cette séparation évite de dupliquer — et de désynchroniser —
 * des informations identiques à chaque ajout de langue.
 *
 * Document singleton : instance unique, `_id` figé (voir la structure du back-office).
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Identité et réseaux sociaux',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identité', default: true },
    { name: 'social', title: 'Réseaux sociaux' },
  ],
  fields: [
    /*
      Fiche d'identité de l'entreprise.

      Elle n'est affichée nulle part sur le site : elle alimente les données
      structurées Schema.org (voir `src/lib/seo/jsonLd.ts`), c'est-à-dire ce que
      Google, les assistants et les réseaux lisent pour rattacher le site à une
      entreprise réelle. Un champ laissé vide n'est simplement pas publié —
      mieux vaut une fiche partielle qu'une fiche inventée.
    */
    defineField({
      name: 'organization',
      title: 'Fiche d’entreprise',
      type: 'object',
      group: 'identity',
      description:
        'Ces informations ne s’affichent pas sur le site : elles servent à Google et aux réseaux sociaux à identifier le studio comme une entreprise réelle. Ce qui reste vide n’est pas publié.',
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'logo',
          title: 'Logo',
          type: 'image',
          description:
            'Le logo tel que Google peut l’afficher à côté du site dans ses résultats. Image carrée, 512 × 512 px minimum, au format PNG ou JPG (le SVG n’est pas accepté).',
        }),
        defineField({
          name: 'legalName',
          title: 'Dénomination légale',
          type: 'string',
          description: 'Le nom inscrit à la Banque-Carrefour des Entreprises, s’il diffère du nom d’usage.',
        }),
        defineField({
          name: 'email',
          title: 'Adresse e-mail de contact',
          type: 'string',
          description: 'Adresse publique du studio. Elle sera lisible par les moteurs de recherche.',
          validation: (rule) =>
            rule.email().warning('Cette adresse ne ressemble pas à une adresse e-mail valide.'),
        }),
        defineField({
          name: 'phone',
          title: 'Téléphone',
          type: 'string',
          description: 'Au format international : +32 2 123 45 67.',
        }),
        defineField({
          name: 'streetAddress',
          title: 'Rue et numéro',
          type: 'string',
        }),
        defineField({
          name: 'postalCode',
          title: 'Code postal',
          type: 'string',
        }),
        defineField({
          name: 'addressLocality',
          title: 'Ville',
          type: 'string',
        }),
        defineField({
          name: 'addressCountry',
          title: 'Pays',
          type: 'string',
          description: 'Code à deux lettres : BE, FR, NL…',
          initialValue: 'BE',
          validation: (rule) =>
            rule
              .uppercase()
              .max(2)
              .warning('Un code pays s’écrit sur deux lettres majuscules (BE, FR, NL…).'),
        }),
        defineField({
          name: 'vatId',
          title: 'Numéro de TVA',
          type: 'string',
          description: 'Format européen : BE0123456789.',
        }),
        defineField({
          name: 'foundingDate',
          title: 'Date de création',
          type: 'date',
          options: { dateFormat: 'YYYY-MM-DD' },
        }),
      ],
    }),

    defineField({
      name: 'socialLinks',
      title: 'Réseaux sociaux',
      type: 'array',
      group: 'social',
      description:
        'Ces profils apparaissent en pied de page et servent aussi à relier le site aux comptes officiels du studio dans les résultats de recherche.',
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
    prepare: () => ({ title: 'Identité et réseaux sociaux' }),
  },
});

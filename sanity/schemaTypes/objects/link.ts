import { defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../lib/i18n';

/**
 * Lien unifié : interne (référence) ou externe (URL).
 *
 * Le CMS ne stocke JAMAIS d'URL interne en dur — uniquement une référence.
 * La forme finale de l'URL est calculée côté Astro (`resolveLink()`), ce qui
 * permet de faire évoluer la structure de routes sans migration de contenu.
 */
export const link = defineType({
  name: 'link',
  title: 'Lien',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Libellé',
      type: 'string',
      description: "Laisser vide pour reprendre le titre de la page ciblée.",
    }),
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'internal',
      title: 'Destination',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'project' }],
      // On ne propose que des documents de la même langue.
      options: { filter: sameLanguageFilter },
      hidden: ({ parent }) => parent?.kind !== 'internal',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { kind?: string } | undefined;
          if (parent?.kind === 'internal' && !value) return 'Sélectionnez une page de destination.';
          return true;
        }),
    }),
    defineField({
      name: 'externalUrl',
      title: 'URL',
      type: 'url',
      validation: (rule) =>
        rule
          .uri({ scheme: ['http', 'https', 'mailto', 'tel'] })
          .custom((value, context) => {
            const parent = context.parent as { kind?: string } | undefined;
            if (parent?.kind === 'external' && !value) return 'Renseignez une URL.';
            return true;
          }),
      hidden: ({ parent }) => parent?.kind !== 'external',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Ouvrir dans un nouvel onglet',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { label: 'label', kind: 'kind', internalTitle: 'internal.title', externalUrl: 'externalUrl' },
    prepare: ({ label, kind, internalTitle, externalUrl }) => ({
      title: label || internalTitle || externalUrl || 'Lien',
      subtitle: kind === 'external' ? externalUrl : internalTitle,
    }),
  },
});

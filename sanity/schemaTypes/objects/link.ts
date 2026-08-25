import { defineField, defineType } from 'sanity';
import { sameLanguageFilter } from '../../lib/i18n';

/**
 * Lien vers une page du site.
 *
 * Le CMS ne stocke JAMAIS d'URL en dur — uniquement une référence. La forme
 * finale de l'URL est calculée côté Astro (`resolveLink()`), ce qui permet de
 * faire évoluer la structure de routes sans migration de contenu.
 *
 * Les champs `kind` et `externalUrl` ne sont plus proposés à la saisie : ils
 * restent dans le schéma pour que les liens externes déjà enregistrés
 * continuent d'être résolus au rendu.
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
      hidden: true,
    }),
    defineField({
      name: 'internal',
      title: 'Destination',
      type: 'reference',
      /*
        La page Expériences n'a pas de slug — sa route est calculée par langue
        (`/experiences`, `/en/work`). Elle est malgré tout référençable ici : c'est
        `resolveLink()` qui traduit le document en URL.
      */
      to: [{ type: 'page' }, { type: 'project' }, { type: 'projectsPage' }],
      // On ne propose que des documents de la même langue.
      options: { filter: sameLanguageFilter },
      /*
        Toujours visible, y compris sur un ancien lien externe : c'est par ce
        champ qu'on le ramène vers une page du site.
      */
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { externalUrl?: string } | undefined;
          // Un lien externe hérité reste valide tant qu'il porte son URL.
          if (!value && !parent?.externalUrl) return 'Sélectionnez une page de destination.';
          return true;
        }),
    }),
    defineField({
      name: 'externalUrl',
      title: 'URL',
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
    select: { label: 'label', kind: 'kind', internalTitle: 'internal.title', externalUrl: 'externalUrl' },
    prepare: ({ label, kind, internalTitle, externalUrl }) => ({
      title: label || internalTitle || externalUrl || 'Lien',
      subtitle: kind === 'external' ? externalUrl : internalTitle,
    }),
  },
});

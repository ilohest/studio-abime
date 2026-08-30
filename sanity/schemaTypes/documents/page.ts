import { defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';
import { definePageBuilder } from '../objects/sections';
import { legalPageFromId, type LegalPageKey } from '../../../src/i18n/routes';

/** Libellés du back-office, alignés sur les entrées de la structure. */
const LEGAL_TITLES: Record<LegalPageKey, string> = {
  notice: 'Mentions légales',
  privacy: 'Politique de confidentialité',
  cookies: 'Politique cookies',
};

/**
 * Page à emplacement figé — l'accueil et les trois pages d'informations légales.
 *
 * Le type ne porte NI TITRE NI SLUG, et ce n'est pas un oubli : aucune de ces
 * pages ne choisit sa place. L'accueil est servi à la racine, les pages légales
 * à des adresses que le pied de page et la loi attendent, toutes définies dans
 * `src/i18n/routes.ts`. C'est l'IDENTIFIANT du document qui dit laquelle est
 * laquelle — d'où l'impossibilité d'en créer de nouvelles depuis le Studio
 * (voir `newDocumentOptions` dans `sanity.config.ts`).
 *
 * Le contenu, lui, reste entièrement modulaire : l'éditeur compose la page à
 * partir des blocs du page builder.
 *
 * Un document = une langue.
 */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    /*
      Composition figée : la succession des blocs d'une page relève de la mise
      en page, pas de l'édition. On modifie ce que chaque bloc dit, jamais quels
      blocs il y a ni dans quel ordre.
    */
    definePageBuilder({ group: 'content', locked: true }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: {
    select: { id: '_id', language: 'language' },
    prepare: ({ id, language }) => {
      const legal = typeof id === 'string' ? legalPageFromId(id) : null;

      return {
        title: legal ? LEGAL_TITLES[legal.key] : 'Page d’accueil',
        subtitle: language?.toUpperCase() ?? '—',
      };
    },
  },
});

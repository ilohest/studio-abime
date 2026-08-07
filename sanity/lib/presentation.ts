import { defineDocuments, defineLocations } from 'sanity/presentation';
import type { PresentationPluginOptions } from 'sanity/presentation';
import { defaultLocale, isLocale, locales } from '../../src/i18n/config';
import { getSegment, localizedPath, pagePath, projectPath, projectsIndexPath } from '../../src/i18n/routes';

/**
 * Câblage du Presentation Tool ↔ routes du site.
 *
 * Deux sens à couvrir :
 *  - DOCUMENT → URL (`locations`) : depuis un document, savoir où il s'affiche.
 *  - URL → DOCUMENT (`mainDocuments`) : en naviguant dans l'aperçu, ouvrir
 *    automatiquement le bon document dans le volet d'édition.
 *
 * Les URLs sont construites avec les MÊMES helpers que le site : impossible
 * que le back-office et le front divergent sur la forme des routes.
 */

type Selected = { slug?: string; title?: string; language?: string };

const toLocale = (language?: string) => (isLocale(language) ? language : defaultLocale);

const locations: PresentationPluginOptions['resolve'] = {
  locations: {
    page: defineLocations({
      select: { title: 'title', slug: 'slug.current', language: 'language' },
      resolve: (doc: Selected | null) => {
        if (!doc?.slug) return null;
        const locale = toLocale(doc.language);
        return {
          locations: [
            { title: doc.title || 'Page', href: pagePath(locale, doc.slug) },
            { title: 'Accueil', href: localizedPath(locale) },
          ],
        };
      },
    }),

    project: defineLocations({
      select: { title: 'title', slug: 'slug.current', language: 'language' },
      resolve: (doc: Selected | null) => {
        if (!doc?.slug) return null;
        const locale = toLocale(doc.language);
        return {
          locations: [
            { title: doc.title || 'Projet', href: projectPath(locale, doc.slug) },
            { title: 'Tous les projets', href: projectsIndexPath(locale) },
          ],
        };
      },
    }),

    category: defineLocations({
      select: { title: 'title', language: 'language' },
      resolve: (doc: Selected | null) => ({
        locations: [{ title: 'Portfolio', href: projectsIndexPath(toLocale(doc?.language)) }],
      }),
    }),

    localizedSettings: defineLocations({
      select: { language: 'language' },
      resolve: (doc: Selected | null) => ({
        locations: [{ title: 'Accueil', href: localizedPath(toLocale(doc?.language)) }],
      }),
    }),
  },

  /**
   * Correspondance URL → document, déclinée pour chaque langue active.
   * Le préfixe de langue n'existe que pour les langues non racines.
   */
  mainDocuments: defineDocuments(
    locales.flatMap((locale) => {
      const prefix = localizedPath(locale) === '/' ? '' : `/${locale}`;
      const projects = getSegment('projects', locale);

      return [
        {
          route: `${prefix}/${projects}/:slug`,
          filter: `_type == "project" && slug.current == $slug && language == $language`,
          params: { language: locale },
        },
        {
          route: `${prefix}/:slug`,
          filter: `_type == "page" && slug.current == $slug && language == $language`,
          params: { language: locale },
        },
        {
          route: prefix || '/',
          filter: `_type == "localizedSettings" && language == $language`,
          params: { language: locale },
        },
      ];
    }),
  ),
};

export const resolvePresentationLocations = locations;

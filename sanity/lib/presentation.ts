import { defineDocuments, defineLocations } from 'sanity/presentation';
import type { PresentationPluginOptions } from 'sanity/presentation';
import { defaultLocale, isLocale, locales } from '../../src/i18n/config';
import {
  contactPath,
  getSegment,
  journalIndexPath,
  shopIndexPath,
  laboPath,
  legalPageFromId,
  legalPagePath,
  localizedPath,
  postPath,
  projectPath,
  projectsIndexPath,
} from '../../src/i18n/routes';

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

type Selected = { _id?: string; slug?: string; title?: string; language?: string };

const toLocale = (language?: string) => (isLocale(language) ? language : defaultLocale);

const locations: PresentationPluginOptions['resolve'] = {
  locations: {
    /*
      Une `page` n'a ni titre ni slug : c'est son identifiant qui dit où elle
      s'affiche — une des trois pages légales, ou l'accueil servi à la racine.
    */
    page: defineLocations({
      select: { _id: '_id', language: 'language' },
      resolve: (doc: Selected | null) => {
        const locale = toLocale(doc?.language);
        const legal = doc?._id ? legalPageFromId(doc._id) : null;

        return {
          locations: legal
            ? [{ title: 'Informations légales', href: legalPagePath(legal.locale, legal.key) }]
            : [{ title: 'Accueil', href: localizedPath(locale) }],
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
            { title: 'Toutes les expériences', href: projectsIndexPath(locale) },
          ],
        };
      },
    }),

    post: defineLocations({
      select: { title: 'title', slug: 'slug.current', language: 'language' },
      resolve: (doc: Selected | null) => {
        if (!doc?.slug) return null;
        const locale = toLocale(doc.language);
        return {
          locations: [
            { title: doc.title || 'Article', href: postPath(locale, doc.slug) },
            { title: 'Tout le Journal', href: journalIndexPath(locale) },
          ],
        };
      },
    }),

    journalPage: defineLocations({
      select: { language: 'language' },
      resolve: (doc: Selected | null) => ({
        locations: [{ title: 'Page Journal', href: journalIndexPath(toLocale(doc?.language)) }],
      }),
    }),

    shopPage: defineLocations({
      select: { language: 'language' },
      resolve: (doc: Selected | null) => ({
        locations: [{ title: 'Page Shop', href: shopIndexPath(toLocale(doc?.language)) }],
      }),
    }),

    projectsPage: defineLocations({
      select: { language: 'language' },
      resolve: (doc: Selected | null) => ({
        locations: [{ title: 'Page Expériences', href: projectsIndexPath(toLocale(doc?.language)) }],
      }),
    }),

    laboPage: defineLocations({
      select: { language: 'language' },
      resolve: (doc: Selected | null) => ({
        locations: [{ title: 'Page Labo', href: laboPath(toLocale(doc?.language)) }],
      }),
    }),

    contactPage: defineLocations({
      select: { language: 'language' },
      resolve: (doc: Selected | null) => ({
        locations: [{ title: 'Page Contact', href: contactPath(toLocale(doc?.language)) }],
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
      const labo = getSegment('labo', locale);
      const journal = getSegment('journal', locale);
      const shop = getSegment('shop', locale);
      const contact = getSegment('contact', locale);

      return [
        {
          route: `${prefix}/${journal}`,
          filter: `_type == "journalPage" && language == $language`,
          params: { language: locale },
        },
        {
          route: `${prefix}/${shop}`,
          filter: `_type == "shopPage" && language == $language`,
          params: { language: locale },
        },
        {
          route: `${prefix}/${journal}/:slug`,
          filter: `_type == "post" && slug.current == $slug && language == $language`,
          params: { language: locale },
        },
        {
          route: `${prefix}/${labo}`,
          filter: `_type == "laboPage" && language == $language`,
          params: { language: locale },
        },
        {
          route: `${prefix}/${projects}`,
          filter: `_type == "projectsPage" && language == $language`,
          params: { language: locale },
        },
        {
          route: `${prefix}/${projects}/:slug`,
          filter: `_type == "project" && slug.current == $slug && language == $language`,
          params: { language: locale },
        },
        /*
          Avant la route attrape-tout `:slug` : sans quoi `/contact` serait
          cherché parmi les documents `page`, où il n'existe pas — la page
          d'aperçu s'ouvrirait sans rien à éditer.
        */
        {
          route: `${prefix}/${contact}`,
          // `coalesce` pour la même raison que dans `contactPageQuery` : un
          // document né sans langue doit rester joignable.
          filter: `_type == "contactPage" && coalesce(language, $language) == $language`,
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

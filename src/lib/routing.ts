/**
 * Résolution des routes : c'est ici que le contenu Sanity devient des URLs.
 *
 * Un seul fichier de page Astro (`src/pages/[...path].astro`) sert tout le site.
 * Il délègue à ce module :
 *   - `buildRouteManifest()` → alimente `getStaticPaths()` au build ;
 *   - `matchRoute()`         → identifie quoi rendre pour un chemin donné (SSR/preview).
 *
 * Conséquence : ajouter une langue ou renommer un segment de section ne demande
 * aucune modification de l'arborescence `src/pages/`.
 */
import { defaultLocale, isLocale, locales, prefixDefaultLocale, type Locale } from '~/i18n/config';
import {
  collectionPath,
  contactPath,
  getCollectionsSegment,
  getOrderConfirmationSegment,
  getSegment,
  journalIndexPath,
  laboPath,
  localizedPath,
  orderConfirmationPath,
  pagePath,
  postPath,
  productPath,
  projectPath,
  projectsIndexPath,
  shopIndexPath,
} from '~/i18n/routes';
import { getCollectionHandles, getProductHandles } from './shopify/catalogue';
import { loadQuery } from './sanity/loadQuery';
import { routeManifestQuery } from './sanity/queries';
import type { ResolvedLink, RouteEntry, SanityLink } from './sanity/types';

interface RouteManifestResponse {
  documents: Array<{ _type: 'page' | 'project' | 'post'; slug: string; language: Locale }>;
  homePages: Array<{ language: Locale; slug: string | null }>;
}

/**
 * Construit la liste exhaustive des routes du site.
 * Retourne des entrées typées : la page Astro n'a plus qu'à switcher sur `kind`.
 */
export async function buildRouteManifest(): Promise<RouteEntry[]> {
  const data = await loadQuery<RouteManifestResponse>({
    query: routeManifestQuery,
    fallback: { documents: [], homePages: [] },
  });

  const homeSlugByLocale = new Map<string, string | null>(
    data.homePages.map((entry) => [entry.language, entry.slug]),
  );

  const routes: RouteEntry[] = [];

  for (const locale of locales) {
    // Accueil + index portfolio existent pour chaque langue active.
    routes.push({ kind: 'home', locale, path: localizedPath(locale) });
    routes.push({ kind: 'labo', locale, path: laboPath(locale) });
    routes.push({ kind: 'contact', locale, path: contactPath(locale) });
    routes.push({ kind: 'journal', locale, path: journalIndexPath(locale) });
    routes.push({ kind: 'projectIndex', locale, path: projectsIndexPath(locale) });
    routes.push({ kind: 'shop', locale, path: shopIndexPath(locale) });
    routes.push({ kind: 'orderConfirmation', locale, path: orderConfirmationPath(locale) });
  }

  /*
    Fiches de tirages. Le catalogue vit chez Shopify, pas dans Sanity : on
    interroge donc une seconde source. Si la boutique n'est pas configurée ou
    ne répond pas, `getProductHandles()` renvoie une liste vide et le site se
    construit sans sa boutique — jamais avec une erreur.
  */
  const handles = await getProductHandles();
  for (const locale of locales) {
    for (const handle of handles) {
      routes.push({
        kind: 'product',
        locale,
        path: productPath(locale, handle),
        handle,
      });
    }
  }

  const collectionHandles = await getCollectionHandles();
  for (const locale of locales) {
    for (const handle of collectionHandles) {
      routes.push({
        kind: 'collection',
        locale,
        path: collectionPath(locale, handle),
        handle,
      });
    }
  }

  for (const doc of data.documents) {
    // Un document dont la langue n'est pas (encore) activée est ignoré :
    // le contenu peut être préparé en amont sans fuiter en production.
    if (!isLocale(doc.language)) continue;

    if (doc._type === 'project') {
      routes.push({
        kind: 'project',
        locale: doc.language,
        path: projectPath(doc.language, doc.slug),
        slug: doc.slug,
      });
      continue;
    }

    if (doc._type === 'post') {
      routes.push({
        kind: 'post',
        locale: doc.language,
        path: postPath(doc.language, doc.slug),
        slug: doc.slug,
      });
      continue;
    }

    // La page d'accueil est déjà servie à la racine : pas de doublon d'URL.
    if (homeSlugByLocale.get(doc.language) === doc.slug) continue;

    routes.push({
      kind: 'page',
      locale: doc.language,
      path: pagePath(doc.language, doc.slug),
      slug: doc.slug,
    });
  }

  return routes;
}

/**
 * Analyse un chemin d'URL et détermine quoi rendre, sans interroger Sanity.
 * Utilisé en rendu à la demande (mode édition visuelle), où `getStaticPaths()`
 * ne s'exécute pas.
 */
export function matchRoute(pathParam: string | undefined): RouteEntry | null {
  const segments = (pathParam ?? '').split('/').filter(Boolean);

  // 1. Extraction du préfixe de langue.
  let locale: Locale = defaultLocale;
  let rest = segments;

  if (segments.length > 0 && isLocale(segments[0])) {
    locale = segments[0];
    rest = segments.slice(1);
  } else if (prefixDefaultLocale) {
    // Toutes les langues doivent être préfixées : un chemin sans préfixe est invalide.
    return null;
  }

  const path = localizedPath(locale, ...rest);

  // 2. Accueil.
  if (rest.length === 0) {
    return { kind: 'home', locale, path };
  }

  // 3. Page Labo (segment traduit par langue).
  const laboSegment = getSegment('labo', locale);
  if (rest[0] === laboSegment) {
    return rest.length === 1 ? { kind: 'labo', locale, path } : null;
  }

  // 4. Journal : index éditorial + article. Même forme que la section portfolio.
  const journalSegment = getSegment('journal', locale);
  if (rest[0] === journalSegment) {
    if (rest.length === 1) return { kind: 'journal', locale, path };
    if (rest.length === 2) return { kind: 'post', locale, path, slug: rest[1]! };
    return null;
  }

  // 5. Contact : expérience dédiée, indépendante du page builder.
  const contactSegment = getSegment('contact', locale);
  if (rest[0] === contactSegment) {
    return rest.length === 1 ? { kind: 'contact', locale, path } : null;
  }

  // 6. Section portfolio (segment traduit par langue).
  const projectsSegment = getSegment('projects', locale);
  if (rest[0] === projectsSegment) {
    if (rest.length === 1) return { kind: 'projectIndex', locale, path };
    if (rest.length === 2) return { kind: 'project', locale, path, slug: rest[1]! };
    return null;
  }

  // 7. Boutique : index, page de confirmation, collections, puis fiche de tirage.
  const shopSegment = getSegment('shop', locale);
  if (rest[0] === shopSegment) {
    if (rest.length === 1) return { kind: 'shop', locale, path };
    if (rest.length === 2 && rest[1] === getOrderConfirmationSegment(locale)) {
      return { kind: 'orderConfirmation', locale, path };
    }
    if (rest.length === 3 && rest[1] === getCollectionsSegment(locale)) {
      return { kind: 'collection', locale, path, handle: rest[2]! };
    }
    // « confirmation » et « collections » sont des mots réservés sous /shop :
    // aucun tirage ne peut porter ces handles.
    if (rest.length === 2) return { kind: 'product', locale, path, handle: rest[1]! };
    return null;
  }

  // 8. Tout le reste est une page institutionnelle. Le slug peut être imbriqué
  //    (`agence/equipe`) : on le reconstruit tel quel.
  return { kind: 'page', locale, path, slug: rest.join('/') };
}

/**
 * Convertit un lien Sanity en lien prêt à rendre.
 *
 * La référence prime sur l'URL : le CMS ne propose plus que des pages du site,
 * et une destination fraîchement choisie doit donc l'emporter sur l'éventuelle
 * URL héritée du temps où les deux formes coexistaient.
 */
export function resolveLink(link: SanityLink | undefined | null, locale: Locale): ResolvedLink | null {
  if (!link) return null;

  const target = link.internal;

  if (target) {
    // La langue du document cible prime : un lien peut pointer vers une autre langue.
    const targetLocale = isLocale(target.language) ? target.language : locale;

    /*
      Les pages Expériences et Journal n'ont pas de slug : leur URL est une
      route calculée par langue (`/experiences`, `/en/work`, `/journal`). Les
      autres cibles passent par leur slug.
    */
    const href =
      target._type === 'projectsPage'
        ? projectsIndexPath(targetLocale)
        : target._type === 'journalPage'
          ? journalIndexPath(targetLocale)
        : target.slug
          ? target._type === 'project'
            ? projectPath(targetLocale, target.slug)
            : target._type === 'post'
              ? postPath(targetLocale, target.slug)
              : pagePath(targetLocale, target.slug)
          : null;

    if (href) {
      return {
        label: link.label ?? target.title ?? '',
        href,
        isExternal: false,
        openInNewTab: link.openInNewTab ?? false,
      };
    }
  }

  // Lien externe hérité : conservé au rendu tant qu'il n'a pas été rebasculé.
  if (!link.externalUrl) return null;
  return {
    label: link.label ?? link.externalUrl,
    href: link.externalUrl,
    isExternal: /^https?:\/\//.test(link.externalUrl),
    openInNewTab: link.openInNewTab ?? true,
  };
}

/** URL absolue — nécessaire pour les balises canoniques, Open Graph et le sitemap. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  if (!site) return path;
  return new URL(path, site).toString();
}

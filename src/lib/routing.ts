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
import { getSegment, localizedPath, pagePath, projectPath, projectsIndexPath } from '~/i18n/routes';
import { loadQuery } from './sanity/loadQuery';
import { routeManifestQuery } from './sanity/queries';
import type { ResolvedLink, RouteEntry, SanityLink } from './sanity/types';

interface RouteManifestResponse {
  documents: Array<{ _type: 'page' | 'project'; slug: string; language: Locale }>;
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
    routes.push({ kind: 'projectIndex', locale, path: projectsIndexPath(locale) });
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

  // 3. Section portfolio (segment traduit par langue).
  const projectsSegment = getSegment('projects', locale);
  if (rest[0] === projectsSegment) {
    if (rest.length === 1) return { kind: 'projectIndex', locale, path };
    if (rest.length === 2) return { kind: 'project', locale, path, slug: rest[1]! };
    return null;
  }

  // 4. Tout le reste est une page institutionnelle. Le slug peut être imbriqué
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
      La page Projets n'a pas de slug : son URL est une route calculée par
      langue (`/projets`, `/en/work`). Les autres cibles passent par leur slug.
    */
    const href =
      target._type === 'projectsPage'
        ? projectsIndexPath(targetLocale)
        : target.slug
          ? target._type === 'project'
            ? projectPath(targetLocale, target.slug)
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

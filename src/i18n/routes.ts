/**
 * Segments d'URL traduits + construction des chemins localisés.
 *
 * Les segments de section (ex. l'index portfolio) sont traduits par langue afin
 * que chaque marché ait des URLs naturelles et indexables :
 *   FR → /experiences/nom-du-projet
 *   EN → /en/work/project-name
 */
import { defaultLocale, prefixDefaultLocale, type Locale } from './config';

/** Segments réservés par section. Pré-remplis pour les langues à venir. */
export const routeSegments = {
  projects: { fr: 'experiences', en: 'work', nl: 'werk', de: 'arbeiten' },
  labo: { fr: 'labo', en: 'lab', nl: 'lab', de: 'labor' },
  contact: { fr: 'contact', en: 'contact', nl: 'contact', de: 'kontakt' },
} satisfies Record<string, Record<string, string>>;

export type RouteKey = keyof typeof routeSegments;

/** Segment d'URL d'une section pour une langue donnée (fallback : langue par défaut). */
export function getSegment(key: RouteKey, locale: Locale): string {
  const map: Record<string, string> = routeSegments[key];
  return map[locale] ?? map[defaultLocale]!;
}

/** Tous les segments réservés d'une langue — sert à empêcher les collisions de slug. */
export function getReservedSegments(locale: Locale): string[] {
  return (Object.keys(routeSegments) as RouteKey[]).map((key) => getSegment(key, locale));
}

/**
 * Construit un chemin absolu localisé.
 * `localizedPath('fr', 'experiences', 'abime')` → `/experiences/abime`
 * `localizedPath('en', 'work', 'abime')`    → `/en/work/abime`
 */
export function localizedPath(locale: Locale, ...segments: (string | undefined | null)[]): string {
  const needsPrefix = prefixDefaultLocale || locale !== defaultLocale;
  const parts = [
    ...(needsPrefix ? [locale] : []),
    ...segments.filter((segment): segment is string => Boolean(segment)),
  ].flatMap((part) => part.split('/').filter(Boolean));

  return parts.length ? `/${parts.join('/')}` : '/';
}

/** URL de l'index portfolio pour une langue. */
export function projectsIndexPath(locale: Locale): string {
  return localizedPath(locale, getSegment('projects', locale));
}

/** URL de la page Labo, route éditoriale structurée et localisée. */
export function laboPath(locale: Locale): string {
  return localizedPath(locale, getSegment('labo', locale));
}

/** URL de la page Contact, expérience dédiée et localisée. */
export function contactPath(locale: Locale): string {
  return localizedPath(locale, getSegment('contact', locale));
}

/** URL d'un projet. */
export function projectPath(locale: Locale, slug: string): string {
  return localizedPath(locale, getSegment('projects', locale), slug);
}

/** URL d'une page institutionnelle (le slug peut être imbriqué : `agence/equipe`). */
export function pagePath(locale: Locale, slug: string): string {
  return localizedPath(locale, slug);
}

/** Découpe un chemin d'URL en segments propres, sans le préfixe de langue. */
export function splitPath(path: string | undefined): string[] {
  return (path ?? '').split('/').filter(Boolean);
}

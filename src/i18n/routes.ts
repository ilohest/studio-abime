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
  journal: { fr: 'journal', en: 'journal', nl: 'journaal', de: 'journal' },
  contact: { fr: 'contact', en: 'contact', nl: 'contact', de: 'kontakt' },
  shop: { fr: 'shop', en: 'shop', nl: 'winkel', de: 'shop' },
} satisfies Record<string, Record<string, string>>;

export type RouteKey = keyof typeof routeSegments;

/**
 * Segment de la page de confirmation de commande, nichée sous la boutique
 * (`/shop/confirmation`). Pas dans `routeSegments` : ce n'est pas une section
 * de premier niveau, seulement un mot réservé sous `/shop`.
 */
const orderConfirmationSegments = {
  fr: 'confirmation',
  en: 'confirmation',
  nl: 'bevestiging',
  de: 'bestätigung',
} satisfies Record<string, string>;

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

/** URL de l'index du Journal pour une langue. */
export function journalIndexPath(locale: Locale): string {
  return localizedPath(locale, getSegment('journal', locale));
}

/** URL d'un article du Journal. */
export function postPath(locale: Locale, slug: string): string {
  return localizedPath(locale, getSegment('journal', locale), slug);
}

/** URL de la page Contact, expérience dédiée et localisée. */
export function contactPath(locale: Locale): string {
  return localizedPath(locale, getSegment('contact', locale));
}

/** URL d'un projet. */
export function projectPath(locale: Locale, slug: string): string {
  return localizedPath(locale, getSegment('projects', locale), slug);
}

/** URL de l'index de la boutique. */
export function shopIndexPath(locale: Locale): string {
  return localizedPath(locale, getSegment('shop', locale));
}

/** Segment (non préfixé) de la page de confirmation, pour la reconnaître dans `matchRoute`. */
export function getOrderConfirmationSegment(locale: Locale): string {
  return orderConfirmationSegments[locale] ?? orderConfirmationSegments[defaultLocale as 'fr'];
}

/**
 * URL de la page de confirmation de commande.
 *
 * Elle ne reçoit jamais de visite directe au clic : Shopify y redirige depuis
 * sa page de remerciement hébergée, avec le numéro de commande en paramètre
 * d'URL (voir le script à coller dans Settings → Checkout → Order status page).
 */
export function orderConfirmationPath(locale: Locale): string {
  return localizedPath(locale, getSegment('shop', locale), getOrderConfirmationSegment(locale));
}

/**
 * URL d'un tirage.
 * Le `handle` vient de Shopify : c'est lui qui fait foi, pas un slug recopié
 * ailleurs. Le renommer dans l'admin change l'URL — Shopify conserve alors une
 * redirection de son côté, mais pas nous : penser à la traiter le jour venu.
 */
export function productPath(locale: Locale, handle: string): string {
  return localizedPath(locale, getSegment('shop', locale), handle);
}

/**
 * Segment des pages de collection — repris tel quel du Shopify classique
 * (`/collections/{handle}`), pour que l'URL reste familière à quiconque a déjà
 * navigué une boutique Shopify.
 */
const collectionsSegments = {
  fr: 'collections',
  en: 'collections',
  nl: 'collecties',
  de: 'kollektionen',
} satisfies Record<string, string>;

export function getCollectionsSegment(locale: Locale): string {
  return collectionsSegments[locale] ?? collectionsSegments[defaultLocale as 'fr'];
}

/** URL d'une collection : `/shop/collections/{handle}`. */
export function collectionPath(locale: Locale, handle: string): string {
  return localizedPath(locale, getSegment('shop', locale), getCollectionsSegment(locale), handle);
}

/** URL d'une page institutionnelle (le slug peut être imbriqué : `agence/equipe`). */
export function pagePath(locale: Locale, slug: string): string {
  return localizedPath(locale, slug);
}

/** Découpe un chemin d'URL en segments propres, sans le préfixe de langue. */
export function splitPath(path: string | undefined): string[] {
  return (path ?? '').split('/').filter(Boolean);
}

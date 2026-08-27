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

/**
 * Politiques de boutique, servies à la racine du site.
 *
 * Elles sont à la racine et non sous `/shop` parce qu'un lien de pied de page
 * vers « /cgv » se lit et se partage mieux que vers « /shop/cgv » — et parce
 * que ces textes engagent le studio, pas seulement sa boutique.
 *
 * Leur contenu vient de l'admin Shopify (voir `src/lib/shopify/policies.ts`) :
 * c'est lui qui s'affiche aussi dans le tunnel de paiement, donc une seule
 * saisie pour deux affichages. Les mentions légales, la confidentialité et les
 * cookies suivent le chemin inverse : ils vivent dans Sanity, comme des pages
 * ordinaires, car ils décrivent l'entreprise et pas la transaction.
 */
const policySegments = {
  terms: { fr: 'cgv', en: 'terms', nl: 'algemene-voorwaarden', de: 'agb' },
  shipping: { fr: 'livraison', en: 'shipping', nl: 'verzending', de: 'versand' },
  refund: { fr: 'retours', en: 'returns', nl: 'retourneren', de: 'ruecknahme' },
} satisfies Record<string, Record<string, string>>;

export type PolicyRouteKey = keyof typeof policySegments;

export const policyRouteKeys = Object.keys(policySegments) as PolicyRouteKey[];

/** Segment d'URL d'une section pour une langue donnée (fallback : langue par défaut). */
export function getSegment(key: RouteKey, locale: Locale): string {
  const map: Record<string, string> = routeSegments[key];
  return map[locale] ?? map[defaultLocale]!;
}

/** Segment d'URL d'une politique de boutique pour une langue donnée. */
export function getPolicySegment(key: PolicyRouteKey, locale: Locale): string {
  const map: Record<string, string> = policySegments[key];
  return map[locale] ?? map[defaultLocale]!;
}

/** URL d'une politique de boutique : `/cgv`, `/livraison`, `/retours`. */
export function policyPath(locale: Locale, key: PolicyRouteKey): string {
  return localizedPath(locale, getPolicySegment(key, locale));
}

/** Retrouve la politique correspondant à un segment, ou `null`. */
export function matchPolicySegment(segment: string, locale: Locale): PolicyRouteKey | null {
  return policyRouteKeys.find((key) => getPolicySegment(key, locale) === segment) ?? null;
}

/**
 * Tous les segments réservés d'une langue — sert à empêcher les collisions de slug.
 * Les politiques en font partie : « cgv » est une route de code, une page Sanity
 * portant ce slug ne serait jamais servie.
 */
export function getReservedSegments(locale: Locale): string[] {
  return [
    ...(Object.keys(routeSegments) as RouteKey[]).map((key) => getSegment(key, locale)),
    ...policyRouteKeys.map((key) => getPolicySegment(key, locale)),
  ];
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

/**
 * Pages légales portées par Sanity.
 *
 * Ce sont des pages institutionnelles ordinaires — elles passent par le page
 * builder comme n'importe quelle autre. On fige seulement leur slug ici, pour
 * que le pied de page sache où les trouver sans qu'un éditeur ait à recréer le
 * lien à la main. Renommer le slug dans le Studio détacherait le lien : c'est
 * le prix d'une convention, et il est plus faible que celui d'un lien à
 * maintenir dans le CMS.
 *
 * Ces trois textes décrivent l'entreprise, pas la transaction : c'est ce qui
 * les distingue des politiques de boutique (`policySegments`), rédigées chez
 * Shopify parce qu'elles s'affichent aussi dans le tunnel de paiement.
 */
const legalPageSlugs = {
  notice: { fr: 'mentions-legales', en: 'legal-notice', nl: 'juridische-vermeldingen', de: 'impressum' },
  privacy: { fr: 'confidentialite', en: 'privacy', nl: 'privacy', de: 'datenschutz' },
  cookies: { fr: 'cookies', en: 'cookies', nl: 'cookies', de: 'cookies' },
} satisfies Record<string, Record<string, string>>;

export type LegalPageKey = keyof typeof legalPageSlugs;

export const legalPageKeys = Object.keys(legalPageSlugs) as LegalPageKey[];

/** Slug attendu d'une page légale pour une langue donnée. */
export function getLegalPageSlug(key: LegalPageKey, locale: Locale): string {
  const map: Record<string, string> = legalPageSlugs[key];
  return map[locale] ?? map[defaultLocale]!;
}

/** URL d'une page légale : `/mentions-legales`, `/confidentialite`, `/cookies`. */
export function legalPagePath(locale: Locale, key: LegalPageKey): string {
  return localizedPath(locale, getLegalPageSlug(key, locale));
}

/** URL d'une page institutionnelle (le slug peut être imbriqué : `agence/equipe`). */
export function pagePath(locale: Locale, slug: string): string {
  return localizedPath(locale, slug);
}

/** Découpe un chemin d'URL en segments propres, sans le préfixe de langue. */
export function splitPath(path: string | undefined): string[] {
  return (path ?? '').split('/').filter(Boolean);
}

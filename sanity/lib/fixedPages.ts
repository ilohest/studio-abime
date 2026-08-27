import { locales } from '../../src/i18n/config';
import { legalPageKeys } from '../../src/i18n/routes';

/**
 * Identifiant figé du document de page d'accueil, par langue.
 *
 * Le même identifiant est attendu à trois endroits : la structure du Studio
 * l'ouvre, `sanity/seed/build-home.mjs` le crée, et le schéma `page` s'en sert
 * pour masquer le slug. Ils doivent rester d'accord, d'où cette fonction.
 *
 * Jamais de point dans l'identifiant : Sanity traite tout `_id` qui en contient
 * comme un chemin privé — le même mécanisme que `drafts.`. Le document reste
 * visible dans le Studio, mais l'API publique le renvoie vide et la page
 * n'existe pas sur le site.
 */
export function homePageId(locale: string): string {
  return locale === 'fr' ? 'page-accueil-fr' : `page-home-${locale}`;
}

/*
  L'accueil n'a pas toujours l'identifiant figé ci-dessus : il est DÉSIGNÉ par
  référence depuis « Réglages localisés », et peut donc être n'importe quelle
  page. Or un champ ne peut pas se masquer sur la foi d'une requête — `hidden`
  est synchrone. La structure, elle, résout déjà ce lien pour ouvrir le bon
  document : elle dépose l'identifiant ici en passant, et le schéma le relit.
*/
const designated = new Set<string>();

/** Appelé par la structure, qui connaît la page désignée pour chaque langue. */
export function rememberHomePageId(id: string): void {
  designated.add(id);
}

/**
 * Vrai pour le document d'accueil d'une des langues actives, brouillon compris.
 *
 * Sert aux champs qui n'ont pas de sens sur l'accueil : celui-ci est servi à la
 * racine du site, il n'a donc pas d'URL propre et pas de slug.
 */
export function isHomePageId(id: string | undefined): boolean {
  if (!id) return false;
  const published = id.replace(/^drafts\./, '');
  return designated.has(published) || locales.some((locale) => homePageId(locale) === published);
}

/** Identifiants figés des pages légales (voir `scripts/seed-legal-pages.mjs`). */
const legalPageIds = new Set(
  locales.flatMap((locale) => legalPageKeys.map((key) => `page-legal-${key}-${locale}`)),
);

/**
 * Pages `page` posées à un emplacement FIGÉ : l'accueil, servi à la racine, et
 * les trois pages légales, ouvertes depuis leur entrée du back-office.
 *
 * Elles n'ont ni titre ni slug à choisir — leur place dans le site est décidée
 * en code. Les valeurs restent stockées (titre de document dans le Studio,
 * balise <title>, construction des routes), seuls les champs disparaissent.
 */
export function isFixedSlotPageId(id: string | undefined): boolean {
  if (!id) return false;
  return isHomePageId(id) || legalPageIds.has(id.replace(/^drafts\./, ''));
}

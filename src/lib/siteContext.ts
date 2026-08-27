import { loadQuery } from './sanity/loadQuery';
import { legalPagesQuery, localizedSettingsQuery, siteSettingsQuery } from './sanity/queries';
import { getShopPolicies } from './shopify/policies';
import type { LegalLink, LocalizedSettings, SiteContext, SiteSettings } from './sanity/types';
import {
  getLegalPageSlug,
  legalPageKeys,
  legalPagePath,
  policyPath,
} from '~/i18n/routes';
import { useTranslations } from '~/i18n/ui';
import type { Locale } from '~/i18n/config';

/**
 * Charge les données communes à toutes les pages (réglages globaux + localisés).
 *
 * Mémoïsé par langue pour la durée du process : au build, les centaines de pages
 * générées ne déclenchent qu'une seule paire de requêtes par langue.
 * Le cache est volontairement désactivé en mode édition visuelle, où l'on veut
 * toujours refléter le dernier état du brouillon.
 */
const cache = new Map<string, Promise<SiteContext>>();

export function getSiteContext(locale: Locale, options: { fresh?: boolean } = {}): Promise<SiteContext> {
  if (!options.fresh) {
    const cached = cache.get(locale);
    if (cached) return cached;
  }

  const promise = (async (): Promise<SiteContext> => {
    const [settings, localized, legalLinks] = await Promise.all([
      loadQuery<SiteSettings | null>({ query: siteSettingsQuery, locale, fallback: null }),
      loadQuery<LocalizedSettings | null>({ query: localizedSettingsQuery, locale, fallback: null }),
      getLegalLinks(locale),
    ]);

    return { locale, settings, localized, legalLinks };
  })();

  if (!options.fresh) cache.set(locale, promise);
  return promise;
}

/**
 * Liens d'informations légales du pied de page.
 *
 * Ils ne viennent pas du CMS mais du code, parce qu'ils ne relèvent pas du
 * choix éditorial : un site marchand DOIT les exposer, et les oublier est une
 * faute qu'aucune interface ne devrait permettre. Le pied de page les affiche
 * donc dès que les textes existent, sans qu'un éditeur ait à y penser.
 *
 * Deux origines, mises à plat en une seule liste :
 *   · Sanity  → mentions légales, confidentialité, cookies (l'entreprise) ;
 *   · Shopify → CGV, livraison, retours (la transaction).
 *
 * Dans les deux cas, un texte non rédigé ne produit pas de lien : mieux vaut un
 * pied de page incomplet qu'un lien qui mène à une page vide ou à un modèle
 * resté troué.
 */
async function getLegalLinks(locale: Locale): Promise<LegalLink[]> {
  const t = useTranslations(locale);

  const [existingSlugs, policies] = await Promise.all([
    loadQuery<string[]>({
      query: legalPagesQuery,
      params: { slugs: legalPageKeys.map((key) => getLegalPageSlug(key, locale)) },
      locale,
      fallback: [],
    }),
    getShopPolicies(),
  ]);

  const published = new Set(existingSlugs);

  const sanityLinks = legalPageKeys
    .filter((key) => published.has(getLegalPageSlug(key, locale)))
    .map((key) => ({
      label: t(`legal.${key}` as 'legal.notice'),
      href: legalPagePath(locale, key),
    }));

  const shopifyLinks = policies.map((policy) => ({
    label: t(`policy.${policy.key}` as 'policy.terms'),
    href: policyPath(locale, policy.key),
  }));

  return [...sanityLinks, ...shopifyLinks];
}

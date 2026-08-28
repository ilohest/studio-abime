import { loadQuery } from './sanity/loadQuery';
import { visualEditingEnabled } from './sanity/env';
import { legalPagesQuery, localizedSettingsQuery, siteSettingsQuery } from './sanity/queries';
import { getShopPolicies } from './shopify/policies';
import type { LegalLink, LocalizedSettings, SiteContext, SiteSettings } from './sanity/types';
import { legalPageId, legalPageKeys, legalPagePath, policyPath } from '~/i18n/routes';
import { useTranslations } from '~/i18n/ui';
import type { Locale } from '~/i18n/config';

/**
 * Charge les données communes à toutes les pages (réglages globaux + localisés).
 *
 * Mémoïsé par langue pour la durée du process : au build, les centaines de pages
 * générées ne déclenchent qu'une seule paire de requêtes par langue.
 *
 * ── Pourquoi le cache s'arrête aux processus de build ───────────────────────
 * Un build vit quelques secondes : y garder les réglages en mémoire est sans
 * risque, et c'est même ce qui rend le rendu de chaque page gratuit — voir
 * `PortableText.astro`, qui appelle cette fonction pour résoudre les renvois
 * vers la fiche d'entreprise.
 *
 * Un serveur de développement, lui, vit des heures. Le même cache y fige les
 * réglages au tout premier rendu : on modifie l'adresse du studio dans le
 * Studio, on recharge la page, et rien ne bouge — la valeur d'avant est servie
 * jusqu'au redémarrage. Le symptôme est déroutant au possible, parce que le
 * contenu des pages, lui, se rafraîchit normalement : seuls les réglages
 * restent en arrière.
 *
 * Le cache est donc éteint en développement et en édition visuelle, les deux
 * situations où quelqu'un regarde le site pendant qu'il le modifie.
 */
const cache = new Map<string, Promise<SiteContext>>();

/*
  Le rendu à la demande sert chaque visite : sans cache, chaque page ferait
  deux requêtes de plus. Le cas ne se présente qu'en mode maintenance, où le
  site est fermé — mais autant ne pas le payer pour rien.
*/
const cacheEnabled = !import.meta.env.DEV && !visualEditingEnabled;

export function getSiteContext(locale: Locale, options: { fresh?: boolean } = {}): Promise<SiteContext> {
  const useCache = cacheEnabled && !options.fresh;

  if (useCache) {
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

  if (useCache) cache.set(locale, promise);
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

  const [existingIds, policies] = await Promise.all([
    loadQuery<string[]>({
      query: legalPagesQuery,
      params: { ids: legalPageKeys.map((key) => legalPageId(key, locale)) },
      locale,
      fallback: [],
    }),
    getShopPolicies(),
  ]);

  const published = new Set(existingIds);

  const sanityLinks = legalPageKeys
    .filter((key) => published.has(legalPageId(key, locale)))
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

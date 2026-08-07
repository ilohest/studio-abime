import { loadQuery } from './sanity/loadQuery';
import { localizedSettingsQuery, siteSettingsQuery } from './sanity/queries';
import type { LocalizedSettings, SiteContext, SiteSettings } from './sanity/types';
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
    const [settings, localized] = await Promise.all([
      loadQuery<SiteSettings | null>({ query: siteSettingsQuery, locale, fallback: null }),
      loadQuery<LocalizedSettings | null>({ query: localizedSettingsQuery, locale, fallback: null }),
    ]);

    return { locale, settings, localized };
  })();

  if (!options.fresh) cache.set(locale, promise);
  return promise;
}

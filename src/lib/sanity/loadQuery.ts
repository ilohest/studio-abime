import { sanityClient } from './client';
import { defaultLocale, type Locale } from '~/i18n/config';

export type QueryParams = Record<string, unknown>;

/**
 * Point d'entrée UNIQUE pour interroger Sanity.
 *
 * Tout passe par ici afin de garantir que :
 *  - chaque requête reçoit `$locale` et `$defaultLocale` (fallback de contenu) ;
 *  - le mode brouillon / stega est appliqué de façon homogène ;
 *  - une erreur réseau ne fait pas tomber la page entière en production.
 */
export async function loadQuery<T>(options: {
  query: string;
  params?: QueryParams;
  locale?: Locale;
  /** Valeur retournée si la requête échoue (évite de casser le build sur un incident réseau). */
  fallback?: T;
}): Promise<T> {
  const { query, params = {}, locale = defaultLocale, fallback } = options;

  try {
    return await sanityClient.fetch<T>(query, {
      locale,
      defaultLocale,
      ...params,
    });
  } catch (error) {
    if (fallback !== undefined) {
      console.error('[sanity] Échec de la requête, utilisation du fallback :', error);
      return fallback;
    }
    throw error;
  }
}

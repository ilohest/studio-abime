import {
  apiVersion,
  missingConfigMessage,
  shopifyConfigured,
  storeDomain,
  storefrontEndpoint,
  storefrontToken,
} from './env';

/**
 * Point d'entrée UNIQUE pour interroger l'API Storefront de Shopify.
 *
 * Même rôle que `loadQuery` côté Sanity : tout passe par ici afin que la gestion
 * des erreurs, des en-têtes et du repli soit identique partout.
 *
 * Deux natures d'erreur coexistent en GraphQL et méritent des traitements
 * distincts :
 *  - l'erreur de transport (réseau, 401, 5xx) → la réponse HTTP n'est pas `ok` ;
 *  - l'erreur GraphQL (champ inconnu, variable invalide) → HTTP 200 avec un
 *    tableau `errors`. C'est le piège classique : sans cette vérification, une
 *    requête cassée renvoie silencieusement `undefined` et la page s'affiche vide.
 */

export interface ShopifyFetchOptions<T> {
  query: string;
  variables?: Record<string, unknown>;
  /** Valeur retournée si l'appel échoue, plutôt que de casser le build. */
  fallback?: T;
  /**
   * `no-store` pour les données qui doivent être fraîches (stock, panier).
   * Par défaut, le cache natif de `fetch` est laissé libre.
   */
  cache?: RequestCache;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: Array<string | number> }>;
}

export async function shopifyFetch<T>(options: ShopifyFetchOptions<T>): Promise<T> {
  const { query, variables = {}, fallback, cache } = options;

  if (!shopifyConfigured) {
    return handleFailure(new Error(missingConfigMessage), fallback);
  }

  try {
    const response = await fetch(storefrontEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
      ...(cache ? { cache } : {}),
    });

    if (!response.ok) {
      // 401/403 = jeton invalide ou portées manquantes ; 404 = domaine erroné.
      const detail = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status} sur ${storeDomain} (API ${apiVersion}).` +
          (detail ? ` Réponse : ${detail.slice(0, 300)}` : ''),
      );
    }

    const payload = (await response.json()) as GraphQLResponse<T>;

    if (payload.errors?.length) {
      const messages = payload.errors
        .map((error) => (error.path ? `${error.path.join('.')} — ${error.message}` : error.message))
        .join(' | ');
      throw new Error(`Erreur GraphQL : ${messages}`);
    }

    if (payload.data === undefined) {
      throw new Error('Réponse sans données ni erreurs — requête probablement vide.');
    }

    return payload.data;
  } catch (error) {
    return handleFailure(error, fallback);
  }
}

/**
 * En production, une panne Shopify ne doit pas emporter le site entier : on
 * journalise et on rend une boutique vide. En développement, on lève l'erreur,
 * parce qu'une grille silencieusement vide est le pire retour possible quand on
 * est en train d'écrire la requête.
 */
function handleFailure<T>(error: unknown, fallback: T | undefined): T {
  if (fallback !== undefined) {
    console.error('[shopify] Échec de la requête, utilisation du repli :', error);
    return fallback;
  }
  throw error instanceof Error ? error : new Error(String(error));
}

export { shopifyConfigured, storeDomain, apiVersion };

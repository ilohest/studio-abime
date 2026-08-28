/**
 * Lecture centralisée des variables d'environnement Shopify.
 *
 * Différence volontaire avec `src/lib/sanity/env.ts` : ce module ne LÈVE PAS
 * d'erreur à l'import quand la configuration manque. Tant que la boutique
 * n'existe pas, le reste du site doit continuer à se construire normalement.
 * C'est `shopifyConfigured` qui porte l'information, et `client.ts` qui décide
 * quoi faire (échouer bruyamment en développement, se taire en production).
 */

/** Domaine technique `*.myshopify.com`, jamais le domaine public de la boutique. */
export const storeDomain = normalizeDomain(import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN ?? '');

/**
 * Jeton Storefront API — public par conception.
 *
 * L'API Storefront est prévue pour être appelée depuis le navigateur : c'est elle
 * qui alimente le panier et la vérification de stock en direct. Le jeton ne donne
 * accès qu'à la lecture du catalogue et à la manipulation de paniers ; il ne
 * permet ni de lire les commandes, ni de modifier la boutique.
 * À ne pas confondre avec un jeton Admin API, qui lui reste strictement serveur.
 */
export const storefrontToken = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? '';

/**
 * Version de l'API Storefront.
 *
 * Shopify publie une version par trimestre et en supporte chacune un an. On la
 * fige explicitement : une montée de version est une décision, jamais un effet
 * de bord d'un déploiement.
 */
export const apiVersion = import.meta.env.PUBLIC_SHOPIFY_API_VERSION || '2026-07';

/**
 * Le jeton porte-t-il la portée `unauthenticated_read_product_inventory` ?
 *
 * Elle conditionne la lecture du stock réel — donc l'affichage du nombre de
 * places ou d'exemplaires restants. Sans elle, l'API ne renvoie pas une valeur
 * vide : elle rejette TOUTE la requête qui ose demander `quantityAvailable`,
 * et la fiche entière disparaîtrait. D'où ce drapeau explicite plutôt qu'une
 * tentative suivie d'un rattrapage : on ne demande le stock que lorsqu'on sait
 * pouvoir le lire.
 *
 * À basculer sur « true » une fois la portée accordée à la vitrine dans le
 * canal Headless. `npm run shopify:families` dit à tout moment où on en est.
 */
export const inventoryScopeGranted =
  (import.meta.env.PUBLIC_SHOPIFY_INVENTORY_SCOPE ?? '').trim().toLowerCase() === 'true';

/** `true` quand la boutique est joignable : domaine et jeton renseignés. */
export const shopifyConfigured = Boolean(storeDomain && storefrontToken);

/** Point d'entrée GraphQL de la boutique. */
export const storefrontEndpoint = storeDomain
  ? `https://${storeDomain}/api/${apiVersion}/graphql.json`
  : '';

/**
 * Tolère qu'on colle l'URL complète depuis l'admin Shopify plutôt que le seul
 * domaine — l'erreur est fréquente et le message d'erreur qui en découle est
 * particulièrement opaque.
 */
function normalizeDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

/** Message unique, réutilisé partout où la configuration manque. */
export const missingConfigMessage =
  "[shopify] Configuration absente : renseignez PUBLIC_SHOPIFY_STORE_DOMAIN et " +
  "PUBLIC_SHOPIFY_STOREFRONT_TOKEN dans .env (voir .env.example).";

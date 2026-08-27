/**
 * Test de connexion à l'API Storefront de Shopify.
 *
 *   npm run shopify:check
 *
 * Autonome par choix : il lit `process.env` et ne dépend d'aucun module du site.
 * On veut pouvoir vérifier les identifiants sans lancer Astro, et surtout sans
 * qu'une erreur de configuration se confonde avec une erreur de build.
 *
 * Les variables sont chargées depuis `.env` par `node --env-file` (voir le
 * script npm), sans dépendance supplémentaire.
 */

const domain = (process.env.PUBLIC_SHOPIFY_STORE_DOMAIN ?? '')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');
const token = process.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? '';
const version = process.env.PUBLIC_SHOPIFY_API_VERSION || '2026-07';

const ok = (message) => console.log(`\x1b[32m✓\x1b[0m ${message}`);
const ko = (message) => console.error(`\x1b[31m✗\x1b[0m ${message}`);

if (!domain || !token) {
  ko('Configuration incomplète.');
  console.error(
    '\n  Renseignez dans .env :\n' +
      '    PUBLIC_SHOPIFY_STORE_DOMAIN   (ex. studio-abime-dev.myshopify.com)\n' +
      '    PUBLIC_SHOPIFY_STOREFRONT_TOKEN\n\n' +
      '  Le jeton se trouve dans Shopify → Settings → Apps and sales channels\n' +
      '  → Develop apps → votre app → API credentials.\n',
  );
  process.exit(1);
}

const endpoint = `https://${domain}/api/${version}/graphql.json`;

console.log(`\n  Boutique : ${domain}`);
console.log(`  API      : ${version}\n`);

const query = `
  query Check {
    shop {
      name
      primaryDomain { url }
      paymentSettings { currencyCode }
    }
    products(first: 5) {
      nodes { handle title availableForSale }
    }
    collections(first: 5) {
      nodes { handle title }
    }
  }
`;

let response;
try {
  response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query }),
  });
} catch (error) {
  ko(`Impossible de joindre ${domain}`);
  console.error(`\n  ${error.message}\n  Vérifiez le domaine : il finit toujours par .myshopify.com\n`);
  process.exit(1);
}

if (!response.ok) {
  ko(`HTTP ${response.status}`);
  const hints = {
    401: 'Jeton refusé. Copiez à nouveau le Storefront API access token.',
    403: 'Jeton valide mais portées insuffisantes. Cochez les autorisations unauthenticated_read_* dans la configuration de l’app.',
    404: 'Domaine ou version d’API introuvable. Vérifiez les deux.',
    430: 'Requête bloquée par Shopify (protection anti-abus). Réessayez dans un instant.',
  };
  console.error(`\n  ${hints[response.status] ?? (await response.text()).slice(0, 300)}\n`);
  process.exit(1);
}

const payload = await response.json();

if (payload.errors?.length) {
  ko('Erreur GraphQL');
  for (const error of payload.errors) console.error(`  · ${error.message}`);
  console.error(
    `\n  Si le message cite un champ inconnu, la version d’API ${version} est probablement\n` +
      '  trop ancienne ou trop récente. Ajustez PUBLIC_SHOPIFY_API_VERSION.\n',
  );
  process.exit(1);
}

const { shop, products, collections } = payload.data;

ok(`Connecté à « ${shop.name} »`);
console.log(`  Domaine public : ${shop.primaryDomain.url}`);
console.log(`  Devise         : ${shop.paymentSettings.currencyCode}`);

console.log(`\n  Produits (${products.nodes.length} premiers) :`);
if (products.nodes.length === 0) {
  console.log('  · aucun — normal tant que le catalogue est vide.');
} else {
  for (const product of products.nodes) {
    console.log(`  · ${product.title} (${product.handle})${product.availableForSale ? '' : ' — épuisé'}`);
  }
}

console.log(`\n  Collections (${collections.nodes.length} premières) :`);
if (collections.nodes.length === 0) {
  console.log('  · aucune.');
} else {
  for (const collection of collections.nodes) {
    console.log(`  · ${collection.title} (${collection.handle})`);
  }
}

console.log('');

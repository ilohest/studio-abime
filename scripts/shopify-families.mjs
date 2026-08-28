/**
 * État de la saisie des trois familles, vu depuis le site.
 *
 *   npm run shopify:families
 *
 * POURQUOI CE SCRIPT
 *
 * En headless, un metafield peut être parfaitement rempli dans l'admin et rester
 * invisible du site : tant que sa définition n'a pas l'accès « API Storefront »,
 * elle revient vide, sans le moindre message d'erreur. C'est le piège numéro un
 * de cette architecture, et il ne se voit nulle part depuis le back-office.
 *
 * Ce script montre donc exactement ce que le site reçoit, produit par produit :
 * la famille déduite du « Type de produit », puis chaque champ que cette famille
 * déclare, coché s'il arrive, laissé vide sinon.
 *
 * La liste des champs interrogés n'est pas recopiée ici : elle vient de
 * `src/lib/shopify/families.ts`, qui fait foi. Ajouter un champ à une famille
 * suffit à le voir apparaître dans ce diagnostic.
 */
import {
  COMMON_FACTS,
  EDITION_MAX,
  EDITION_SHOW,
  FAMILIES,
  metafieldIdentifiersLiteral,
  toFamily,
} from '../src/lib/shopify/families.ts';

const domain = (process.env.PUBLIC_SHOPIFY_STORE_DOMAIN ?? '')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');
const token = process.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? '';
const version = process.env.PUBLIC_SHOPIFY_API_VERSION || '2026-07';

const ok = (message) => console.log(`\x1b[32m✓\x1b[0m ${message}`);
const ko = (message) => console.error(`\x1b[31m✗\x1b[0m ${message}`);
const dim = (message) => `\x1b[2m${message}\x1b[0m`;

if (!domain || !token) {
  ko('Configuration incomplète — lancez d’abord `npm run shopify:check`.');
  process.exit(1);
}

const query = `
  query Families {
    products(first: 100) {
      nodes {
        handle
        title
        productType
        metafields(identifiers: [${metafieldIdentifiersLiteral()}]) {
          namespace
          key
          value
        }
        variants(first: 50) {
          nodes {
            title
            editionMax: metafield(namespace: "${EDITION_MAX.namespace}", key: "${EDITION_MAX.key}") {
              value
            }
          }
        }
      }
    }
  }
`;

const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
  body: JSON.stringify({ query }),
});

if (!response.ok) {
  ko(`HTTP ${response.status} — voir \`npm run shopify:check\` pour le détail.`);
  process.exit(1);
}

const payload = await response.json();

if (payload.errors?.length) {
  ko('Erreur GraphQL');
  for (const error of payload.errors) console.error(`  · ${error.message}`);
  process.exit(1);
}

/*
  Sonde de portée, à part et volontairement jetable : `totalInventory` est le
  champ le moins coûteux qui exige `unauthenticated_read_product_inventory`.
  Shopify refuse la requête entière plutôt que de renvoyer un champ vide — le
  refus est donc une réponse en soi, et c'est tout ce qu'on cherche à savoir.
*/
const scopeProbe = await fetch(`https://${domain}/api/${version}/graphql.json`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
  body: JSON.stringify({ query: '{ products(first: 1) { nodes { totalInventory } } }' }),
});
const scopeGranted = !(await scopeProbe.json()).errors?.length;

const products = payload.data.products.nodes;
console.log(`\n  Boutique : ${domain}\n  Produits : ${products.length}\n`);

let readable = 0;
const orphans = [];

for (const product of products) {
  const family = toFamily(product.productType);
  const filled = new Map(
    product.metafields.filter(Boolean).filter((m) => m.value?.trim()).map((m) => [`${m.namespace}.${m.key}`, m.value.trim()]),
  );
  readable += filled.size;

  if (!family) orphans.push(product);

  const heading = family
    ? `\x1b[1m${product.title}\x1b[0m ${dim(`— ${family}`)}`
    : `\x1b[1m${product.title}\x1b[0m \x1b[33m— type « ${product.productType || 'vide'} », hors des trois familles\x1b[0m`;
  console.log(`  ${heading}`);

  /*
    On n'affiche que les champs de la famille du produit, plus la jauge et les
    champs communs : c'est précisément ce que la fiche montrera. Un champ d'une
    autre famille resté rempli par erreur n'apparaît pas — il est invisible du
    site, donc sans effet.
  */
  const declared = [
    ...(family ? FAMILIES[family].facts : []),
    EDITION_SHOW,
    EDITION_MAX,
    ...COMMON_FACTS,
  ];

  for (const field of declared) {
    const slot = `${field.namespace}.${field.key}`;
    const value =
      filled.get(slot) ??
      (field.legacy ? filled.get(`${field.legacy.namespace}.${field.legacy.key}`) : undefined);
    const mark = value ? '\x1b[32m✓\x1b[0m' : dim('·');
    const shown = value ? ` ${dim(value.length > 60 ? `${value.slice(0, 57)}…` : value)}` : '';
    console.log(`    ${mark} ${slot}${shown}`);
  }

  const perVariant = product.variants.nodes.filter((variant) => variant.editionMax?.value);
  if (perVariant.length > 0) {
    readable += perVariant.length;
    for (const variant of perVariant) {
      console.log(`    \x1b[32m✓\x1b[0m ${dim(`variante « ${variant.title} » → jauge ${variant.editionMax.value}`)}`);
    }
  }

  console.log('');
}

if (readable === 0 && products.length > 0) {
  ko('Aucun metafield ne remonte jusqu’au site.');
  console.error(
    '\n  Deux causes possibles, dans cet ordre de probabilité :\n\n' +
      '  1. Les définitions n’ont pas l’accès Storefront. Réglages → Données\n' +
      '     personnalisées → Produits → chaque définition → Accès → cochez la\n' +
      '     lecture par l’API Storefront. C’est silencieux : sans cette case, la\n' +
      '     valeur existe dans l’admin et revient vide ici.\n' +
      '  2. Les champs ne sont pas encore remplis sur les fiches produit.\n',
  );
} else {
  ok(`${readable} valeur(s) lisible(s) depuis le site.`);
}

if (scopeGranted) {
  ok('Portée d’inventaire accordée — le stock restant est lisible.');
  if (process.env.PUBLIC_SHOPIFY_INVENTORY_SCOPE?.trim().toLowerCase() !== 'true') {
    console.error(
      '\n\x1b[33m!\x1b[0m Mais PUBLIC_SHOPIFY_INVENTORY_SCOPE n’est pas sur "true" dans .env :\n' +
        '  le site ne demande donc pas encore le stock. Basculez-le et relancez le build.\n',
    );
  }
} else {
  console.error(
    '\n\x1b[33m!\x1b[0m Portée d’inventaire absente : le total s’affichera, jamais le restant.\n' +
      '  Canal Headless → votre vitrine → Storefront API → autorisations →\n' +
      '  cocher la lecture de l’inventaire des produits, puis passer\n' +
      '  PUBLIC_SHOPIFY_INVENTORY_SCOPE à "true" dans .env.\n',
  );
}

if (orphans.length > 0) {
  console.error(
    `\n\x1b[33m!\x1b[0m ${orphans.length} produit(s) hors des trois familles : ` +
      `${orphans.map((product) => product.handle).join(', ')}.\n` +
      '  Ils gardent le bouton générique et n’entrent dans aucune collection.\n' +
      `  Attendu dans « Type de produit » : ${Object.values(FAMILIES).map((family) => family.productType).join(', ')}.\n`,
  );
}

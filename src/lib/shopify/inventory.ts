import { shopifyFetch } from './client';
import { inventoryScopeGranted } from './env';
import { productInventoryQuery } from './queries';

/**
 * Stock restant, lu depuis le navigateur.
 *
 * Le site est généré au build : un « 12 places restantes » rendu par Astro
 * serait daté du dernier déploiement, donc faux dès la première inscription.
 * Cette lecture-ci part du navigateur à l'ouverture de la fiche, en `no-store`,
 * exactement comme le panier — le jeton Storefront est public par conception.
 *
 * Le total annoncé, lui, reste rendu au build : c'est un metafield saisi une
 * fois, il n'a aucune raison de bouger entre deux déploiements. La fiche
 * combine donc les deux : « Places : 30 » écrit dans le HTML, « 12 places
 * restantes » ajouté à l'hydratation.
 */
export type InventoryByVariant = Map<string, number>;

interface RawInventory {
  product: { variants: { nodes: Array<{ id: string; quantityAvailable: number | null }> } } | null;
}

export async function fetchInventory(handle: string): Promise<InventoryByVariant> {
  /*
    Garde volontairement muette : tant que la portée n'est pas accordée, la
    fiche affiche le total sans le restant, plutôt que d'échouer. C'est une
    absence d'information, pas une panne.
  */
  if (!inventoryScopeGranted) return new Map();

  const data = await shopifyFetch<RawInventory>({
    query: productInventoryQuery,
    variables: { handle },
    cache: 'no-store',
    fallback: { product: null },
  });

  const inventory: InventoryByVariant = new Map();

  for (const variant of data.product?.variants.nodes ?? []) {
    /*
      `null` a un sens précis ici : la variante ne suit pas son stock. Une
      formation sans suivi n'a pas de places restantes à annoncer, et on
      préfère ne rien dire plutôt que d'afficher zéro.
    */
    if (typeof variant.quantityAvailable !== 'number') continue;
    inventory.set(variant.id, Math.max(0, variant.quantityAvailable));
  }

  return inventory;
}

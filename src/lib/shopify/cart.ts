import { shopifyFetch } from './client';
import { inventoryScopeGranted } from './env';
import { giftRecipientLabel, type CartLineAttribute } from './giftCard';
import type { Money, ShopImage } from './types';

/**
 * Panier Shopify — API Cart.
 *
 * Tout se passe dans le navigateur : le panier est propre à un visiteur, il n'a
 * rien à faire dans une page générée au build. Le jeton Storefront est public
 * par conception, et l'API Cart n'expose ni les commandes ni les clients.
 *
 * Le panier vit chez Shopify ; nous n'en gardons localement que l'identifiant.
 * Conséquence importante : le prix, la disponibilité et les frais sont toujours
 * recalculés par Shopify, jamais par nous. Un tirage épuisé entre deux visites
 * ressort du panier sans que nous ayons à le détecter.
 */

const STORAGE_KEY = 'abime.cart-id';

export interface CartLine {
  id: string;
  quantity: number;
  merchandiseId: string;
  title: string;
  /** Libellé de la variante — masqué quand le tirage n'a pas d'options. */
  variantTitle: string | null;
  handle: string;
  image: ShopImage | null;
  unitPrice: Money;
  linePrice: Money;
  /** Stock courant, ou `null` lorsque la variante ne suit pas son inventaire. */
  maxQuantity: number | null;
  /**
   * Destinataire d'une carte cadeau, prêt à afficher. `null` sur toute ligne
   * ordinaire — et sur une carte cadeau que l'acheteuse garde pour elle.
   */
  recipient: string | null;
}

export interface Cart {
  id: string;
  /** URL du tunnel de paiement hébergé par Shopify. */
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money;
  lines: CartLine[];
  /** Note libre laissée par la cliente, reportée sur la commande. */
  note: string;
}

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartParts on Cart {
    id
    checkoutUrl
    note
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 250) {
      nodes {
        id
        quantity
        # Ce qui est attaché à la ligne : aujourd'hui le destinataire d'une
        # carte cadeau, qu'on réaffiche dans le tiroir pour qu'il soit
        # relisible avant le paiement.
        attributes {
          key
          value
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            currentlyNotInStock
            ${inventoryScopeGranted ? 'quantityAvailable' : ''}
            price {
              amount
              currencyCode
            }
            image {
              url
              altText
              width
              height
            }
            product {
              title
              handle
              # Repli du visuel de la ligne. Un produit dont le premier média
              # est une vidéo n'a pas de variante « image » assignée
              # (merchandise.image renvoie alors null) : sa vignette de
              # panier retomberait sinon sur l'état vide.
              media(first: 1) {
                nodes {
                  previewImage {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/* ── Formes brutes ──────────────────────────────────────────────────────── */

interface RawCart {
  id: string;
  checkoutUrl: string;
  note: string | null;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: {
    nodes: Array<{
      id: string;
      quantity: number;
      attributes: CartLineAttribute[];
      cost: { totalAmount: Money };
      merchandise: {
        id: string;
        title: string;
        availableForSale: boolean;
        currentlyNotInStock: boolean;
        quantityAvailable?: number | null;
        price: Money;
        image: ShopImage | null;
        product: {
          title: string;
          handle: string;
          media: { nodes: Array<{ previewImage: ShopImage | null }> };
        };
      };
    }>;
  };
}

interface CartUserError {
  field: string[] | null;
  message: string;
}

interface RawCartMutation {
  cart: RawCart | null;
  userErrors: CartUserError[];
}

/**
 * Une mutation Storefront peut répondre HTTP 200 tout en refusant une ligne
 * (stock insuffisant, variante supprimée, panier expiré…). La réponse ne doit
 * jamais être traitée comme un succès tant que `userErrors` n'est pas vide.
 */
function unwrapCartMutation(result: RawCartMutation, operation: string): Cart {
  if (result.userErrors.length > 0) {
    const detail = result.userErrors.map((error) => error.message).join(' | ');
    throw new Error(`[shopify] ${operation} refusée : ${detail}`);
  }

  if (!result.cart) {
    throw new Error(`[shopify] ${operation} sans panier dans la réponse.`);
  }

  return toCart(result.cart);
}

function toCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    /* Shopify renvoie `null` pour une note jamais écrite ; la vue veut une chaîne. */
    note: raw.note ?? '',
    totalQuantity: raw.totalQuantity,
    subtotal: raw.cost.subtotalAmount,
    lines: raw.lines.nodes.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      merchandiseId: line.merchandise.id,
      title: line.merchandise.product.title,
      /*
        Shopify nomme « Default Title » la variante unique d'un produit sans
        options. Elle n'a aucun sens pour un visiteur : on la neutralise ici,
        comme on écarte l'option fantôme du même nom dans le catalogue.
      */
      variantTitle: line.merchandise.title === 'Default Title' ? null : line.merchandise.title,
      handle: line.merchandise.product.handle,
      image: line.merchandise.image ?? line.merchandise.product.media.nodes[0]?.previewImage ?? null,
      unitPrice: line.merchandise.price,
      linePrice: line.cost.totalAmount,
      recipient: giftRecipientLabel(line.attributes),
      maxQuantity:
        typeof line.merchandise.quantityAvailable === 'number' &&
        !(
          line.merchandise.quantityAvailable === 0 &&
          line.merchandise.availableForSale &&
          !line.merchandise.currentlyNotInStock
        )
          ? Math.max(0, line.merchandise.quantityAvailable)
          : null,
    })),
  };
}

/* ── Identifiant local ──────────────────────────────────────────────────── */

/**
 * Le navigateur peut refuser l'accès au stockage (navigation privée stricte,
 * réglages restrictifs). Le panier fonctionne alors le temps de la visite,
 * ce qui vaut mieux qu'une page qui échoue.
 */
function readCartId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeCartId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* Sans stockage, le panier ne survivra pas au rechargement. Rien de plus à faire. */
  }
}

function clearCartId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Voir `writeCartId`. */
  }
}

/**
 * À appeler une fois la commande confirmée.
 *
 * Le panier Shopify référencé par cet identifiant vient d'être consommé par le
 * paiement : le rouvrir renverrait une coquille vide. Mieux vaut repartir sur
 * un panier neuf au prochain ajout que de garder la trace de l'ancien.
 */
export function forgetCart(): void {
  clearCartId();
}

/* ── Opérations ─────────────────────────────────────────────────────────── */

/** Panier existant, ou `null` s'il n'y en a pas — ou s'il a expiré chez Shopify. */
export async function fetchCart(): Promise<Cart | null> {
  const id = readCartId();
  if (!id) return null;

  const data = await shopifyFetch<{ cart: RawCart | null }>({
    query: /* GraphQL */ `
      ${CART_FRAGMENT}
      query CartById($id: ID!) {
        cart(id: $id) {
          ...CartParts
        }
      }
    `,
    variables: { id },
    cache: 'no-store',
    fallback: { cart: null },
  });

  /*
    Shopify purge les paniers inactifs au bout de quelques mois. L'identifiant
    conservé ici pointerait alors dans le vide : on le jette, le prochain ajout
    en créera un neuf.
  */
  if (!data.cart) {
    clearCartId();
    return null;
  }

  return toCart(data.cart);
}

/**
 * Ajoute une variante, en créant le panier au premier ajout.
 *
 * `attributes` porte ce qui est attaché à CETTE ligne — aujourd'hui le
 * destinataire d'une carte cadeau (voir `giftCard.ts`). Shopify les recopie sur
 * la commande, où le paiement les lit.
 */
export async function addLine(
  merchandiseId: string,
  quantity = 1,
  attributes: CartLineAttribute[] = [],
): Promise<Cart> {
  const id = readCartId();
  /*
    Une ligne sans attribut n'en déclare aucun : envoyer un tableau vide ferait
    apparaître une ligne « personnalisée » là où il n'y a rien à personnaliser.
  */
  const line =
    attributes.length > 0 ? { merchandiseId, quantity, attributes } : { merchandiseId, quantity };

  if (!id) {
    const data = await shopifyFetch<{ cartCreate: RawCartMutation }>({
      query: /* GraphQL */ `
        ${CART_FRAGMENT}
        mutation CartCreate($lines: [CartLineInput!]!) {
          cartCreate(input: { lines: $lines }) {
            cart {
              ...CartParts
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: { lines: [line] },
      cache: 'no-store',
    });

    const cart = unwrapCartMutation(data.cartCreate, 'Création du panier');
    writeCartId(cart.id);
    return cart;
  }

  const data = await shopifyFetch<{ cartLinesAdd: RawCartMutation }>({
    query: /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            ...CartParts
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: { cartId: id, lines: [line] },
    cache: 'no-store',
  });

  return unwrapCartMutation(data.cartLinesAdd, 'Ajout au panier');
}

/**
 * Écrit la note de commande.
 *
 * Elle vit chez Shopify, avec le panier : elle survit donc au rechargement et
 * suit la commande jusqu'au back-office, là où une note gardée de notre côté se
 * serait perdue au paiement.
 */
export async function updateNote(note: string): Promise<Cart> {
  const id = readCartId();
  if (!id) throw new Error('Note de commande : aucun panier ouvert.');

  const data = await shopifyFetch<{ cartNoteUpdate: RawCartMutation }>({
    query: /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartNoteUpdate($cartId: ID!, $note: String!) {
        cartNoteUpdate(cartId: $cartId, note: $note) {
          cart {
            ...CartParts
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: { cartId: id, note },
    cache: 'no-store',
  });

  return unwrapCartMutation(data.cartNoteUpdate, 'Note de commande');
}

/** Change la quantité d'une ligne. Une quantité nulle la retire. */
export async function updateLine(lineId: string, quantity: number): Promise<Cart> {
  if (quantity <= 0) return removeLine(lineId);

  const id = readCartId();
  if (!id) throw new Error('[shopify] Aucun panier à modifier.');

  const data = await shopifyFetch<{ cartLinesUpdate: RawCartMutation }>({
    query: /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            ...CartParts
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: { cartId: id, lines: [{ id: lineId, quantity }] },
    cache: 'no-store',
  });

  return unwrapCartMutation(data.cartLinesUpdate, 'Modification du panier');
}

/** Retire une ligne du panier. */
export async function removeLine(lineId: string): Promise<Cart> {
  const id = readCartId();
  if (!id) throw new Error('[shopify] Aucun panier à modifier.');

  const data = await shopifyFetch<{ cartLinesRemove: RawCartMutation }>({
    query: /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            ...CartParts
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: { cartId: id, lineIds: [lineId] },
    cache: 'no-store',
  });

  return unwrapCartMutation(data.cartLinesRemove, 'Retrait du panier');
}

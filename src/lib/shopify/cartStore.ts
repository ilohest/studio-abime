import { reactive, readonly } from 'vue';
import { addLine, fetchCart, forgetCart, removeLine, updateLine, type Cart } from './cart';

/**
 * État partagé du panier.
 *
 * Deux îlots Vue le lisent et l'écrivent : le bloc d'achat de la fiche produit
 * et le tiroir du menu. Ils vivent dans des composants Astro distincts, hydratés
 * séparément — mais Vite ne livre qu'une seule copie de ce module, ils partagent
 * donc bien le même objet réactif. Aucun bus d'événements à maintenir.
 *
 * Le panier de référence reste celui de Shopify : chaque opération renvoie
 * l'état complet recalculé par l'API, et c'est lui qu'on stocke. On ne fait
 * jamais évoluer les quantités ou les totaux de notre côté.
 */
interface CartState {
  cart: Cart | null;
  /** Une opération réseau est en cours : les commandes se désactivent. */
  busy: boolean;
  /** Le tiroir est ouvert. */
  open: boolean;
  /** Message d'échec lisible, ou `null`. */
  error: string | null;
  /** `true` une fois la première lecture terminée, réussie ou non. */
  ready: boolean;
}

const state = reactive<CartState>({
  cart: null,
  busy: false,
  open: false,
  error: null,
  ready: false,
});

export const cartState = readonly(state);

/** Nombre d'articles, pour le compteur du menu. */
export function itemCount(): number {
  return state.cart?.totalQuantity ?? 0;
}

/**
 * Enveloppe commune : un seul endroit gère l'indicateur d'activité et la
 * traduction d'une panne réseau en message affichable.
 */
async function run(operation: () => Promise<Cart | null>): Promise<void> {
  state.busy = true;
  state.error = null;

  try {
    state.cart = await operation();
  } catch (error) {
    console.error('[shopify] Opération de panier en échec :', error);
    state.error = 'error';
  } finally {
    state.busy = false;
  }
}

/**
 * Première lecture, au montage du tiroir.
 * Idempotente : appelée par plusieurs îlots, elle ne travaille qu'une fois.
 */
export async function initCart(): Promise<void> {
  if (state.ready) return;
  state.ready = true;
  await run(fetchCart);
}

export async function add(merchandiseId: string, quantity = 1): Promise<void> {
  await run(() => addLine(merchandiseId, quantity));
  // Le tiroir s'ouvre sur un ajout réussi : c'est la confirmation de l'action.
  if (!state.error) state.open = true;
}

export async function setQuantity(lineId: string, quantity: number): Promise<void> {
  await run(() => updateLine(lineId, quantity));
}

export async function remove(lineId: string): Promise<void> {
  await run(() => removeLine(lineId));
}

export function openCart(): void {
  state.open = true;
}

export function closeCart(): void {
  state.open = false;
}

export function dismissError(): void {
  state.error = null;
}

/**
 * À appeler sur la page de confirmation de commande.
 *
 * Le panier qui vient d'être payé n'a plus lieu d'être affiché — ni dans le
 * compteur du menu, ni si le visiteur rouvre le tiroir. `ready` repasse à
 * `false` : un futur ajout sur une autre page repartira d'une lecture propre
 * plutôt que de garder en mémoire l'état d'avant paiement.
 */
export function clearCartAfterCheckout(): void {
  forgetCart();
  state.cart = null;
  state.ready = false;
}

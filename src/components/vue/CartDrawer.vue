<script setup lang="ts">
/**
 * Panier — déclencheur dans le menu et tiroir latéral.
 *
 * Un seul composant porte les deux : le compteur du menu et le tiroir lisent le
 * même état, et les séparer aurait imposé un bus d'événements pour rien.
 *
 * Le tiroir ne rend pas le paiement : il conduit à `checkoutUrl`, le tunnel
 * hébergé par Shopify. Aucune donnée bancaire ne transite par le site.
 */
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import {
  cartState,
  closeCart,
  initCart,
  openCart,
  remove,
  setQuantity,
} from '~/lib/shopify/cartStore';

/*
  Ce composant a deux racines : le déclencheur, qui reste dans le menu, et le
  tiroir, qui part vers `body`. Vue ne peut donc pas décider seul où poser les
  attributs venus de l'extérieur — dont le marqueur de styles scopés
  (`data-astro-cid-…`) qu'Astro accroche à toute île placée dans un composant
  qui en porte. Il renonce, et le signale à chaque rendu en développement.

  On désigne donc la destination : le déclencheur, seul des deux à vivre
  réellement dans le rail. Le tiroir, lui, sort du conteneur au montage — il
  n'a rien à faire du marqueur d'un parent dont il n'est plus l'enfant.
*/
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  labels: {
    cart: string;
    close: string;
    empty: string;
    browseShop: string;
    subtotal: string;
    checkout: string;
    remove: string;
    quantity: string;
    decrease: string;
    increase: string;
    shipping: string;
    taxes: string;
    calculatedAtCheckout: string;
    error: string;
  };
  /** Adresse de l'index de la boutique, construite côté Astro. */
  shopHref: string;
}>();

/*
  Le tiroir n'est téléporté vers `body` qu'une fois le composant monté.

  Sans ce garde-fou, Vue rend les ancres de téléportation côté serveur, puis
  cherche le contenu téléporté dans `body` au moment de l'hydratation. Ne l'y
  trouvant pas — il est rendu dans l'îlot, à l'intérieur du menu — il répare le
  DOM en supprimant des nœuds voisins : le `<nav>` du rail disparaissait
  entièrement de la page.
*/
const mounted = ref(false);
const panel = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);

const count = computed(() => cartState.cart?.totalQuantity ?? 0);
const lines = computed(() => cartState.cart?.lines ?? []);

/**
 * Le prix vient déjà formaté de Shopify sous forme de montant + devise. On le
 * met en forme ici parce que le tiroir est le seul écran dont le contenu naît
 * côté navigateur : rien n'a pu être préparé au build.
 */
function money(amount: string, currencyCode: string): string {
  const value = Number(amount);
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

onMounted(() => {
  mounted.value = true;
  initCart();
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.documentElement.style.removeProperty('overflow');
});

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && cartState.open) closeCart();
}

/*
  Panier vide : on referme le tiroir AVANT de naviguer, sinon la page suivante
  se charge derrière un panneau resté ouvert et le visiteur doit le fermer pour
  voir ce qu'il vient de demander.

  Déjà sur la boutique, on se contente de fermer : un bouton qui recharge la
  page où l'on se trouve est une impasse déguisée en action.
*/
function browseShop() {
  closeCart();

  const cible = props.shopHref.replace(/\/$/, '');
  const courante = window.location.pathname.replace(/\/$/, '');
  if (courante !== cible) window.location.href = props.shopHref;
}

/*
  Le tiroir se comporte comme une boîte de dialogue : le fond ne défile plus
  derrière lui, le focus entre dedans à l'ouverture et revient au déclencheur à
  la fermeture. Sans ça, un visiteur au clavier se retrouve à parcourir la page
  cachée derrière le panneau.
*/
watch(
  () => cartState.open,
  async (open) => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      panel.value?.focus();
    } else {
      trigger.value?.focus();
    }
  },
);
</script>

<template>
  <button
    ref="trigger"
    v-bind="$attrs"
    type="button"
    class="cart-trigger"
    :aria-expanded="cartState.open"
    @click="openCart"
  >
    {{ props.labels.cart }} <span class="cart-trigger__count">({{ count }})</span>
  </button>

  <Teleport to="body" :disabled="!mounted">
    <div v-if="cartState.open" class="cart">
      <div class="cart__veil" @click="closeCart"></div>

      <aside
        ref="panel"
        class="cart__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="props.labels.cart"
        tabindex="-1"
      >
        <header class="cart__head">
          <h2 class="cart__title type-copy">{{ props.labels.cart }}</h2>
          <button type="button" class="cart__close type-annotation" @click="closeCart">
            {{ props.labels.close }}
          </button>
        </header>

        <p v-if="cartState.error" class="cart__error type-annotation" role="alert">
          {{ props.labels.error }}
        </p>

        <div v-if="count === 0" class="cart__empty-state">
          <p class="cart__empty type-copy">{{ props.labels.empty }}</p>

          <button type="button" class="button-minimal cart__browse" @click="browseShop">
            <span class="button-minimal__label">{{ props.labels.browseShop }}</span>
            <span class="button-minimal__arrow" aria-hidden="true">&#8627;</span>
          </button>
        </div>

        <ul v-else class="cart__lines" role="list">
          <li v-for="line in lines" :key="line.id" class="cart__line">
            <img
              v-if="line.image?.url"
              class="cart__thumb"
              :src="`${line.image.url}&width=200`"
              :alt="line.image.altText || line.title"
              width="80"
              height="107"
              loading="lazy"
              decoding="async"
            />
            <div v-else class="cart__thumb cart__thumb--empty"></div>

            <div class="cart__info">
              <p class="cart__name type-copy">{{ line.title }}</p>
              <p v-if="line.variantTitle" class="cart__variant type-annotation">
                {{ line.variantTitle }}
              </p>

              <div class="cart__controls">
                <div class="cart__stepper" role="group" :aria-label="props.labels.quantity">
                  <button
                    type="button"
                    class="cart__step"
                    :aria-label="props.labels.decrease"
                    :disabled="cartState.busy || line.quantity <= 1"
                    @click="setQuantity(line.id, line.quantity - 1)"
                  >
                    &minus;
                  </button>

                  <!--
                    Le nombre est annoncé quand il change : sans ça, la commande
                    est confirmée visuellement mais reste muette au lecteur d'écran.
                  -->
                  <span class="cart__count" aria-live="polite">{{ line.quantity }}</span>

                  <button
                    type="button"
                    class="cart__step"
                    :aria-label="props.labels.increase"
                    :disabled="cartState.busy"
                    @click="setQuantity(line.id, line.quantity + 1)"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  class="cart__remove type-annotation"
                  :disabled="cartState.busy"
                  @click="remove(line.id)"
                >
                  {{ props.labels.remove }}
                </button>
              </div>
            </div>

            <p class="cart__price type-annotation">
              {{ money(line.linePrice.amount, line.linePrice.currencyCode) }}
            </p>
          </li>
        </ul>

        <footer v-if="count > 0" class="cart__foot">
          <p class="cart__subtotal type-copy">
            <span>{{ props.labels.subtotal }}</span>
            <span>
              {{
                money(
                  cartState.cart!.subtotal.amount,
                  cartState.cart!.subtotal.currencyCode,
                )
              }}
            </span>
          </p>

          <dl class="cart__estimate">
            <div class="cart__estimate-row">
              <dt>{{ props.labels.taxes }}</dt>
              <dd>{{ props.labels.calculatedAtCheckout }}</dd>
            </div>
            <div class="cart__estimate-row">
              <dt>{{ props.labels.shipping }}</dt>
              <dd>{{ props.labels.calculatedAtCheckout }}</dd>
            </div>
          </dl>

          <a class="button-minimal cart__checkout" :href="cartState.cart!.checkoutUrl">
            <span class="button-minimal__label">{{ props.labels.checkout }}</span>
            <span class="button-minimal__arrow" aria-hidden="true">&#8627;</span>
          </a>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
/*
  Le déclencheur est une entrée du menu comme les autres : il hérite de la
  typographie de son `<li>` (`type-note`) au lieu d'en imposer une. `font` en
  raccourci reprend famille, taille, graisse et interlignage d'un coup — un
  bouton part sinon sur la police par défaut du navigateur.
*/
.cart-trigger {
  background: none;
  border: 0;
  padding: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  text-align: inherit;
}

/*
  Le compte passe en italique via la famille Annotation, qui en possède une
  vraie. Incliner la famille Titre du menu aurait laissé le navigateur en
  fabriquer une, toujours plus grossière qu'un dessin d'origine.
*/
.cart-trigger__count {
  font-family: var(--font-annotation);
  font-style: italic;
  letter-spacing: var(--tracking-annotation);
}

.cart-trigger:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
}

.cart {
  position: fixed;
  inset: 0;
  z-index: 100;
}

.cart__veil {
  position: absolute;
  inset: 0;
  background: color-mix(in oklab, var(--color-surface-invert) 35%, transparent);
}

.cart__panel {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  width: min(30rem, 100%);
  background: var(--color-surface);
  border-left: 1px solid var(--color-line);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  overflow-y: auto;
}

.cart__panel:focus {
  outline: none;
}

.cart__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.cart__title {
  margin: 0;
}

.cart__close {
  background: none;
  border: 0;
  padding: 0;
  color: var(--color-muted);
  cursor: pointer;
  font-family: inherit;
}

.cart__close:hover {
  color: var(--color-ink);
}

.cart__close:focus-visible,
.cart__remove:focus-visible,
.cart__checkout:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
}

.cart__empty,
.cart__error {
  margin: 0;
  color: var(--color-muted);
}

/*
  Le panier vide n'est pas qu'un constat : c'est le seul endroit du tiroir où
  l'on peut proposer quelque chose. Le texte garde son ton discret, le bouton
  reprend celui des appels à l'action du site.
*/
.cart__empty-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/*
  L'écart est posé sur le bouton et non en `gap` du conteneur : le constat et
  l'action ne sont pas deux éléments d'une liste, c'est une phrase suivie d'une
  proposition. Le blanc qui les sépare doit se voir.
*/
.cart__browse {
  margin-top: clamp(2rem, 5vh, 3rem);
}

.cart__lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cart__line {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  border-top: 1px solid var(--color-line);
  padding-top: 1.25rem;
}

.cart__thumb {
  width: 4rem;
  height: auto;
  aspect-ratio: 3 / 4;
  object-fit: contain;
  background: color-mix(in oklab, var(--color-surface-alt) 55%, var(--color-surface));
}

.cart__thumb--empty {
  height: 5.35rem;
}

.cart__info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.cart__name,
.cart__variant,
.cart__price {
  margin: 0;
}

/* Plus petite que le nom du tirage : c'est un détail, pas une seconde ligne de titre. */
.cart__variant {
  color: var(--color-muted);
  font-size: calc(var(--text-annotation) * 0.6);
}

.cart__controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.4rem;
}

/*
  Pas à pas plutôt que champ libre : trois cibles claires, aucune saisie à
  valider, et pas de quantité aberrante à rattraper. La descente s'arrête à 1 —
  c'est « Retirer » qui vide une ligne, et une commande ne doit jamais avoir
  deux façons de faire la même chose.
*/
.cart__stepper {
  display: inline-flex;
  align-items: stretch;
}

.cart__step {
  background: none;
  border: 0;
  padding: 0.2rem 0.6rem;
  color: inherit;
  cursor: pointer;
  font: inherit;
  line-height: 1.4;
}

.cart__step:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-surface-alt) 55%, var(--color-surface));
}

.cart__step:disabled {
  color: var(--color-muted);
  cursor: not-allowed;
}

.cart__step:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: -2px;
}

.cart__count {
  min-width: 2ch;
  padding: 0.2rem 0.1rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

/*
  Plus petit que la variante juste au-dessus : c'est une action secondaire,
  elle ne doit pas peser plus lourd que l'information qu'elle accompagne.
*/
.cart__remove {
  background: none;
  border: 0;
  padding: 0;
  color: var(--color-muted);
  cursor: pointer;
  font-family: inherit;
  font-size: calc(var(--text-annotation) * 0.55);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.cart__remove:hover {
  color: var(--color-ink);
}

.cart__foot {
  margin-top: auto;
  border-top: 1px solid var(--color-line);
  padding-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cart__subtotal {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
}

/*
  Registre du menu latéral plutôt que celui des annotations éditoriales : ce
  sont des mentions de caisse, pas un commentaire sur l'œuvre. `type-note` est
  déjà la plus petite taille de la charte — le libellé et la valeur restent
  nettement en retrait du sous-total.
*/
.cart__estimate {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cart__estimate-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--font-titre);
  font-size: 0.75rem;
  letter-spacing: var(--tracking-copy);
  color: var(--color-muted);
}

.cart__estimate-row dt,
.cart__estimate-row dd {
  margin: 0;
  text-transform: uppercase;
}

/* Même traitement que le bouton d'ajout : `.button-minimal` plus un fond plein. */
.cart__checkout {
  display: inline-flex;
  justify-content: center;
  background: var(--color-surface-invert);
  color: var(--color-ink-invert);
  padding: 0.42rem 1.1rem;
  text-decoration: none;
}
</style>

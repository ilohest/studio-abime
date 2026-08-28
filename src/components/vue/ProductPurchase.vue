<script setup lang="ts">
/**
 * Bloc d'achat de la fiche produit — composant Vue interactif.
 *
 * Contrat avec Astro, identique aux autres îlots :
 *  - il ne reçoit que des modèles de vue déjà résolus (prix formatés côté
 *    serveur, aucune logique monétaire ici) ;
 *  - il est hydraté en `client:visible` ;
 *  - toute la connaissance de Shopify reste dans `cartStore`.
 *
 * Sélectionner un format ne recharge rien : le prix et la disponibilité suivent
 * la variante choisie. Sans JavaScript, la fiche reste lisible — titre, propos,
 * fourchette de prix et formats disponibles sont rendus par Astro — seul l'achat
 * demande l'hydratation.
 */
import { computed, onMounted, ref } from 'vue';
import { add, cartState } from '~/lib/shopify/cartStore';
import { fetchInventory } from '~/lib/shopify/inventory';

export interface VariantView {
  id: string;
  available: boolean;
  priceLabel: string;
  compareAtLabel: string | null;
  /** Valeur choisie sur chaque axe : `{ Format: 'A2 – 420 x 594 mm' }`. */
  options: Record<string, string>;
}

const props = defineProps<{
  /** Identifiant d'URL du produit — sert à relire son stock au montage. */
  handle: string;
  options: Array<{ name: string; values: string[] }>;
  variants: VariantView[];
  /**
   * La cliente a demandé la jauge sur cette fiche. Faux, on ne va même pas
   * chercher le stock : pas de requête inutile sur un tirage courant.
   */
  showRemaining: boolean;
  labels: {
    addToCart: string;
    adding: string;
    soldOut: string;
    unavailable: string;
    error: string;
    quantity: string;
    decrease: string;
    increase: string;
    /** Décompte accordé à la famille : « places restantes », « exemplaires restants ». */
    remaining: string;
  };
}>();

const quantity = ref(1);

function decrease(): void {
  quantity.value = Math.max(1, quantity.value - 1);
}

function increase(): void {
  quantity.value += 1;
}

/**
 * Sélection initiale : la première variante disponible, ou la première tout
 * court si le tirage est épuisé. On n'ouvre jamais la fiche sur une combinaison
 * impossible.
 */
const initial = props.variants.find((variant) => variant.available) ?? props.variants[0];
const selected = ref<Record<string, string>>({ ...(initial?.options ?? {}) });

const currentVariant = computed(() =>
  props.variants.find((variant) =>
    props.options.every((option) => variant.options[option.name] === selected.value[option.name]),
  ),
);

/**
 * Une valeur est proposée même quand aucune variante disponible ne la porte :
 * on la marque épuisée plutôt que de la masquer. Masquer un format ferait
 * croire qu'il n'existe pas, alors qu'il reviendra en stock.
 */
function isValueAvailable(optionName: string, value: string): boolean {
  return props.variants.some(
    (variant) => variant.options[optionName] === value && variant.available,
  );
}

function select(optionName: string, value: string): void {
  selected.value = { ...selected.value, [optionName]: value };
}

const canBuy = computed(() => Boolean(currentVariant.value?.available) && !cartState.busy);

/*
  Stock lu à l'hydratation, jamais au build : la page est statique, le nombre
  de places ne l'est pas. Tant que la réponse n'est pas là — ou que la portée
  d'inventaire manque — la carte reste vide et la fiche n'annonce que le total
  déjà rendu par Astro.
*/
const remaining = ref<Map<string, number>>(new Map());

onMounted(async () => {
  if (!props.showRemaining) return;
  remaining.value = await fetchInventory(props.handle);
});

/** « 12 places restantes » — `null` quand la variante ne suit pas son stock. */
const remainingLabel = computed(() => {
  const variant = currentVariant.value;
  if (!variant) return null;

  const left = remaining.value.get(variant.id);
  return left === undefined ? null : `${left} ${props.labels.remaining}`;
});

async function onSubmit(): Promise<void> {
  const variant = currentVariant.value;
  if (!variant?.available) return;
  await add(variant.id, quantity.value);
  // Prêt pour un second ajout à l'identique plutôt que de rester sur le dernier chiffre choisi.
  quantity.value = 1;
}
</script>

<template>
  <form class="purchase" @submit.prevent="onSubmit">
    <!--
      Le décompte partage la ligne du prix, poussé au bord droit : deux faces de
      la même offre, ce qu'elle coûte et ce qu'il en reste. `aria-live` porte
      sur la ligne entière, si bien que passer d'une session à l'autre fait
      annoncer le nouveau prix ET le nouveau restant d'un seul tenant.
    -->
    <p class="purchase__price type-copy" aria-live="polite">
      <span>{{ currentVariant?.priceLabel ?? '—' }}</span>
      <s v-if="currentVariant?.compareAtLabel" class="purchase__compare">
        {{ currentVariant.compareAtLabel }}
      </s>
      <span v-if="remainingLabel" class="purchase__remaining type-note">
        {{ remainingLabel }}
      </span>
    </p>

    <fieldset v-for="option in options" :key="option.name" class="purchase__option">
      <!-- Le nom de l'axe (« Format ») est redondant à l'œil : les valeurs se comprennent seules. -->
      <legend class="sr-only">{{ option.name }}</legend>

      <div class="purchase__values">
        <label
          v-for="value in option.values"
          :key="value"
          class="purchase__value"
          :class="{ 'is-unavailable': !isValueAvailable(option.name, value) }"
        >
          <input
            type="radio"
            :name="option.name"
            :value="value"
            :checked="selected[option.name] === value"
            @change="select(option.name, value)"
          />
          <span>{{ value }}</span>
        </label>
      </div>
    </fieldset>

    <div class="purchase__action">
      <div class="purchase__stepper" role="group" :aria-label="labels.quantity">
        <button
          type="button"
          class="purchase__step"
          :aria-label="labels.decrease"
          :disabled="cartState.busy || quantity <= 1"
          @click="decrease"
        >
          &minus;
        </button>
        <span class="purchase__count" aria-live="polite">{{ quantity }}</span>
        <button
          type="button"
          class="purchase__step"
          :aria-label="labels.increase"
          :disabled="cartState.busy"
          @click="increase"
        >
          +
        </button>
      </div>

      <button class="button-minimal purchase__submit" type="submit" :disabled="!canBuy">
        <span class="button-minimal__label">
          <template v-if="cartState.busy">{{ labels.adding }}</template>
          <template v-else-if="!currentVariant">{{ labels.unavailable }}</template>
          <template v-else-if="!currentVariant.available">{{ labels.soldOut }}</template>
          <template v-else>{{ labels.addToCart }}</template>
        </span>
        <span class="button-minimal__arrow" aria-hidden="true">&#8627;</span>
      </button>
    </div>

    <p v-if="cartState.error" class="purchase__error type-annotation" role="alert">
      {{ labels.error }}
    </p>
  </form>
</template>

<style scoped>
.purchase {
  display: flex;
  flex-direction: column;
  gap: clamp(1.5rem, 3vw, 2.25rem);
}

.purchase__price {
  display: flex;
  align-items: baseline;
  /*
    Enroulement autorisé : sur les fiches étroites, « 12 places restantes » ne
    tient pas à côté d'un prix barré. Il passe alors à la ligne suivante en
    restant collé à droite, plutôt que de comprimer le prix.
  */
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0;
}

.purchase__compare {
  color: var(--color-muted);
  font-size: calc(var(--text-copy) * 0.8);
}

/*
  `margin-left: auto` plutôt qu'un `justify-content: space-between` sur le
  parent : le prix barré doit rester accolé au prix, et seul le décompte part
  au bord droit. Un `space-between` les aurait tous les trois écartés.

  Registre « note » et non « annotation » : cette dernière est plus GRANDE que
  le corps de texte (20 px contre 18), ce qui donnait au décompte plus de poids
  qu'au prix qu'il accompagne. La note le remet à sa place de mention discrète.
*/
.purchase__remaining {
  color: var(--color-muted);
  margin-left: auto;
}

.purchase__option {
  border: 0;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.purchase__values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/*
  Même vocabulaire que le bouton d'achat — famille, taille et rembourrage de
  `.button-minimal` — plutôt que le corps de texte, plus grand et plus lourd
  pour de simples puces de sélection. Le filet reste visible au repos : sans
  lui, un format non retenu ne se distingue plus d'un simple mot du texte.
*/
.purchase__value {
  position: relative;
  border: 1px solid var(--color-line);
  padding: 0.35rem 0.75rem;
  font-family: var(--font-titre);
  font-size: clamp(0.85rem, 1vw, 1rem);
  letter-spacing: var(--tracking-copy);
  cursor: pointer;
}

/* Le bouton radio reste focalisable au clavier : on le masque sans le retirer. */
.purchase__value input {
  position: absolute;
  opacity: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}

.purchase__value:hover {
  border-color: var(--color-ink);
}

.purchase__value:has(input:checked) {
  background: var(--color-surface-invert);
  border-color: var(--color-surface-invert);
  color: var(--color-ink-invert);
}

.purchase__value:has(input:focus-visible) {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

/*
  Un format momentanément épuisé reste sélectionnable : le visiteur voit alors
  le bouton passer en « Épuisé ». Le masquer laisserait croire qu'il n'existe pas.
*/
.purchase__value.is-unavailable span {
  text-decoration: line-through;
  color: var(--color-muted);
}

/*
  Stepper et bouton d'achat sur une même ligne. Le stepper reprend le
  vocabulaire du tiroir de panier — chiffre nu, pas de bordure — plutôt que
  des carrés pleins : deux styles de pas à pas sur le même parcours d'achat
  auraient créé une incohérence, pas une variation voulue.
*/
.purchase__action {
  display: flex;
  align-items: stretch;
  gap: 1rem;
}

.purchase__stepper {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.purchase__step {
  background: none;
  border: 0;
  padding: 0.2rem 0.6rem;
  color: inherit;
  cursor: pointer;
  font: inherit;
  line-height: 1.4;
}

.purchase__step:hover:not(:disabled) {
  background: color-mix(in oklab, var(--color-surface-alt) 55%, var(--color-surface));
}

.purchase__step:disabled {
  color: var(--color-muted);
  cursor: not-allowed;
}

.purchase__step:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: -2px;
}

.purchase__count {
  min-width: 2ch;
  padding: 0.2rem 0.1rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

/*
  Le bouton reprend `.button-minimal` — sa flèche, son soulignement animé — et
  ne réécrit que ce qui distingue une action d'achat d'un lien : le fond plein.
  Le rembourrage est resserré pour rester dans le même registre graphique.
*/
.purchase__submit {
  flex: 1;
  justify-content: center;
  background: var(--color-surface-invert);
  color: var(--color-ink-invert);
  border: 1px solid var(--color-surface-invert);
  padding: 0.42rem 1.1rem;
  cursor: pointer;
}

.purchase__submit:disabled {
  background: transparent;
  color: var(--color-muted);
  border-color: var(--color-line);
  cursor: not-allowed;
}

.purchase__error {
  margin: 0;
  color: var(--color-muted);
}
</style>

import { shopifyFetch } from './client';
import { shopifyConfigured } from './env';
import {
  COMMON_FACTS,
  FAMILIES,
  GAUGE_SHOW,
  PRODUCT_CONDITION,
  toFamily,
} from './families';
import {
  collectionByHandleQuery,
  collectionsQuery,
  productByHandleQuery,
  productHandlesQuery,
  shopCollectionsQuery,
} from './queries';
import type { FamilyFact, ProductFamily } from './families';
import type {
  Collection,
  CollectionCard,
  Money,
  Product,
  ProductCard,
  ProductFact,
  ProductMedia,
  ProductOption,
  ProductVariant,
  ShopImage,
  VideoSource,
} from './types';

interface RawCollection {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string | null;
  image: ShopImage | null;
  products: { nodes: RawProductCard[] };
}

/**
 * Lecture du catalogue.
 *
 * Ce module est la seule frontière entre la forme de l'API Shopify et celle du
 * site. Les composants ne voient jamais un `priceRange.minVariantPrice` ni un
 * `optionValues[].name` : ils reçoivent des objets déjà mis à plat. Le jour où
 * Shopify réorganise ses champs, un seul fichier bouge.
 *
 * Toutes les fonctions renvoient une valeur vide plutôt que de lever, afin
 * qu'une boutique non configurée ou momentanément injoignable ne casse pas la
 * construction du reste du site.
 */

/* ── Formes brutes de l'API ─────────────────────────────────────────────── */

interface RawMedia {
  mediaContentType: ProductMedia['type'];
  alt: string | null;
  previewImage: ShopImage | null;
  sources?: VideoSource[];
}

interface RawProductAvailability {
  availableForSale: boolean;
  variants: {
    nodes: Array<{ availableForSale: boolean; currentlyNotInStock: boolean }>;
  };
}

interface RawProductCard extends RawProductAvailability {
  id: string;
  handle: string;
  title: string;
  productType: string | null;
  excerpt: string | null;
  media: { nodes: RawMedia[] };
  options: Array<{ name: string; optionValues: Array<{ name: string }> }>;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
}

interface RawMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

interface RawVariant {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  quantityAvailable?: number | null;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface RawProduct extends RawProductCard {
  descriptionHtml: string | null;
  tags: string[];
  /** Liste complète des médias — voir l'alias dans `productByHandleQuery`. */
  allMedia: { nodes: RawMedia[] };
  variants: { nodes: RawVariant[] };
  /*
    Un emplacement par identifiant demandé, dans l'ordre de la demande, et
    `null` là où le produit ne porte rien. On n'exploite jamais les positions :
    la liste est indexée par `namespace.key` dès la conversion.
  */
  metafields: Array<RawMetafield | null>;
  collections: { nodes: Array<{ handle: string }> };
}

/* ── Conversion ─────────────────────────────────────────────────────────── */

function isHls(mimeType: string): boolean {
  return mimeType.includes('mpegurl');
}

function toMedia(raw: RawMedia): ProductMedia {
  return {
    type: raw.mediaContentType,
    alt: raw.alt,
    preview: raw.previewImage,
    /*
      Le flux HLS (`.m3u8`) passe devant : Safari le lit nativement et adapte la
      qualité au réseau. Les autres navigateurs déclarent ne pas savoir le lire
      et descendent d'eux-mêmes au MP4 suivant. Aucune bibliothèque nécessaire,
      chaque navigateur prend la meilleure source qu'il sait décoder.
    */
    sources: [...(raw.sources ?? [])].sort(
      (a, b) => Number(isHls(b.mimeType)) - Number(isHls(a.mimeType)),
    ),
  };
}

/**
 * Met en forme la valeur d'un metafield pour l'affichage.
 *
 * Un metafield de type date arrive en `AAAA-MM-JJ` brut ; on le formate à la
 * française plutôt que de l'afficher tel quel. Tout autre type — texte libre,
 * choix limité — ressort inchangé, débarrassé de ses espaces de bord.
 */
function formatMetafield(metafield: RawMetafield | null, locale = 'fr-BE'): string | null {
  if (!metafield) return null;

  const isDateType = metafield.type === 'date' || metafield.type === 'date_time';
  if (!isDateType) return metafield.value.trim() || null;

  const date = new Date(metafield.value);
  if (Number.isNaN(date.getTime())) return metafield.value;

  /*
    Fuseau du studio fixé en dur plutôt que laissé au fuseau par défaut : le
    site est généré statiquement, et le fuseau « par défaut » serait alors
    celui de la machine de build — imprévisible et sans rapport avec Bruxelles.
    L'heure ne s'affiche que pour un type `date_time` : un simple type `date`
    n'en porte pas, et Shopify le renvoie à minuit UTC, ce qui afficherait une
    heure jamais saisie par la cliente.
  */
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: metafield.type === 'date_time' ? 'short' : undefined,
    timeZone: 'Europe/Brussels',
  }).format(date);
}

/**
 * Range les metafields par `namespace.key`.
 *
 * Les emplacements vides sont écartés ici une bonne fois : un champ créé dans
 * l'admin mais jamais rempli revient en chaîne vide, et une fiche technique
 * n'a pas à porter une étiquette sans réponse en face.
 */
function indexMetafields(raw: Array<RawMetafield | null>): Map<string, RawMetafield> {
  const index = new Map<string, RawMetafield>();

  for (const metafield of raw) {
    if (!metafield || !metafield.value.trim()) continue;
    index.set(`${metafield.namespace}.${metafield.key}`, metafield);
  }

  return index;
}

function readFact(fact: FamilyFact, index: Map<string, RawMetafield>): ProductFact | null {
  const found =
    index.get(`${fact.namespace}.${fact.key}`) ??
    (fact.legacy ? index.get(`${fact.legacy.namespace}.${fact.legacy.key}`) : undefined);

  const value = formatMetafield(found ?? null);
  return value ? { label: fact.label, value } : null;
}

/**
 * Fiche technique d'un produit : les champs de sa famille, puis les champs
 * communs. Un produit sans famille n'affiche que les communs.
 */
function toFacts(
  family: ProductFamily | null,
  index: Map<string, RawMetafield>,
): ProductFact[] {
  const declared = family ? FAMILIES[family].facts : [];

  return [
    ...declared.map((fact) => readFact(fact, index)),
    ...COMMON_FACTS.map((fact) => readFact(fact, index)),
  ].filter((fact): fact is ProductFact => fact !== null);
}

function toVariant(raw: RawVariant): ProductVariant {
  const rawQuantity =
    typeof raw.quantityAvailable === 'number' ? Math.max(0, raw.quantityAvailable) : null;
  const inventoryIsNotTracked =
    raw.availableForSale && !raw.currentlyNotInStock && rawQuantity === 0;

  return {
    id: raw.id,
    title: raw.title,
    sku: raw.sku,
    availableForSale: raw.availableForSale && !raw.currentlyNotInStock,
    quantityAvailable: inventoryIsNotTracked ? null : rawQuantity,
    price: raw.price,
    compareAtPrice: raw.compareAtPrice,
    selectedOptions: raw.selectedOptions,
  };
}

function toOptions(raw: RawProductCard['options']): ProductOption[] {
  return (
    raw
      /*
        Shopify crée une option fantôme « Title » avec l'unique valeur
        « Default Title » sur les produits sans variantes. Elle n'a aucun sens
        pour un visiteur : on l'écarte ici plutôt que dans chaque vue.
      */
      .filter((option) => !(option.name === 'Title' && option.optionValues.length === 1))
      .map((option) => ({
        name: option.name,
        values: option.optionValues.map((value) => value.name),
      }))
  );
}

function toProductCard(raw: RawProductCard): ProductCard {
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    availableForSale: raw.availableForSale,
    excerpt: raw.excerpt?.trim() ?? '',
    cover: raw.media.nodes[0] ? toMedia(raw.media.nodes[0]) : null,
    hover: raw.media.nodes[1] ? toMedia(raw.media.nodes[1]) : null,
    options: toOptions(raw.options),
    minPrice: raw.priceRange.minVariantPrice,
    maxPrice: raw.priceRange.maxVariantPrice,
    family: toFamily(raw.productType),
  };
}

/**
 * Un produit reste visible si au moins une variante peut réellement être
 * achetée sans être en rupture. `currentlyNotInStock` distingue la vente en
 * rupture d'un produit disponible dont l'inventaire n'est pas suivi : tous deux
 * peuvent annoncer une quantité nulle, mais seul le premier doit disparaître.
 */
function isProductInStock(raw: RawProductAvailability): boolean {
  if (!raw.availableForSale) return false;

  return raw.variants.nodes.some(
    (variant) =>
      variant.availableForSale &&
      !variant.currentlyNotInStock,
  );
}

/* ── Lecture ────────────────────────────────────────────────────────────── */

/** Fiche d'un tirage. `null` s'il n'existe pas, n'est plus publié ou est épuisé. */
export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<{ product: RawProduct | null }>({
    query: productByHandleQuery,
    variables: { handle },
    fallback: { product: null },
  });

  const raw = data.product;
  if (!raw || !isProductInStock(raw)) return null;

  const card = toProductCard(raw);
  const variants = raw.variants.nodes.map(toVariant);
  const metafields = indexMetafields(raw.metafields);

  return {
    ...card,
    descriptionHtml: raw.descriptionHtml ?? '',
    tags: raw.tags,
    media: raw.allMedia.nodes.map(toMedia),
    variants,
    facts: toFacts(card.family, metafields),
    hasCondition: readFact(PRODUCT_CONDITION, metafields) !== null,
    showGauge: metafields.get(`${GAUGE_SHOW.namespace}.${GAUGE_SHOW.key}`)?.value === 'true',
    collectionHandles: raw.collections.nodes.map((collection) => collection.handle),
    primaryCollectionHandle: raw.collections.nodes[0]?.handle ?? null,
  };
}

/**
 * Identifiants d'URL des tirages encore achetables — alimente `getStaticPaths()`.
 *
 * Requête volontairement minimale : au build, on n'a besoin que des handles.
 * Le plafond de 250 est celui de l'API ; au-delà il faudra paginer, ce qui n'a
 * pas lieu d'être tant que le catalogue tient en dizaines de tirages.
 */
export async function getProductHandles(): Promise<string[]> {
  if (!shopifyConfigured) return [];

  const data = await shopifyFetch<{
    products: { nodes: Array<RawProductAvailability & { handle: string }> };
  }>({
    query: productHandlesQuery,
    variables: { first: 250 },
    fallback: { products: { nodes: [] } },
  });

  return data.products.nodes
    .filter(isProductInStock)
    .map((node) => node.handle);
}

/** Collections publiées, pour la navigation de la boutique. */
export async function getCollections(): Promise<Array<Pick<Collection, 'id' | 'handle' | 'title'>>> {
  const data = await shopifyFetch<{
    collections: { nodes: Array<{ id: string; handle: string; title: string }> };
  }>({
    query: collectionsQuery,
    variables: { first: 20 },
    fallback: { collections: { nodes: [] } },
  });

  return data.collections.nodes;
}

/**
 * Collections telles que les présente l'index de la boutique.
 *
 * ── Pourquoi l'index ne montre plus les tirages ─────────────────────────────
 * La boutique affichait tout le catalogue d'un seul tenant, collections
 * confondues. On y voyait des objets, pas un propos : « ce qui se contemple »,
 * « ce qui s'utilise », « ce qui se transmet » sont trois manières de tenir un
 * objet, et c'est ce classement qui dit quelque chose du studio. Mélangés, les
 * tirages l'effacent.
 *
 * L'index annonce donc les trois entrées et leur nombre de pièces ; les pièces
 * elles-mêmes ne se voient qu'en entrant dans une collection, et jamais avec
 * celles d'une autre.
 */
export async function getShopCollections(): Promise<CollectionCard[]> {
  const data = await shopifyFetch<{
    collections: {
      nodes: Array<{
        id: string;
        handle: string;
        title: string;
        description: string | null;
        image: ShopImage | null;
        products: { nodes: RawProductAvailability[] };
      }>;
    };
  }>({
    query: shopCollectionsQuery,
    variables: { first: 20, products: 100 },
    fallback: { collections: { nodes: [] } },
  });

  return data.collections.nodes.map((node) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description?.trim() ?? '',
    image: node.image,
    count: node.products.nodes.filter(isProductInStock).length,
  }));
}

/**
 * Numéro de classement d'une collection — « 01 », « 02 »…
 *
 * C'est le RANG dans la liste des collections, celui-là même qu'affiche l'index
 * de la boutique sur ses intercalaires et en tête de notice. Un repère de
 * classement ne vaut que s'il désigne la même chose partout : la page d'une
 * collection le reprend donc, plutôt que d'en inventer un second.
 *
 * `getCollections()` et non `getShopCollections()` : c'est la requête légère,
 * déjà émise par le rail sur chaque page. Les deux interrogent `collections`
 * sans tri explicite et reçoivent donc le même ordre.
 *
 * `null` sur une collection introuvable — mieux vaut un titre sans numéro qu'un
 * numéro faux.
 */
export async function getCollectionFolio(handle: string): Promise<string | null> {
  const collections = await getCollections();
  const rank = collections.findIndex((collection) => collection.handle === handle);

  return rank === -1 ? null : String(rank + 1).padStart(2, '0');
}

/** Identifiants d'URL de toutes les collections — alimente `getStaticPaths()`. */
export async function getCollectionHandles(): Promise<string[]> {
  if (!shopifyConfigured) return [];
  const collections = await getCollections();
  return collections.map((collection) => collection.handle);
}

/** Une collection et ses tirages disponibles. `null` si elle n'existe pas ou n'est plus publiée. */
export async function getCollectionByHandle(handle: string): Promise<Collection | null> {
  const data = await shopifyFetch<{ collection: RawCollection | null }>({
    query: collectionByHandleQuery,
    variables: { handle, first: 50 },
    fallback: { collection: null },
  });

  const raw = data.collection;
  if (!raw) return null;

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    descriptionHtml: raw.descriptionHtml ?? '',
    image: raw.image,
    products: raw.products.nodes
      .filter(isProductInStock)
      .map(toProductCard),
  };
}

/* ── Présentation ───────────────────────────────────────────────────────── */

/**
 * Formate un montant Shopify pour l'affichage.
 *
 * Les prix arrivent en chaîne (« 45.00 ») précisément pour éviter les arrondis
 * flottants ; on ne les convertit qu'au dernier moment. Les décimales sont
 * masquées sur les montants ronds : « 45 € » plutôt que « 45,00 € », plus juste
 * pour une boutique de tirages.
 */
export function formatMoney(money: Money, locale = 'fr-BE'): string {
  const amount = Number(money.amount);
  const hasCents = !Number.isInteger(amount);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** `true` quand un tirage se vend à prix unique, sans fourchette de formats. */
export function hasSinglePrice(product: ProductCard): boolean {
  return product.minPrice.amount === product.maxPrice.amount;
}

/**
 * URL d'image redimensionnée par le CDN Shopify.
 *
 * Indispensable : les visuels d'atelier montent à 3840 px de large. Les servir
 * tels quels dans une grille ruinerait le LCP. Le CDN accepte un paramètre
 * `width` et renvoie une version redimensionnée, mise en cache de son côté.
 */
export function shopifyImageUrl(url: string, width: number): string {
  const parsed = new URL(url);
  parsed.searchParams.set('width', String(width));
  return parsed.toString();
}

/** Jeu de largeurs pour un `srcset`, du mobile au grand écran. */
export function shopifyImageSrcSet(
  url: string,
  widths: number[] = [400, 600, 800, 1200, 1600],
): string {
  return widths.map((width) => `${shopifyImageUrl(url, width)} ${width}w`).join(', ');
}

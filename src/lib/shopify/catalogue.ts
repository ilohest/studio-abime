import { shopifyFetch } from './client';
import { shopifyConfigured } from './env';
import {
  collectionByHandleQuery,
  collectionsQuery,
  productByHandleQuery,
  productHandlesQuery,
  productsQuery,
} from './queries';
import type {
  Collection,
  Money,
  Product,
  ProductCard,
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

interface RawProductCard {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  excerpt: string | null;
  media: { nodes: RawMedia[] };
  options: Array<{ name: string; optionValues: Array<{ name: string }> }>;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
}

interface RawMetafield {
  value: string;
  type: string;
}

interface RawProduct extends RawProductCard {
  descriptionHtml: string | null;
  tags: string[];
  /** Liste complète des médias — voir l'alias dans `productByHandleQuery`. */
  allMedia: { nodes: RawMedia[] };
  variants: { nodes: Array<Omit<ProductVariant, 'selectedOptions'> & { selectedOptions: ProductVariant['selectedOptions'] }> };
  whereInfo: RawMetafield | null;
  whenInfo: RawMetafield | null;
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
 * française plutôt que de l'afficher tel quel. Tout autre type (texte libre,
 * la forme la plus probable pour « Où ») ressort inchangé.
 */
function formatMetafield(metafield: RawMetafield | null, locale = 'fr-BE'): string | null {
  if (!metafield) return null;

  const isDateType = metafield.type === 'date' || metafield.type === 'date_time';
  if (!isDateType) return metafield.value;

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
  };
}

/* ── Lecture ────────────────────────────────────────────────────────────── */

/** Catalogue complet, du plus récent au plus ancien. */
export async function getProducts(first = 50): Promise<ProductCard[]> {
  const data = await shopifyFetch<{ products: { nodes: RawProductCard[] } }>({
    query: productsQuery,
    variables: { first },
    fallback: { products: { nodes: [] } },
  });

  return data.products.nodes.map(toProductCard);
}

/** Fiche d'un tirage. `null` si le handle n'existe pas ou n'est plus publié. */
export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<{ product: RawProduct | null }>({
    query: productByHandleQuery,
    variables: { handle },
    fallback: { product: null },
  });

  const raw = data.product;
  if (!raw) return null;

  return {
    ...toProductCard(raw),
    descriptionHtml: raw.descriptionHtml ?? '',
    tags: raw.tags,
    media: raw.allMedia.nodes.map(toMedia),
    variants: raw.variants.nodes,
    where: formatMetafield(raw.whereInfo),
    when: formatMetafield(raw.whenInfo),
    primaryCollectionHandle: raw.collections.nodes[0]?.handle ?? null,
  };
}

/**
 * Identifiants d'URL de tous les tirages — alimente `getStaticPaths()`.
 *
 * Requête volontairement minimale : au build, on n'a besoin que des handles.
 * Le plafond de 250 est celui de l'API ; au-delà il faudra paginer, ce qui n'a
 * pas lieu d'être tant que le catalogue tient en dizaines de tirages.
 */
export async function getProductHandles(): Promise<string[]> {
  if (!shopifyConfigured) return [];

  const data = await shopifyFetch<{ products: { nodes: Array<{ handle: string }> } }>({
    query: productHandlesQuery,
    variables: { first: 250 },
    fallback: { products: { nodes: [] } },
  });

  return data.products.nodes.map((node) => node.handle);
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

/** Identifiants d'URL de toutes les collections — alimente `getStaticPaths()`. */
export async function getCollectionHandles(): Promise<string[]> {
  if (!shopifyConfigured) return [];
  const collections = await getCollections();
  return collections.map((collection) => collection.handle);
}

/** Une collection et ses tirages. `null` si le handle n'existe pas ou n'est plus publié. */
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
    products: raw.products.nodes.map(toProductCard),
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
 * Résumé des choix disponibles : « 4 formats », « 4 formats · 2 papiers ».
 * Chaîne vide pour un tirage sans option, qui ne doit alors rien afficher.
 */
export function summarizeOptions(product: ProductCard): string {
  return product.options
    .filter((option) => option.values.length > 1)
    .map((option) => `${option.values.length} ${option.name.toLowerCase()}s`)
    .join(' · ');
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

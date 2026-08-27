/**
 * Types du catalogue Shopify.
 *
 * Volontairement plus étroits que le schéma réel de l'API : on ne déclare que ce
 * que le site affiche. Une requête qui demanderait davantage sans que le type
 * suive serait un signal — soit le champ est utile et il rejoint ce fichier,
 * soit il ne l'est pas et il quitte la requête.
 */

/** Montant Shopify : la valeur arrive en chaîne pour éviter les arrondis flottants. */
export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ShopImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

/** Source lisible d'une vidéo produit. */
export interface VideoSource {
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}

/**
 * Un média produit, image ou vidéo.
 *
 * `preview` est toujours renseigné quand Shopify sait produire une vignette :
 * c'est ce qui permet aux vues de composer sans distinguer les deux natures,
 * et de n'activer la lecture que là où elle a un sens.
 */
export interface ProductMedia {
  type: 'IMAGE' | 'VIDEO' | 'EXTERNAL_VIDEO' | 'MODEL_3D';
  alt: string | null;
  preview: ShopImage | null;
  /** Vide pour une image ; classées de la plus légère à la plus lourde pour une vidéo. */
  sources: VideoSource[];
}

/** Un axe de choix : « Format », « Papier », « Encadrement ». */
export interface ProductOption {
  name: string;
  values: string[];
}

/** Combinaison achetable : un format précis, dans un papier précis. */
export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  /*
    Pas de `quantityAvailable` ici volontairement : ce champ exige la portée
    `unauthenticated_read_product_inventory`, non accordée à l'app Headless par
    défaut. Il ne sert qu'à afficher le nombre d'exemplaires restants, c'est-à-dire
    l'option « éditions limitées ». `availableForSale` couvre le besoin de base.
  */
  price: Money;
  compareAtPrice: Money | null;
  /** Valeurs choisies sur chaque axe, dans l'ordre des options du produit. */
  selectedOptions: Array<{ name: string; value: string }>;
}

/** Ce qu'une bande de l'index affiche. */
export interface ProductCard {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  /** Le propos, en texte brut tronqué. Chaîne vide tant que la description manque. */
  excerpt: string;
  /** Premier média, quelle que soit sa nature. `null` si le tirage n'a aucun visuel. */
  cover: ProductMedia | null;
  /** Second média, révélé au survol. `null` quand le tirage n'en a qu'un. */
  hover: ProductMedia | null;
  options: ProductOption[];
  minPrice: Money;
  maxPrice: Money;
}

/** Fiche complète. */
export interface Product extends ProductCard {
  descriptionHtml: string;
  media: ProductMedia[];
  variants: ProductVariant[];
  /** Étiquettes Shopify — servent à relier un tirage à sa série. */
  tags: string[];
  /**
   * Metafields « Où » / « Quand » — renseignés seulement sur certains
   * tirages (la collection « Outils de com »). `null` sur tout le reste du
   * catalogue : ce n'est pas une fiche technique obligatoire.
   */
  where: string | null;
  when: string | null;
  /** Handle de la première collection du tirage — `null` s'il n'en a aucune. */
  primaryCollectionHandle: string | null;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  image: ShopImage | null;
  products: ProductCard[];
}

/** Retour du test de connexion — sert uniquement au diagnostic. */
export interface ShopInfo {
  name: string;
  primaryDomain: { url: string };
  paymentSettings: { currencyCode: string };
}

/**
 * Requêtes GraphQL Storefront.
 *
 * Les fragments sont déclarés une fois et composés : le jour où une bande doit
 * afficher un champ de plus, un seul endroit change et toutes les vues suivent.
 *
 * Les connexions Shopify sont interrogées via `nodes` plutôt que `edges { node }` :
 * même résultat, moitié moins de bruit dans les réponses.
 *
 * Le visuel passe par `media` et jamais par `featuredImage`. Raison : un produit
 * dont le premier média est une vidéo n'a pas de `featuredImage` — le champ est
 * l'équivalent de `images(first: 1)` et ignore les vidéos. `media` traite les
 * deux natures de la même façon, et `previewImage` donne une image fixe dans les
 * deux cas.
 */

/** Ce qu'une bande de l'index a besoin de connaître. */
export const productCardFragment = /* GraphQL */ `
  fragment ProductCard on Product {
    id
    handle
    title
    availableForSale
    # Texte brut tronqué : le propos affiché dans l'index, sans balises à nettoyer.
    excerpt: description(truncateAt: 260)
    # Deux médias : le premier s'affiche, le second apparaît au survol.
    media(first: 2) {
      nodes {
        mediaContentType
        alt
        previewImage {
          url
          altText
          width
          height
        }
        # Les sources vidéo sont demandées dès la carte : sans elles, un tirage
        # filmé retomberait sur son affiche fixe dans la grille.
        ... on Video {
          sources {
            url
            mimeType
            width
            height
          }
        }
      }
    }
    options {
      name
      optionValues {
        name
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
  }
`;

/**
 * Test de connexion.
 *
 * Volontairement minimal : ces trois champs existent dans toutes les versions de
 * l'API, ce qui permet de distinguer un problème d'identifiants d'un problème
 * de requête. Si celle-ci échoue, le souci est la configuration, pas le code.
 */
export const shopInfoQuery = /* GraphQL */ `
  query ShopInfo {
    shop {
      name
      primaryDomain {
        url
      }
      paymentSettings {
        currencyCode
      }
    }
  }
`;

/** Catalogue complet, trié du plus récent au plus ancien. */
export const productsQuery = /* GraphQL */ `
  ${productCardFragment}
  query Products($first: Int = 50) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductCard
      }
    }
  }
`;

/**
 * Identifiants d'URL seuls — alimente `getStaticPaths()`.
 * Aucun champ superflu : cette requête tourne à chaque build.
 */
export const productHandlesQuery = /* GraphQL */ `
  query ProductHandles($first: Int = 250) {
    products(first: $first) {
      nodes {
        handle
      }
    }
  }
`;

/** Fiche complète : tous les médias, toutes les variantes. */
export const productByHandleQuery = /* GraphQL */ `
  ${productCardFragment}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductCard
      descriptionHtml
      tags
      # Une seule collection : c'est elle qui alimente les suggestions en bas
      # de fiche. Un tirage peut en porter plusieurs dans l'admin ; on ne
      # retient que la première, dans l'ordre où Shopify les renvoie.
      collections(first: 1) {
        nodes {
          handle
        }
      }
      # Metafields du produit — remplis uniquement sur certains tirages
      # (la collection « Outils de com »). Le champ type sert à distinguer
      # une date d'un simple texte libre au moment de l'affichage.
      whereInfo: metafield(namespace: "custom", key: "ou") {
        value
        type
      }
      whenInfo: metafield(namespace: "custom", key: "quand") {
        value
        type
      }
      # Alias obligatoire : le fragment ProductCard demande déjà media(first: 2)
      # et GraphQL refuse un même champ avec deux jeux d'arguments.
      allMedia: media(first: 20) {
        nodes {
          mediaContentType
          alt
          previewImage {
            url
            altText
            width
            height
          }
          ... on Video {
            sources {
              url
              mimeType
              width
              height
            }
          }
        }
      }
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

/** Collection et ses tirages, dans l'ordre défini dans l'admin Shopify. */
export const collectionByHandleQuery = /* GraphQL */ `
  ${productCardFragment}
  query CollectionByHandle($handle: String!, $first: Int = 50) {
    collection(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      image {
        url
        altText
        width
        height
      }
      products(first: $first) {
        nodes {
          ...ProductCard
        }
      }
    }
  }
`;

/** Liste des collections — alimente la navigation de la boutique. */
export const collectionsQuery = /* GraphQL */ `
  query Collections($first: Int = 20) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
      }
    }
  }
`;

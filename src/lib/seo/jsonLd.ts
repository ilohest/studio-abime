/**
 * Données structurées Schema.org.
 *
 * ── Pourquoi un graphe et non des blocs indépendants ─────────────────────────
 * Chaque page émet UN seul `<script type="application/ld+json">` contenant un
 * `@graph` : une liste de nœuds qui se citent les uns les autres par `@id`.
 * L'alternative — un bloc `Organization`, un bloc `WebPage`, un bloc `Product`
 * côte à côte — oblige les moteurs à deviner que ces trois objets parlent du
 * même site. Avec des `@id` stables, ils le savent : le studio décrit sur la
 * page d'accueil est littéralement la même entité que le vendeur d'un tirage et
 * que l'auteur d'un article. C'est cette continuité qui permet à Google de
 * constituer une entité « Studio Abîme » plutôt qu'une collection de pages.
 *
 * ── Règle absolue : ne jamais inventer ───────────────────────────────────────
 * `compact()` retire toute valeur vide avant sérialisation. Un champ que le CMS
 * ne renseigne pas n'apparaît pas dans le graphe. Une donnée structurée fausse
 * coûte plus cher qu'une donnée absente : elle peut valoir une pénalité
 * manuelle, là où un champ manquant ne vaut qu'un affichage moins riche.
 *
 * ── Stega ────────────────────────────────────────────────────────────────────
 * En mode édition visuelle, Sanity injecte des caractères invisibles dans les
 * chaînes pour rendre chaque texte cliquable. Ils n'ont rien à faire dans du
 * JSON destiné aux machines : `clean()` les retire systématiquement.
 */
import { stegaClean } from '@sanity/client/stega';

import { getLocaleMeta, type Locale } from '~/i18n/config';
import {
  journalIndexPath,
  localizedPath,
  projectsIndexPath,
  shopIndexPath,
  type PolicyRouteKey,
} from '~/i18n/routes';
import { useTranslations } from '~/i18n/ui';
import { getJournalCategory } from '~/content/journalCategories';
import { resolveImage, type AspectRatio } from '~/lib/sanity/image';
import { shopifyImageUrl } from '~/lib/shopify/catalogue';
import type {
  Page,
  Post,
  PostCard,
  Project,
  ProjectCard,
  SanityImage,
  SiteContext,
} from '~/lib/sanity/types';
import type {
  Collection as ShopCollection,
  Product as ShopProduct,
  ProductCard as ShopProductCard,
} from '~/lib/shopify/types';
import type { RouteEntry } from '~/lib/sanity/types';

export type JsonLdNode = Record<string, unknown>;

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
}

/* -------------------------------------------------------------------------- */
/* Outils                                                                      */
/* -------------------------------------------------------------------------- */

/** Chaîne nettoyée du stega et des blancs. `undefined` si elle ne dit rien. */
function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = stegaClean(value).replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : undefined;
}

/** Retire récursivement tout ce qui est vide : c'est ce qui garantit qu'on n'invente rien. */
function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    const items = value.map(compact).filter((item) => item !== undefined);
    return (items.length > 0 ? items : undefined) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter(([, item]) => item !== undefined && item !== null && item !== '');

    return (entries.length > 0 ? Object.fromEntries(entries) : undefined) as T;
  }

  if (value === null || value === '') return undefined as T;
  return value;
}

/** URL absolue à partir d'un chemin du site. */
function abs(path: string, origin: string): string {
  return new URL(path, origin).toString();
}

/** Référence à un autre nœud du graphe. */
function ref(id: string): JsonLdNode {
  return { '@id': id };
}

/**
 * Date au format attendu par Schema.org (ISO 8601).
 * Une date illisible est écartée plutôt que transmise telle quelle.
 */
function isoDate(value: string | undefined | null): string | undefined {
  const raw = clean(value);
  if (!raw) return undefined;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

/** Texte de description ramené à une longueur raisonnable pour un extrait. */
function summarize(value: unknown, max = 300): string | undefined {
  const text = clean(value);
  if (!text) return undefined;
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Description tirée d'un HTML Shopify (les fiches produit arrivent en HTML). */
function summarizeHtml(html: string | undefined, max = 300): string | undefined {
  if (!html) return undefined;
  return summarize(html.replace(/<[^>]*>/g, ' '), max);
}

/* -------------------------------------------------------------------------- */
/* Images                                                                      */
/* -------------------------------------------------------------------------- */

export interface ImageInput {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** `ImageObject` complet : les dimensions aident Google à choisir un recadrage. */
function imageNode(image: ImageInput | null | undefined, id?: string): JsonLdNode | undefined {
  if (!image?.url) return undefined;

  return compact({
    '@type': 'ImageObject',
    '@id': id,
    url: image.url,
    contentUrl: image.url,
    width: image.width,
    height: image.height,
    caption: clean(image.alt),
  });
}

/** Convertit une image Sanity en entrée d'image absolue. */
export function fromSanityImage(
  image: SanityImage | null | undefined,
  origin: string,
  options: { width?: number; ratio?: AspectRatio } = {},
): ImageInput | null {
  const resolved = resolveImage(image, { width: options.width ?? 1200, ratio: options.ratio });
  if (!resolved) return null;

  return {
    url: abs(resolved.src, origin),
    width: resolved.width,
    height: resolved.height,
    alt: clean(resolved.alt),
  };
}

/** Convertit un média Shopify (image ou vignette de vidéo) en entrée d'image. */
export function fromShopMedia(product: ShopProduct | ShopProductCard, width = 1200): ImageInput | null {
  const preview = product.cover?.preview;
  if (!preview?.url) return null;

  return {
    url: shopifyImageUrl(preview.url, width),
    alt: clean(preview.altText ?? product.title),
  };
}

/* -------------------------------------------------------------------------- */
/* Identifiants stables du graphe                                              */
/* -------------------------------------------------------------------------- */

const ids = {
  organization: (origin: string) => `${origin}/#organization`,
  logo: (origin: string) => `${origin}/#logo`,
  website: (origin: string) => `${origin}/#website`,
  blog: (origin: string, locale: Locale) => `${abs(journalIndexPath(locale), origin)}#blog`,
  webPage: (canonical: string) => `${canonical}#webpage`,
  breadcrumb: (canonical: string) => `${canonical}#breadcrumb`,
  primaryImage: (canonical: string) => `${canonical}#primaryimage`,
  entity: (canonical: string, suffix: string) => `${canonical}#${suffix}`,
};

/* -------------------------------------------------------------------------- */
/* Nœuds racines : l'entreprise et le site                                     */
/* -------------------------------------------------------------------------- */

/**
 * L'entreprise. Nœud pivot : tout le reste du graphe le cite — éditeur du site,
 * auteur des articles, créateur des projets, vendeur des tirages.
 *
 * Le type varie selon ce qui est renseigné : avec une adresse postale, le studio
 * devient aussi un `ProfessionalService`, ce qui le rend éligible aux résultats
 * locaux. Sans adresse, ce type serait incomplet et vaudrait mieux ne pas être
 * revendiqué — d'où la promotion conditionnelle.
 */
function organizationNode(site: SiteContext, origin: string, locale: Locale): JsonLdNode {
  const identity = site.settings?.organization ?? null;
  const name = clean(site.localized?.siteTitle) ?? 'Studio Abîme';

  const hasAddress = Boolean(clean(identity?.streetAddress) && clean(identity?.addressLocality));

  const address = hasAddress
    ? compact({
        '@type': 'PostalAddress',
        streetAddress: clean(identity?.streetAddress),
        postalCode: clean(identity?.postalCode),
        addressLocality: clean(identity?.addressLocality),
        addressCountry: clean(identity?.addressCountry),
      })
    : undefined;

  const logo = imageNode(
    fromSanityImage(identity?.logo, origin, { width: 512 }),
    ids.logo(origin),
  );

  const email = clean(identity?.email);
  const phone = clean(identity?.phone);

  return compact({
    '@type': hasAddress ? ['Organization', 'ProfessionalService'] : 'Organization',
    '@id': ids.organization(origin),
    name,
    legalName: clean(identity?.legalName),
    url: abs(localizedPath(locale), origin),
    description: summarize(site.localized?.siteDescription),
    logo,
    // `image` double `logo` volontairement : plusieurs consommateurs ne lisent
    // que l'un des deux, et Google demande explicitement les deux sur une fiche
    // d'entreprise.
    image: logo ? ref(ids.logo(origin)) : undefined,
    email,
    telephone: phone,
    vatID: clean(identity?.vatId),
    foundingDate: clean(identity?.foundingDate),
    address,
    /*
      Les profils officiels. C'est le signal de rattachement d'entité le plus
      simple et le plus fiable dont dispose un petit site : il relie le domaine
      à des comptes déjà connus des moteurs.
    */
    sameAs: site.settings?.socialLinks?.map((link) => clean(link.url)).filter(Boolean),
    /*
      Point de contact déclaré seulement si l'un des deux canaux existe : une
      fiche annonçant un service client sans moyen de le joindre ne rend service
      à personne.
    */
    contactPoint:
      email || phone
        ? compact({
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email,
            telephone: phone,
            availableLanguage: [getLocaleMeta(locale).htmlLang],
          })
        : undefined,
  });
}

/** Le site lui-même. Aucune `SearchAction` : il n'y a pas de recherche interne à annoncer. */
function webSiteNode(site: SiteContext, origin: string, locale: Locale): JsonLdNode {
  return compact({
    '@type': 'WebSite',
    '@id': ids.website(origin),
    url: abs(localizedPath(locale), origin),
    name: clean(site.localized?.siteTitle) ?? 'Studio Abîme',
    description: summarize(site.localized?.siteDescription),
    inLanguage: getLocaleMeta(locale).htmlLang,
    publisher: ref(ids.organization(origin)),
    copyrightHolder: ref(ids.organization(origin)),
  });
}

/* -------------------------------------------------------------------------- */
/* Fil d'Ariane                                                                */
/* -------------------------------------------------------------------------- */

interface Crumb {
  name: string;
  path: string;
}

/**
 * Fil d'Ariane de la page courante.
 *
 * Il n'existe pas à l'écran — la navigation du site vit en pied de page — mais
 * il existe dans la structure des URLs, et c'est cette structure que Google
 * affiche à la place de l'URL brute sous le titre d'un résultat. Le déclarer
 * revient à choisir « studioabime.com › Expériences › Nom du projet » plutôt
 * qu'une URL tronquée.
 */
function breadcrumbTrail(
  route: RouteEntry,
  locale: Locale,
  title: string,
): Crumb[] {
  const t = useTranslations(locale);
  const home: Crumb = { name: 'Accueil', path: localizedPath(locale) };

  const section = (key: 'projects' | 'journal' | 'shop'): Crumb =>
    key === 'projects'
      ? { name: t('nav.projects'), path: projectsIndexPath(locale) }
      : key === 'journal'
        ? { name: t('journal.title'), path: journalIndexPath(locale) }
        : { name: t('shop.title'), path: shopIndexPath(locale) };

  switch (route.kind) {
    case 'home':
      return [];
    case 'project':
      return [home, section('projects'), { name: title, path: route.path }];
    case 'post':
      return [home, section('journal'), { name: title, path: route.path }];
    /*
      Le segment « collections » est sauté : il n'a pas de page à lui. Un fil
      d'Ariane doit être cliquable de bout en bout — annoncer un niveau qui
      renvoie sur une 404 est pire que ne pas l'annoncer.
    */
    case 'product':
    case 'collection':
    case 'orderConfirmation':
      return [home, section('shop'), { name: title, path: route.path }];
    default:
      return [home, { name: title, path: route.path }];
  }
}

function breadcrumbNode(crumbs: Crumb[], origin: string, canonical: string): JsonLdNode | undefined {
  if (crumbs.length < 2) return undefined;

  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(canonical),
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: clean(crumb.name),
      item: abs(crumb.path, origin),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Listes                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Liste ordonnée des entrées d'un index.
 *
 * On ne décrit chaque entrée que par son URL et son nom : la fiche complète vit
 * sur sa propre page, la répéter ici ne ferait que multiplier les occasions de
 * divergence.
 */
function itemListNode(
  items: Array<{ name: string | undefined; path: string }>,
  origin: string,
  canonical: string,
): JsonLdNode | undefined {
  if (items.length === 0) return undefined;

  return {
    '@type': 'ItemList',
    '@id': ids.entity(canonical, 'itemlist'),
    numberOfItems: items.length,
    /*
      Pas d'`itemListOrder` : l'ordre d'un index ne se lit pas de la même façon
      partout (les projets sont antéchronologiques, la boutique suit l'ordre de
      l'admin Shopify). Déclarer un tri unique serait faux la moitié du temps.
    */
    itemListElement: items.map((item, index) =>
      compact({
        '@type': 'ListItem',
        position: index + 1,
        name: clean(item.name),
        url: abs(item.path, origin),
      }),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Entités de page                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Un projet est une œuvre, pas un article : `CreativeWork` décrit une
 * réalisation dont le studio est l'auteur, ce que ne fait ni `Article` (un
 * texte) ni `Product` (un bien à vendre).
 */
function projectNode(
  project: Project,
  origin: string,
  canonical: string,
  locale: Locale,
  image: ImageInput | null,
): JsonLdNode {
  return compact({
    '@type': 'CreativeWork',
    '@id': ids.entity(canonical, 'project'),
    url: canonical,
    name: clean(project.title),
    headline: clean(project.headline),
    description: summarize(project.excerpt),
    inLanguage: getLocaleMeta(locale).htmlLang,
    creator: ref(ids.organization(origin)),
    provider: ref(ids.organization(origin)),
    dateCreated: project.year ? String(project.year) : undefined,
    genre: clean(project.sector),
    keywords: project.services?.map((service) => clean(service)).filter(Boolean),
    image: image ? ref(ids.primaryImage(canonical)) : undefined,
    /*
      Le client commanditaire. `sourceOrganization` est le terme de Schema.org
      pour l'organisation à l'origine de l'œuvre — c'est exactement le rôle du
      commanditaire dans un projet de commande.
    */
    sourceOrganization: clean(project.client)
      ? { '@type': 'Organization', name: clean(project.client) }
      : undefined,
    isPartOf: ref(ids.website(origin)),
  });
}

/** Un article du Journal, rattaché au blog qui le contient. */
function blogPostingNode(
  post: Post,
  origin: string,
  canonical: string,
  locale: Locale,
  image: ImageInput | null,
  lastmod: string | undefined,
): JsonLdNode {
  const published = isoDate(post.publishedAt);

  return compact({
    '@type': 'BlogPosting',
    '@id': ids.entity(canonical, 'article'),
    url: canonical,
    headline: clean(post.title),
    alternativeHeadline: clean(post.standfirst),
    description: summarize(post.excerpt ?? post.standfirst),
    inLanguage: getLocaleMeta(locale).htmlLang,
    datePublished: published,
    // Sans révision connue, la date de publication fait foi : `dateModified`
    // est attendu par Google, et le laisser vide est pire que le répéter.
    dateModified: isoDate(lastmod) ?? published,
    // La rubrique est publiée sous son intitulé lisible, pas sous son
    // identifiant technique : c'est un libellé destiné à être lu.
    articleSection: getJournalCategory(stegaClean(post.category))?.title,
    author: ref(ids.organization(origin)),
    publisher: ref(ids.organization(origin)),
    image: image ? ref(ids.primaryImage(canonical)) : undefined,
    isPartOf: ref(ids.blog(origin, locale)),
    mainEntityOfPage: ref(ids.webPage(canonical)),
  });
}

/** L'index du Journal, en tant que blog — c'est lui que citent les articles. */
function blogNode(
  origin: string,
  locale: Locale,
  posts: PostCard[],
  title: string,
  description: string | undefined,
): JsonLdNode {
  return compact({
    '@type': 'Blog',
    '@id': ids.blog(origin, locale),
    url: abs(journalIndexPath(locale), origin),
    name: clean(title),
    description: summarize(description),
    inLanguage: getLocaleMeta(locale).htmlLang,
    publisher: ref(ids.organization(origin)),
    blogPost: posts.slice(0, 50).map((post) =>
      compact({
        '@type': 'BlogPosting',
        '@id': `${abs(`${journalIndexPath(locale)}/${post.slug}`, origin)}#article`,
        url: abs(`${journalIndexPath(locale)}/${post.slug}`, origin),
        headline: clean(post.title),
        datePublished: isoDate(post.publishedAt),
      }),
    ),
  });
}

/**
 * Une fiche de tirage.
 *
 * C'est le nœud qui a la valeur commerciale la plus directe : prix, devise et
 * disponibilité sont ce qui autorise Google à afficher un tirage dans les
 * résultats enrichis et dans l'onglet Shopping. Les variantes sont déclarées
 * une à une sous une `AggregateOffer` : un tirage vendu en trois formats a
 * trois prix, et n'en annoncer qu'un exposerait à un écart entre le prix promis
 * dans les résultats et le prix affiché sur la page.
 */
function productNode(
  product: ShopProduct,
  origin: string,
  canonical: string,
  image: ImageInput | null,
): JsonLdNode {
  const availability = (available: boolean) =>
    available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  const offers = product.variants.map((variant) =>
    compact({
      '@type': 'Offer',
      '@id': ids.entity(canonical, `offer-${variant.id.split('/').pop()}`),
      name: clean(variant.title),
      sku: variant.sku ?? undefined,
      url: canonical,
      price: variant.price.amount,
      priceCurrency: variant.price.currencyCode,
      availability: availability(variant.availableForSale),
      itemCondition: 'https://schema.org/NewCondition',
      seller: ref(ids.organization(origin)),
    }),
  );

  const singlePrice = product.minPrice.amount === product.maxPrice.amount;

  return compact({
    '@type': 'Product',
    '@id': ids.entity(canonical, 'product'),
    url: canonical,
    name: clean(product.title),
    description: summarizeHtml(product.descriptionHtml) || summarize(product.excerpt),
    /*
      Le `handle` fait office d'identifiant marchand du tirage : c'est la clé
      unique du catalogue Shopify, celle qui figure dans l'URL. Les SKU réels,
      eux, sont portés par les variantes, chacune sur son offre.
    */
    sku: product.handle,
    image: image ? ref(ids.primaryImage(canonical)) : undefined,
    brand: ref(ids.organization(origin)),
    keywords: product.tags?.map((tag) => clean(tag)).filter(Boolean),
    /*
      Un seul prix ⇒ une `Offer` simple, la forme que Google traite le mieux.
      Plusieurs prix ⇒ une fourchette, avec le détail des variantes dessous.
    */
    offers:
      singlePrice && offers.length <= 1
        ? offers[0]
        : compact({
            '@type': 'AggregateOffer',
            priceCurrency: product.minPrice.currencyCode,
            lowPrice: product.minPrice.amount,
            highPrice: product.maxPrice.amount,
            offerCount: product.variants.length,
            availability: availability(product.availableForSale),
            seller: ref(ids.organization(origin)),
            offers,
          }),
  });
}

/* -------------------------------------------------------------------------- */
/* Assemblage                                                                  */
/* -------------------------------------------------------------------------- */

/** Type de page Schema.org le plus précis pour chaque route. */
function webPageType(route: RouteEntry, isLegal: boolean): string {
  if (isLegal) return 'WebPage';

  switch (route.kind) {
    case 'home':
      return 'WebPage';
    case 'contact':
      return 'ContactPage';
    case 'projectIndex':
    case 'journal':
    case 'shop':
    case 'collection':
      return 'CollectionPage';
    case 'project':
    case 'post':
    case 'product':
      return 'ItemPage';
    case 'labo':
      return 'AboutPage';
    case 'policy':
    case 'orderConfirmation':
    default:
      return 'WebPage';
  }
}

export interface PageGraphInput {
  route: RouteEntry;
  site: SiteContext;
  locale: Locale;
  /** URL canonique absolue de la page. */
  canonical: string;
  /** Origine du site, sans barre finale. */
  origin: string;
  /** Titre de la page tel qu'il est rendu (pas le titre SEO). */
  title: string;
  /** Description effective de la page, déjà résolue par le composant SEO. */
  description?: string;
  /** Image principale absolue, déjà résolue par le composant SEO. */
  image?: ImageInput | null;
  /** Page institutionnelle servie sous une présentation légale. */
  isLegal?: boolean;
  /** Date ISO de dernière révision du document servi, quand elle est connue. */
  lastmod?: string;
  page?: Page | null;
  project?: Project | null;
  post?: Post | null;
  product?: ShopProduct | null;
  collection?: ShopCollection | null;
  projects?: ProjectCard[];
  posts?: PostCard[];
  products?: ShopProductCard[];
  policy?: PolicyRouteKey;
}

/**
 * Construit le graphe complet d'une page.
 *
 * Point d'entrée unique : les pages n'assemblent pas de nœuds à la main, elles
 * décrivent ce qu'elles servent et reçoivent le graphe correspondant. Une route
 * nouvelle se traite ici, en un seul endroit, et hérite d'office de l'entreprise,
 * du site et du fil d'Ariane.
 */
export function buildPageGraph(input: PageGraphInput): JsonLdGraph {
  const {
    route,
    site,
    locale,
    canonical,
    origin,
    title,
    description,
    image,
    isLegal = false,
  } = input;

  const nodes: JsonLdNode[] = [
    organizationNode(site, origin, locale),
    webSiteNode(site, origin, locale),
  ];

  const primaryImage = imageNode(image, ids.primaryImage(canonical));
  const crumbs = breadcrumbTrail(route, locale, title);
  const breadcrumb = breadcrumbNode(crumbs, origin, canonical);

  /* ── L'entité décrite par la page ────────────────────────────────────── */

  let entityId: string | undefined;

  if (route.kind === 'project' && input.project) {
    const node = projectNode(input.project, origin, canonical, locale, image ?? null);
    entityId = node['@id'] as string;
    nodes.push(node);
  }

  if (route.kind === 'post' && input.post) {
    const node = blogPostingNode(
      input.post,
      origin,
      canonical,
      locale,
      image ?? null,
      input.lastmod,
    );
    entityId = node['@id'] as string;
    nodes.push(node);
    // Le blog qui le contient, pour que la référence `isPartOf` pointe vers
    // quelque chose de déclaré et pas dans le vide.
    nodes.push(
      compact({
        '@type': 'Blog',
        '@id': ids.blog(origin, locale),
        url: abs(journalIndexPath(locale), origin),
        name: useTranslations(locale)('journal.title'),
        publisher: ref(ids.organization(origin)),
      }),
    );
  }

  if (route.kind === 'journal') {
    const node = blogNode(origin, locale, input.posts ?? [], title, description);
    entityId = node['@id'] as string;
    nodes.push(node);
  }

  if (route.kind === 'product' && input.product) {
    const node = productNode(input.product, origin, canonical, image ?? null);
    entityId = node['@id'] as string;
    nodes.push(node);
  }

  if (route.kind === 'projectIndex') {
    const node = itemListNode(
      (input.projects ?? []).map((project) => ({
        name: project.title,
        path: `${projectsIndexPath(locale)}/${project.slug}`,
      })),
      origin,
      canonical,
    );
    if (node) {
      entityId = node['@id'] as string;
      nodes.push(node);
    }
  }

  if (route.kind === 'shop' || route.kind === 'collection') {
    const items = route.kind === 'collection' ? (input.collection?.products ?? []) : (input.products ?? []);
    const node = itemListNode(
      items.map((product) => ({
        name: product.title,
        path: `${shopIndexPath(locale)}/${product.handle}`,
      })),
      origin,
      canonical,
    );
    if (node) {
      entityId = node['@id'] as string;
      nodes.push(node);
    }
  }

  /* ── La page qui porte cette entité ──────────────────────────────────── */

  const isHome = route.kind === 'home';

  nodes.push(
    compact({
      '@type': webPageType(route, isLegal),
      '@id': ids.webPage(canonical),
      url: canonical,
      name: clean(title),
      // Même longueur que la méta description du `<head>` : la page ne doit pas
      // se décrire d'une façon aux moteurs et d'une autre aux partageurs.
      description: summarize(description, 200),
      inLanguage: getLocaleMeta(locale).htmlLang,
      isPartOf: ref(ids.website(origin)),
      // L'accueil parle du studio ; les autres pages parlent de ce qu'elles portent.
      about: isHome ? ref(ids.organization(origin)) : undefined,
      mainEntity: entityId ? ref(entityId) : undefined,
      primaryImageOfPage: primaryImage ? ref(ids.primaryImage(canonical)) : undefined,
      image: primaryImage ? ref(ids.primaryImage(canonical)) : undefined,
      breadcrumb: breadcrumb ? ref(ids.breadcrumb(canonical)) : undefined,
      datePublished: isoDate(input.post?.publishedAt),
      dateModified: isoDate(input.lastmod),
      publisher: ref(ids.organization(origin)),
    }),
  );

  if (breadcrumb) nodes.push(breadcrumb);
  if (primaryImage) nodes.push(primaryImage);

  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}

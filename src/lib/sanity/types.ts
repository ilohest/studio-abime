/**
 * Contrats TypeScript du contenu Sanity.
 *
 * Ces types décrivent la forme APRÈS projection GROQ (voir `queries.ts`),
 * pas la forme brute des documents. Ils constituent l'interface entre le CMS
 * et le rendu : toute évolution de schéma doit se refléter ici.
 *
 * Étape suivante recommandée quand les schémas seront stabilisés :
 * générer ces types automatiquement via `sanity typegen` (`sanity.types.ts`).
 */
import type { PortableTextBlock } from '@portabletext/types';
import type { ImageMetadata } from 'astro';
import type { Locale } from '~/i18n/config';
import type { PolicyRouteKey } from '~/i18n/routes';
import type { JournalCategory } from '~/content/journalCategories';

export type { PortableTextBlock };

export interface SanityImage {
  _type: 'image';
  alt?: string;
  hotspot?: { x: number; y: number };
  crop?: { top: number; bottom: number; left: number; right: number };
  asset?: {
    _id: string;
    url?: string;
    metadata?: {
      lqip?: string;
      dimensions?: { width: number; height: number; aspectRatio: number };
    };
  };
}

export interface Seo {
  title?: string;
  description?: string;
  image?: SanityImage;
  noIndex?: boolean;
}

/**
 * Lien tel que stocké dans Sanity. La conversion en `href` est faite côté Astro
 * par `resolveLink()` (src/lib/routing.ts) : le CMS ne connaît pas la forme des URLs,
 * ce qui permet de changer la structure de routes sans migrer le contenu.
 */
export interface SanityLink {
  label?: string;
  kind: 'internal' | 'external';
  externalUrl?: string;
  openInNewTab?: boolean;
  internal?: {
    _type: 'page' | 'project' | 'post' | 'projectsPage' | 'laboPage' | 'journalPage' | 'shopPage';
    title?: string;
    slug?: string;
    language?: Locale;
  } | null;
}

/** Lien prêt à être rendu. */
export interface ResolvedLink {
  label: string;
  href: string;
  isExternal: boolean;
  openInNewTab: boolean;
}

/* -------------------------------------------------------------------------- */
/* Sections (page builder modulaire)                                           */
/* -------------------------------------------------------------------------- */

interface SectionBase {
  _key: string;
  _type: string;
}

export interface ManifestoHero extends SectionBase {
  _type: 'manifestoHero';
  metaLines?: Array<{ _key: string; label: string; value?: string; autoDate?: boolean }>;
  hypothesisLabel?: string;
  hypothesis?: string;
  intentionLabel?: string;
  intention?: string[];
  tagline?: string;
}

export interface ServicesMenu extends SectionBase {
  _type: 'servicesMenu';
  image?: SanityImage;
}

export interface StudioStatement extends SectionBase {
  _type: 'studioStatement';
  statement: string;
  /** Ancien champ séparé, encore présent sur les documents antérieurs. */
  noteNumber?: string;
  note?: string;
  marker?: string;
  figures?: Array<{
    _key: string;
    /** Requis côté CMS ; absent quand la figure vient du contenu d'amorçage. */
    image?: SanityImage;
    number?: string;
    caption?: string;
    span?: number;
    bleed?: 'none' | 'left' | 'right';
    pushRight?: boolean;
    /**
     * Visuel groupé au site, utilisé UNIQUEMENT par le contenu d'amorçage
     * (`src/content/homeFallback.ts`) tant que Sanity n'est pas alimenté.
     * Jamais renseigné par le CMS.
     */
    fallbackImage?: ImageMetadata;
  }>;
}

export interface PullQuote extends SectionBase {
  _type: 'pullQuote';
  text: string;
}

export interface PlateSpread extends SectionBase {
  _type: 'plateSpread';
  background?: SanityImage;
  /** Visuel de repli, réservé au contenu d'amorçage (jamais saisi dans le CMS). */
  fallbackBackground?: ImageMetadata;
  figures?: Array<{
    _key: string;
    image?: SanityImage;
    number?: string;
    caption?: string;
    fallbackImage?: ImageMetadata;
  }>;
}

export interface ProjectShowcase extends SectionBase {
  _type: 'projectShowcase';
  projects?: ProjectCard[];
  /**
   * Projets factices, réservés au contenu d'amorçage tant qu'aucun projet réel
   * n'existe dans Sanity. Jamais renseignés par le CMS.
   */
  fallbackItems?: Array<{
    _key: string;
    title: string;
    href?: string;
    fallbackImage: ImageMetadata;
  }>;
}

export interface FullBleedImage extends SectionBase {
  _type: 'fullBleedImage';
  image?: SanityImage;
  /** Visuel de repli, réservé au contenu d'amorçage. */
  fallbackImage?: ImageMetadata;
}

export interface HeroSection extends SectionBase {
  _type: 'heroSection';
  heading: string;
  subheading?: string;
  media?: SanityImage;
  layout?: 'centered' | 'split' | 'fullBleed';
  cta?: SanityLink;
}

export interface RichTextSection extends SectionBase {
  _type: 'richTextSection';
  eyebrow?: string;
  heading?: string;
  body: PortableTextBlock[];
}

export interface MediaSection extends SectionBase {
  _type: 'mediaSection';
  items: Array<{ _key: string; image: SanityImage; caption?: string }>;
  columns?: 1 | 2 | 3;
  ratio?: 'square' | 'portrait' | 'landscape' | 'cinema';
}

export interface ProjectListSection extends SectionBase {
  _type: 'projectListSection';
  heading?: string;
  /** `manual` → projets choisis à la main ; `latest` → les N plus récents. */
  mode: 'manual' | 'latest';
  limit?: number;
  showFilters?: boolean;
  /** Les deux jeux sont renvoyés par GROQ ; le composant choisit selon `mode`. */
  manualProjects: ProjectCard[] | null;
  latestProjects: ProjectCard[];
}

export interface CtaSection extends SectionBase {
  _type: 'ctaSection';
  heading: string;
  body?: string;
  cta?: SanityLink;
}

export type Section =
  | ManifestoHero
  | ServicesMenu
  | StudioStatement
  | PullQuote
  | PlateSpread
  | ProjectShowcase
  | FullBleedImage
  | HeroSection
  | RichTextSection
  | MediaSection
  | ProjectListSection
  | CtaSection;

/* -------------------------------------------------------------------------- */
/* Documents                                                                   */
/* -------------------------------------------------------------------------- */

export interface ProjectCard {
  _id: string;
  title: string;
  slug: string;
  language: Locale;
  /** Position dans la page Expériences, selon son ordre éditorial courant. */
  number?: number;
  client?: string;
  /** Domaine d'activité — affiché dans la table des éléments. */
  sector?: string;
  /** Marqué favori : table des éléments, accueil et archive du Labo. */
  featured?: boolean;
  year?: number;
  excerpt?: string;
  listingFacts?: Array<{ _key: string; label?: string; value?: string }>;
  thumbnail?: SanityImage | null;
}

/** Templates de page projet disponibles. Voir `src/templates/project/`. */
export type ProjectTemplate = 'standard' | 'immersive' | 'editorial' | 'split' | 'banner';

/** Options conditionnelles du modèle sélectionné (voir `projectTemplateOptions`). */
export interface ProjectTemplateOptions {
  accent?: 'lumiere' | 'ciel' | 'sable' | 'papier';
  /** Ancien emplacement, conservé temporairement pour les documents existants. */
  coverVideoUrl?: string;
  showMarginNotes?: boolean;
}

/** Canal de diffusion du projet — site, réseau social, boutique… */
export interface ProjectChannel {
  _key: string;
  label?: string;
  url?: string;
}

/** Visuel de la colonne défilante du modèle « Colonne fixe ». */
export interface ProjectGalleryItem {
  _key: string;
  image?: SanityImage;
  /** Largeur sur la trame de 2 du modèle Colonne fixe. `half`/`full` : ancien couple. */
  span?: '1' | '2' | 'half' | 'full';
  /** Largeur sur la trame de 3 du modèle Bandeau. */
  spanWide?: '1' | '2' | '3';
  caption?: string;
}

export interface Project {
  _id: string;
  _type: 'project';
  language: Locale;
  title: string;
  slug: string;
  template: ProjectTemplate;
  templateOptions?: ProjectTemplateOptions;
  coverVideoUrl?: string;
  client?: string;
  year?: number;
  /** Grande phrase de tête de la page projet. À défaut, le titre reprend la place. */
  headline?: string;
  excerpt?: string;
  services?: string[];
  channels?: ProjectChannel[];
  listingFacts?: Array<{ _key: string; label?: string; value?: string }>;
  gallery?: ProjectGalleryItem[];
  thumbnail?: SanityImage;
  sections: Section[];
  seo?: Seo;
  /** Domaine d'activité — affiché dans la table des éléments. */
  sector?: string;
  /** Marqué favori : table des éléments, accueil et archive du Labo. */
  featured?: boolean;
  /** Rang dans le catalogue — le numéro que porte la fiche dans la grille. */
  number?: number;
  /** Rang parmi les projets favoris : désigne la case réservée occupée. */
  featuredRank?: number;
  next?: ProjectCard | null;
}

export interface Page {
  _id: string;
  _type: 'page';
  language: Locale;
  title: string;
  slug: string;
  sections: Section[];
  seo?: Seo;
}

/** Client sans page projet — document propre, listé dans « Clients ». */
export interface Client {
  _id: string;
  name: string;
  sector?: string;
}

export interface ProjectsPage {
  _id: string;
  _type: 'projectsPage';
  language: Locale;
  intro?: string;
  editorialCards: Array<{
    _key: string;
    kind: 'empty' | 'text';
    text?: string;
    position?: number;
  }>;
  seo?: Seo;
}

/* -------------------------------------------------------------------------- */
/* Journal                                                                     */
/* -------------------------------------------------------------------------- */

/** Article tel qu'il apparaît dans la grille du Journal. */
export interface PostCard {
  _id: string;
  title: string;
  slug: string;
  language: Locale;
  category: JournalCategory;
  /** Rang dans le Journal, du plus récent au plus ancien. */
  number?: number;
  /** Date de publication, au format ISO (`2026-08-25`). */
  publishedAt: string;
  excerpt?: string;
  /** Lignes libres de la fiche, saisies par l'éditeur (jusqu'à 5). */
  listingFacts?: Array<{ _key: string; label?: string; value?: string }>;
  coverImage?: SanityImage | null;
}

/** Modèles de page d'un article. Voir `src/components/JournalPost.astro`. */
export type PostTemplate = 'revue' | 'planche';

/** Texte courant de l'article. */
export interface JournalProse {
  _key: string;
  _type: 'journalProse';
  body: PortableTextBlock[];
}

/** Une à trois images côte à côte, sous une légende commune. */
export interface JournalFigure {
  _key: string;
  _type: 'journalFigure';
  images: SanityImage[];
  caption?: string;
  /** `marge` place la figure à côté du texte, en tout petit. */
  placement: 'texte' | 'marge';
  scale: 'petite' | 'colonne' | 'pleine';
}

/** Note numérotée, renvoyée en marge du texte qui la précède. */
export interface JournalNote {
  _key: string;
  _type: 'journalNote';
  text: string;
}

export type JournalBlock = JournalProse | JournalFigure | JournalNote;

export interface Post extends PostCard {
  _type: 'post';
  standfirst?: string;
  template: PostTemplate;
  /** Composition de l'article. L'ancienne saisie y est repliée par la requête. */
  blocks: JournalBlock[];
  seo?: Seo;
  /** Article suivant dans l'ordre chronologique décroissant. */
  next?: PostCard | null;
}

/** Contenu éditorial de l'index de la boutique (singleton par langue). */
export interface ShopPage {
  _id: string;
  _type: 'shopPage';
  language: Locale;
  intro?: string;
  seo?: Seo;
}

/** Contenu éditorial de l'index du Journal (singleton par langue). */
export interface JournalPage {
  _id: string;
  _type: 'journalPage';
  language: Locale;
  intro?: string;
  seo?: Seo;
}

export interface LaboService {
  _key: string;
  title: string;
  description: string;
}

/** Page éditoriale Labo, structurée comme une seule expérience narrative. */
export interface LaboPage {
  _id: string;
  _type: 'laboPage';
  language: Locale;
  title: string;
  eyebrow: string;
  philosophy: string[];
  whyTitle?: string;
  whyLead?: string;
  principles: string[];
  whyClosing?: string;
  servicesTitle?: string;
  services: LaboService[];
  note?: string;
  closingLines: string[];
  archiveProjects: ProjectCard[];
  seo?: Seo;
}

export interface NavigationItem extends SanityLink {
  _key: string;
}

/** Réglages globaux, partagés par toutes les langues. */
export interface SiteSettings {
  socialLinks: Array<{ _key: string; platform: string; url: string }>;
}

export interface LocalizedSettings {
  language: Locale;
  siteTitle: string;
  siteDescription?: string;
  defaultSeoImage?: SanityImage;
  headerNav: NavigationItem[];
  footerNav: NavigationItem[];
  footerText?: PortableTextBlock[];
  /** Slug de la page désignée comme accueil : sert à l'exclure des routes `/slug`. */
  homePageSlug?: string | null;
}

/** Données communes à toutes les pages, injectées par le layout. */
/**
 * Lien d'information légale affiché en pied de page.
 *
 * Les deux origines — Sanity pour l'entreprise, Shopify pour la boutique — sont
 * mises à plat ici volontairement : le visiteur n'a pas à savoir d'où vient
 * quel texte, et le pied de page n'a pas à le savoir non plus.
 */
export interface LegalLink {
  label: string;
  href: string;
}

export interface SiteContext {
  locale: Locale;
  settings: SiteSettings | null;
  localized: LocalizedSettings | null;
  /** Ne contient que des pages réellement publiées — un lien mort n'y entre jamais. */
  legalLinks: LegalLink[];
}

/* -------------------------------------------------------------------------- */
/* Routage                                                                     */
/* -------------------------------------------------------------------------- */

export type RouteEntry =
  | { kind: 'home'; locale: Locale; path: string }
  | { kind: 'labo'; locale: Locale; path: string }
  | { kind: 'contact'; locale: Locale; path: string }
  | { kind: 'page'; locale: Locale; path: string; slug: string }
  | { kind: 'projectIndex'; locale: Locale; path: string }
  | { kind: 'project'; locale: Locale; path: string; slug: string }
  | { kind: 'journal'; locale: Locale; path: string }
  | { kind: 'post'; locale: Locale; path: string; slug: string }
  | { kind: 'shop'; locale: Locale; path: string }
  /* `handle` et non `slug` : c'est le terme de Shopify, autant ne pas traduire. */
  | { kind: 'product'; locale: Locale; path: string; handle: string }
  | { kind: 'orderConfirmation'; locale: Locale; path: string }
  | { kind: 'collection'; locale: Locale; path: string; handle: string }
  /* Politique de boutique (CGV, livraison, retours) : le texte vit chez Shopify. */
  | { kind: 'policy'; locale: Locale; path: string; policy: PolicyRouteKey };

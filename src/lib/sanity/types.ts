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
    _type: 'page' | 'project';
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
  background?: SanityImage;
  showStamp?: boolean;
}

export interface ServicesMenu extends SectionBase {
  _type: 'servicesMenu';
  image?: SanityImage;
  groups?: Array<{ _key: string; title: string; items?: string[] }>;
}

export interface StudioStatement extends SectionBase {
  _type: 'studioStatement';
  statement: string;
  noteNumber?: string;
  note?: string;
  marker?: string;
  cta?: SanityLink;
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
  measure?: 'narrow' | 'default' | 'wide';
  fullHeight?: boolean;
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
  startNumber?: number;
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
  caption?: string;
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
  width?: 'narrow' | 'default' | 'wide';
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
  categories: CategorySummary[];
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

export interface CategorySummary {
  _id: string;
  title: string;
  /** Clé stable et non traduite : sert d'identifiant de filtre côté client. */
  key: string;
}

export interface ProjectCard {
  _id: string;
  title: string;
  slug: string;
  language: Locale;
  client?: string;
  year?: number;
  excerpt?: string;
  listingFacts?: Array<{ _key: string; label?: string; value?: string }>;
  thumbnail?: SanityImage | null;
  coverImage?: SanityImage | null;
  categories: CategorySummary[];
}

/** Templates de page projet disponibles. Voir `src/templates/project/`. */
export type ProjectTemplate = 'standard' | 'immersive' | 'editorial';

/** Options conditionnelles du modèle sélectionné (voir `projectTemplateOptions`). */
export interface ProjectTemplateOptions {
  accent?: 'lumiere' | 'ciel' | 'sable' | 'papier';
  coverVideoUrl?: string;
  showMarginNotes?: boolean;
  showFactSheet?: boolean;
  showNextProject?: boolean;
}

export interface Project {
  _id: string;
  _type: 'project';
  language: Locale;
  title: string;
  slug: string;
  template: ProjectTemplate;
  templateOptions?: ProjectTemplateOptions;
  client?: string;
  year?: number;
  excerpt?: string;
  services?: string[];
  listingFacts?: Array<{ _key: string; label?: string; value?: string }>;
  coverImage?: SanityImage;
  thumbnail?: SanityImage;
  categories: CategorySummary[];
  sections: Section[];
  seo?: Seo;
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

export interface NavigationItem extends SanityLink {
  _key: string;
}

export interface SiteSettings {
  /** Réglages globaux, partagés par toutes les langues. */
  logo?: SanityImage;
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
  projectsIntro?: string;
}

/** Données communes à toutes les pages, injectées par le layout. */
export interface SiteContext {
  locale: Locale;
  settings: SiteSettings | null;
  localized: LocalizedSettings | null;
}

/* -------------------------------------------------------------------------- */
/* Routage                                                                     */
/* -------------------------------------------------------------------------- */

export type RouteEntry =
  | { kind: 'home'; locale: Locale; path: string }
  | { kind: 'page'; locale: Locale; path: string; slug: string }
  | { kind: 'projectIndex'; locale: Locale; path: string }
  | { kind: 'project'; locale: Locale; path: string; slug: string };

import { resolveImage } from './sanity/image';
import { projectPath } from '~/i18n/routes';
import type { Locale } from '~/i18n/config';
import type { CategorySummary, ProjectCard } from './sanity/types';

/**
 * Modèles de vue passés aux composants clients (Vue).
 *
 * Les composants Vue ne reçoivent JAMAIS de documents Sanity bruts : les URLs
 * d'images et de pages sont calculées ici, côté serveur. Trois bénéfices :
 *  - le JSON hydraté reste minimal (pas d'assets, ni de champs inutilisés) ;
 *  - le client n'embarque ni la logique de routage ni le builder d'images ;
 *  - le composant Vue reste testable, sans dépendance à Sanity.
 */
export interface ProjectCardView {
  id: string;
  title: string;
  href: string;
  client: string | null;
  year: number | null;
  excerpt: string | null;
  /** Clés de catégories — base du filtrage côté client. */
  categoryKeys: string[];
  image: {
    src: string;
    srcset: string;
    width: number;
    height: number;
    alt: string;
    lqip: string | null;
  } | null;
}

export interface CategoryView {
  key: string;
  title: string;
  count: number;
}

export function toProjectCardView(card: ProjectCard, locale: Locale): ProjectCardView {
  // La vignette prime ; à défaut on retombe sur la couverture du projet.
  const source = card.thumbnail?.asset ? card.thumbnail : card.coverImage;
  const image = resolveImage(source, { width: 900, ratio: 'portrait' });

  return {
    id: card._id,
    title: card.title,
    href: projectPath(locale, card.slug),
    client: card.client ?? null,
    year: card.year ?? null,
    excerpt: card.excerpt ?? null,
    categoryKeys: (card.categories ?? []).map((category) => category.key).filter(Boolean),
    image: image ? { ...image, alt: image.alt || card.title, lqip: image.lqip ?? null } : null,
  };
}

/**
 * Prépare les catégories pour les filtres, en n'exposant que celles réellement
 * utilisées par les projets affichés (pas de filtre qui ne renvoie rien).
 */
export function toCategoryViews(
  categories: CategorySummary[],
  projects: ProjectCardView[],
): CategoryView[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const key of project.categoryKeys) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return categories
    .filter((category) => counts.has(category.key))
    .map((category) => ({
      key: category.key,
      title: category.title,
      count: counts.get(category.key) ?? 0,
    }));
}

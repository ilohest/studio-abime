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
  number: string;
  title: string;
  href: string;
  client: string | null;
  year: number | null;
  excerpt: string | null;
  facts: Array<{ key: string; label: string; value: string }>;
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

/** Carte de texte insérée dans la grille des projets. */
export interface ProjectNote {
  _key: string;
  text: string;
  /**
   * Case occupée dans la grille : 1 pour celle en haut à gauche, puis de
   * gauche à droite et ligne après ligne.
   */
  position?: number;
}

export type CatalogEntry<T> = { kind: 'card'; value: T } | { kind: 'note'; note: ProjectNote };

/**
 * Intercale les cartes de texte dans la grille, à la position demandée.
 *
 * Les cartes prennent leur case et décalent les projets suivants : aucun projet
 * n'est masqué.
 *
 * L'insertion se fait par position CROISSANTE : les positions se lisent donc
 * sur la grille FINALE, telle que l'éditeur la voit. Les insérer dans l'ordre
 * de saisie décalerait chaque carte suivante d'autant, et les positions ne
 * désigneraient plus les mêmes cases.
 *
 * Une position absente ou au-delà de la grille place la carte en dernier.
 */
export function insertProjectNotes<T>(cards: T[], notes: ProjectNote[] = []): CatalogEntry<T>[] {
  const entries: CatalogEntry<T>[] = cards.map((value) => ({ kind: 'card', value }));

  const ordered = notes
    .filter((note) => note.text?.trim())
    .slice()
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));

  for (const note of ordered) {
    const wanted = (note.position ?? entries.length + 1) - 1;
    const index = Math.min(Math.max(wanted, 0), entries.length);
    entries.splice(index, 0, { kind: 'note', note });
  }

  return entries;
}

/**
 * Positions des respirations graphiques dans la grille.
 *
 * La distribution semble aléatoire, mais reste stable pour une même liste :
 * aucun saut au moment où Vue hydrate le HTML rendu par Astro.
 */
export function getProjectSpacerPositions(ids: string[]): number[] {
  if (ids.length < 3) return [];

  const wanted = Math.max(1, Math.floor(ids.length / 5));
  const seed = ids.join('|');
  const hash = (value: string) => {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  };

  const candidates = Array.from({ length: ids.length - 1 }, (_, index) => index)
    .sort((a, b) => hash(`${seed}:${a}`) - hash(`${seed}:${b}`));
  const selected: number[] = [];

  for (const position of candidates) {
    if (selected.some((current) => Math.abs(current - position) <= 1)) continue;
    selected.push(position);
    if (selected.length === wanted) break;
  }

  return selected.sort((a, b) => a - b);
}

export function toProjectCardView(card: ProjectCard, locale: Locale, index = 0): ProjectCardView {
  // La vignette prime ; à défaut on retombe sur la couverture du projet.
  const source = card.thumbnail?.asset ? card.thumbnail : card.coverImage;
  const image = resolveImage(source, { width: 900, ratio: 'portrait' });

  return {
    id: card._id,
    number: `[${String(index + 1).padStart(2, '0')}]`,
    title: card.title,
    href: projectPath(locale, card.slug),
    client: card.client ?? null,
    year: card.year ?? null,
    excerpt: card.excerpt ?? null,
    facts: (card.listingFacts ?? [])
      .filter((fact): fact is typeof fact & { label: string; value: string } =>
        Boolean(fact.label?.trim() && fact.value?.trim()),
      )
      .slice(0, 5)
      .map((fact) => ({ key: fact._key, label: fact.label.trim(), value: fact.value.trim() })),
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

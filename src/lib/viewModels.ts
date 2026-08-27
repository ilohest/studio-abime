import { stegaClean } from '@sanity/client/stega';
import { resolveImage } from './sanity/image';
import { projectPath } from '~/i18n/routes';
import type { Locale } from '~/i18n/config';
import type { ProjectCard } from './sanity/types';

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
  image: {
    src: string;
    srcset: string;
    width: number;
    height: number;
    alt: string;
    lqip: string | null;
  } | null;
}

/** Initiales de chaque mot, utilisées comme symbole de la fiche-projet. */
export function projectInitials(title: string): string {
  const words = stegaClean(title).match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? [];
  return words.map((word) => Array.from(word)[0]).join('').toLocaleUpperCase('fr');
}

/** Carte éditoriale insérée dans la grille des projets. */
export interface ProjectEditorialCard {
  _key: string;
  kind: 'empty' | 'text';
  text?: string;
  /**
   * Case occupée dans la grille : 1 pour celle en haut à gauche, puis de
   * gauche à droite et ligne après ligne.
   */
  position?: number;
}

export type CatalogEntry<T> =
  | { kind: 'card'; value: T }
  | { kind: 'editorial'; editorial: ProjectEditorialCard };

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
export function insertProjectEditorialCards<T>(
  cards: T[],
  editorialCards: ProjectEditorialCard[] = [],
): CatalogEntry<T>[] {
  const entries: CatalogEntry<T>[] = cards.map((value) => ({ kind: 'card', value }));

  const ordered = editorialCards
    .map((card) => ({ ...card, kind: stegaClean(card.kind) }))
    .filter((card) => card.kind === 'empty' || Boolean(card.text?.trim()))
    .slice()
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));

  for (const editorial of ordered) {
    const wanted = (editorial.position ?? entries.length + 1) - 1;
    const index = Math.min(Math.max(wanted, 0), entries.length);
    entries.splice(index, 0, { kind: 'editorial', editorial });
  }

  return entries;
}

/**
 * `elementNumber` — numéro de la case occupée dans la table des éléments, quand
 * le projet y figure. La carte porte alors le même chiffre que sa case : c'est
 * le même objet, vu deux fois. Sinon, son rang éditorial.
 */
export function toProjectCardView(
  card: ProjectCard,
  locale: Locale,
  index = 0,
  elementNumber?: number,
): ProjectCardView {
  const image = resolveImage(card.thumbnail, { width: 900 });

  return {
    id: card._id,
    number: `[${elementNumber ?? String(index + 1).padStart(2, '0')}]`,
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
    image: image ? { ...image, alt: image.alt || card.title, lqip: image.lqip ?? null } : null,
  };
}


import { stegaClean } from '@sanity/client/stega';

/**
 * Ce que la grille du portfolio compose AVANT de rendre.
 *
 * Deux gestes seulement, mais tous deux partagés par plusieurs composants et
 * tous deux porteurs d'une règle : le symbole d'une fiche, et l'insertion des
 * cartes éditoriales dans la grille.
 *
 * Le pendant côté Journal est `src/lib/journal.ts`, qui construit en plus des
 * modèles de vue pour son composant client — la grille du portfolio, elle, est
 * rendue en HTML pur et n'a rien à hydrater.
 */

/**
 * Initiales de chaque mot, utilisées comme symbole de la fiche-projet.
 *
 * `toUpperCase()` et non `toLocaleUpperCase('fr')` : un symbole est un SIGNE
 * GRAPHIQUE — la marque d'une case, à la manière d'un symbole chimique — pas
 * une phrase. Il ne doit dépendre ni de la langue de la page ni de celle de la
 * machine qui construit le site, sous peine de changer d'un déploiement à
 * l'autre. Sur les langues du site, les deux donnent d'ailleurs le même
 * résultat ; seule l'intention diffère, et c'est elle qu'on écrit.
 */
export function projectInitials(title: string): string {
  const words = stegaClean(title).match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? [];
  return words.map((word) => Array.from(word)[0]).join('').toUpperCase();
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

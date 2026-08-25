/**
 * Rubriques du Journal — source de vérité UNIQUE.
 *
 * Ce fichier est importé à la fois par le site (rendu, filtres) et par les
 * schémas Sanity, à la manière de `src/i18n/config.ts`. Il ne doit donc
 * dépendre d'aucun runtime particulier.
 *
 * Les deux rubriques sont fixées en code, et non gérées comme des documents
 * `category` : elles structurent la page (filtres, mise en scène) autant
 * qu'elles classent le contenu. Le CMS porte les articles, pas la structure.
 */
export const JOURNAL_CATEGORIES = [
  {
    value: 'cahier-de-recherche',
    title: 'Cahier de recherche',
    /** Sigle imprimé en grand sur la fiche, à la manière d'une cote d'archive. */
    mark: 'CR',
    description: 'Articles de fond : enquêtes, notes de méthode, plongées sous le visible.',
  },
  {
    value: 'actualites',
    title: 'Actualités',
    mark: 'AC',
    description: 'Brèves du studio : sorties, rencontres, coulisses.',
  },
] as const;

export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number]['value'];

export const JOURNAL_CATEGORY_VALUES = JOURNAL_CATEGORIES.map(({ value }) => value);

export const defaultJournalCategory: JournalCategory = 'cahier-de-recherche';

export function isJournalCategory(value: unknown): value is JournalCategory {
  return typeof value === 'string' && (JOURNAL_CATEGORY_VALUES as string[]).includes(value);
}

export function getJournalCategory(value: unknown) {
  return JOURNAL_CATEGORIES.find((category) => category.value === value) ?? null;
}

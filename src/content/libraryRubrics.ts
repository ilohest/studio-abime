/**
 * Rubriques de la Bibliothèque — source de vérité UNIQUE.
 *
 * Ce fichier est importé à la fois par le site (rendu, routes) et par les
 * schémas Sanity, à la manière de `src/i18n/config.ts`. Il ne doit donc
 * dépendre d'aucun runtime particulier.
 *
 * ── Pourquoi « Bibliothèque » et non « Journal » ────────────────────────────
 * La section porte cinq rubriques, dont l'une s'appelle « Journal ». La page
 * qui les contient ne pouvait pas porter le même nom qu'une de ses parties :
 * le rail aurait affiché « Journal ▸ Journal ». La section est donc la
 * Bibliothèque, et le Journal redevient ce qu'il est — une rubrique parmi cinq.
 *
 * ── Pourquoi en code et non dans le CMS ─────────────────────────────────────
 * Ces cinq rubriques ne classent pas seulement le contenu : elles STRUCTURENT
 * le site. Chacune a sa page, son adresse et sa place dans le texte d'accueil.
 * Le CMS porte les articles, pas l'architecture.
 *
 * ➜ AJOUTER UNE RUBRIQUE = ajouter une entrée ici. La route, la page, le rail,
 *   les cases à cocher du Studio, la planche de fond et le sitemap suivent
 *   d'eux-mêmes.
 */
export const LIBRARY_RUBRICS = [
  {
    value: 'journal',
    title: 'Journal',
    /*
      Les intitulés n'ont PAS de point final : ce sont des étiquettes, pas des
      phrases. Ils servent de légende sous une figure, d'accroche sous un titre
      de rubrique et d'aide de saisie dans le Studio — trois emplois où le point
      ferait bégayer la ponctuation qui les entoure.
    */
    /** Cote imprimée sur la fiche, à la manière d'un classement d'archive. */
    mark: 'JO',
    description: 'News du labo & news culturelles',
    /*
      La planche de la rubrique — le schéma qui l'accompagne en fond de page.
      Voir `src/components/library/PlateFigure.astro`.

      Un relevé en bâtons : les nouvelles sont ce qui se compte, semaine après
      semaine.
    */
    plate: 'releve',
  },
  {
    value: 'carnet-de-voyages',
    title: 'Carnet de voyages',
    mark: 'CV',
    description: 'Les voyages en vrai et les voyages intérieurs',
    /* Des orbites : on s'éloigne, on revient, jamais tout à fait au même point. */
    plate: 'orbites',
  },
  {
    value: 'correspondances',
    title: 'Correspondances',
    mark: 'CO',
    description: 'Discussions & médias qui relatent des infos partagées',
    /* Un faisceau : ce qui part dans toutes les directions et revient chargé. */
    plate: 'radiante',
  },
  {
    value: 'references',
    title: 'Références',
    mark: 'RF',
    description: 'Les inspis',
    /* Une trame et sa forme inscrite : le cadre de référence, littéralement. */
    plate: 'grille',
  },
  {
    value: 'essais',
    title: 'Essais',
    mark: 'ES',
    description: 'Questions sans réponse',
    /* Du binaire : la question qui n'a que deux réponses possibles, et aucune. */
    plate: 'binaire',
  },
] as const;

export type LibraryRubric = (typeof LIBRARY_RUBRICS)[number]['value'];

/** Les seules valeurs acceptées côté schéma comme côté requête. */
export const libraryRubricValues = LIBRARY_RUBRICS.map((rubric) => rubric.value) as readonly LibraryRubric[];

/**
 * Rubrique d'atterrissage d'un article dont le classement manque.
 *
 * Un article sans rubrique n'est pas une erreur bloquante : il paraît au
 * Journal, la rubrique la plus générale, plutôt que de disparaître du site.
 */
export const defaultLibraryRubric: LibraryRubric = 'journal';

export function getLibraryRubric(value: unknown) {
  return LIBRARY_RUBRICS.find((rubric) => rubric.value === value) ?? null;
}

export function isLibraryRubric(value: unknown): value is LibraryRubric {
  return LIBRARY_RUBRICS.some((rubric) => rubric.value === value);
}

/**
 * Clé de la vue « tout » — la sixième entrée du texte d'accueil.
 *
 * Ce n'est pas une rubrique : c'est leur réunion. Elle a sa page (l'index des
 * rubriques) mais n'apparaît jamais dans le classement d'un article, et le mot
 * est réservé pour qu'aucune rubrique ne puisse un jour le revendiquer.
 */
export const ALL_RUBRICS = 'tout' as const;

export type LibraryRubricTarget = LibraryRubric | typeof ALL_RUBRICS;

export function isLibraryRubricTarget(value: unknown): value is LibraryRubricTarget {
  return value === ALL_RUBRICS || isLibraryRubric(value);
}

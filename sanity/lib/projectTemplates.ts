/**
 * Registre des modèles de page projet.
 *
 * Source de vérité unique côté CMS. Chaque entrée doit avoir son pendant dans
 * le registre de rendu `src/templates/project/ProjectTemplateRenderer.astro`.
 *
 * Trois modèles, et pas un de plus : deux mises en page arrêtées — la colonne
 * fixe et le bandeau — pour les projets qui se racontent en images, et une
 * composition libre pour tout le reste. Les modèles « Standard », « Immersif »
 * et « Éditorial » ont été retirés : aucun projet ne les employait, et chacun
 * demandait son propre jeu d'options.
 *
 * ➜ AJOUTER UN MODÈLE :
 *    1. ajouter une entrée ici ;
 *    2. créer `src/templates/project/MonModele.astro` ;
 *    3. l'enregistrer dans le `switch` du registre de rendu.
 *    Les projets existants conservent leur modèle : aucune migration.
 */
export const PROJECT_TEMPLATES = [
  {
    value: 'split',
    title: 'Colonne fixe',
    description:
      'Titre, fiche et texte fixes à gauche ; colonne d’images défilante à droite.',
  },
  {
    value: 'banner',
    title: 'Bandeau',
    description:
      'Titre en ouverture, texte et fiche côte à côte, planche d’images en bandeau dessous.',
  },
  {
    value: 'composition',
    title: 'Composition libre',
    description:
      'Textes, figures et notes intercalés dans l’ordre que vous voulez — la même saisie que les articles du Journal.',
  },
] as const;

export type ProjectTemplateValue = (typeof PROJECT_TEMPLATES)[number]['value'];

/** Modèle appliqué à un projet qui n'en déclare pas — ou qui en déclare un retiré. */
export const DEFAULT_PROJECT_TEMPLATE: ProjectTemplateValue = 'split';

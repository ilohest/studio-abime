/**
 * Registre des modèles de page projet.
 *
 * Source de vérité unique côté CMS. Chaque entrée doit avoir son pendant dans
 * le registre de rendu `src/templates/project/index.ts`.
 *
 * ➜ AJOUTER UN MODÈLE :
 *    1. ajouter une entrée ici ;
 *    2. créer `src/templates/project/MonModele.astro` ;
 *    3. l'enregistrer dans `src/templates/project/index.ts`.
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
    value: 'standard',
    title: 'Standard',
    description: 'En-tête classique, fiche projet en colonne, contenu modulaire.',
  },
  {
    value: 'immersive',
    title: 'Immersif',
    description: 'Couverture pleine page sur fond sombre, fiche projet en surimpression.',
  },
  {
    value: 'editorial',
    title: 'Éditorial',
    description: 'Mise en page longue lecture, annotations en marge, colonne étroite.',
  },
] as const;

export type ProjectTemplateValue = (typeof PROJECT_TEMPLATES)[number]['value'];

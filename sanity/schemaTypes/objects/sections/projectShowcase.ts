import { defineField, defineType } from 'sanity';

/**
 * Sélection de projets — planche défilante.
 *
 * Les projets choisis sont posés côte à côte, légèrement de travers, et se
 * parcourent horizontalement : ceux qui dépassent du cadre se découvrent au
 * défilement. Chaque visuel garde son format d'origine — c'est la variété des
 * proportions qui fait la composition.
 *
 * Rien ne se règle ici : la planche affiche les projets cochés « Projet
 * favori », et à défaut les cinq projets les plus récents. Le visuel employé
 * est celui mis en avant sur le projet (vignette, à défaut couverture) — le
 * même que dans la page portfolio.
 */
export const projectShowcase = defineType({
  name: 'projectShowcase',
  title: 'Sélection de projets',
  type: 'object',
  fields: [
    /*
      Sanity exige au moins un champ par type objet. La section n'ayant plus
      rien à régler, celui-ci reste masqué : l'éditeur pose le bloc dans la
      page, son aperçu lui dit ce qu'il affichera, et il n'a aucun formulaire
      à remplir.
    */
    defineField({
      name: 'automatic',
      title: 'Sélection automatique',
      type: 'boolean',
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    prepare: () => ({
      title: 'Sélection de projets',
      subtitle: 'Les projets favoris, à défaut les cinq plus récents',
    }),
  },
});

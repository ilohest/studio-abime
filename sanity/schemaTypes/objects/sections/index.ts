import { defineArrayMember, defineField } from 'sanity';
import type { ConditionalProperty } from '@sanity/types';
import type { ArrayOfObjectsInputProps } from 'sanity';

import { manifestoHero } from './manifestoHero';
import { servicesMenu } from './servicesMenu';
import { studioStatement } from './studioStatement';
import { pullQuote } from './pullQuote';
import { plateSpread } from './plateSpread';
import { projectShowcase } from './projectShowcase';
import { fullBleedImage } from './fullBleedImage';
import { heroSection } from './heroSection';
import { richTextSection } from './richTextSection';
import { mediaSection } from './mediaSection';
import { projectListSection } from './projectListSection';
import { ctaSection } from './ctaSection';

export const sectionTypes = [
  manifestoHero,
  servicesMenu,
  studioStatement,
  pullQuote,
  plateSpread,
  projectShowcase,
  fullBleedImage,
  heroSection,
  richTextSection,
  mediaSection,
  projectListSection,
  ctaSection,
];

/** Noms des sections — miroir du registre de rendu `src/components/sections/`. */
export const sectionTypeNames = sectionTypes.map((section) => section.name);

/**
 * Champ « page builder » réutilisable.
 *
 * Un seul endroit définit les blocs disponibles : ajouter une section revient à
 * créer son schéma, l'ajouter à `sectionTypes` ci-dessus, et créer le composant
 * Astro correspondant. Pages et projets en héritent automatiquement.
 *
 * `allowed` permet de restreindre les blocs autorisés sur un type de document
 * précis, sans dupliquer la définition.
 */
export function definePageBuilder(
  options: {
    name?: string;
    title?: string;
    allowed?: string[];
    group?: string | string[];
    /** Masque le champ selon le document — un modèle de page qui compose autrement. */
    hidden?: ConditionalProperty;
    /**
     * Fige la COMPOSITION : plus de bouton « Add item », plus de glisser-déposer.
     * Le contenu de chaque bloc reste entièrement modifiable.
     *
     * À poser sur les pages dont l'enchaînement des blocs est une décision de
     * design et non un choix éditorial. La page d'accueil en est l'exemple : sa
     * succession — manifeste, services, déclaration, planche, citation — porte
     * la direction artistique. Un bloc ajouté au milieu, ou deux blocs
     * intervertis, ne produisent pas une variante mais une page cassée, et rien
     * dans le back-office ne préviendrait avant publication.
     *
     * C'est la même règle que pour les titres de section ou les libellés de
     * boutons, posés en code : ce qui relève de la mise en page ne se propose
     * pas à la saisie.
     */
    locked?: boolean;
  } = {},
) {
  const {
    name = 'sections',
    title = 'Contenu de la page',
    allowed,
    group,
    hidden,
    locked = false,
  } = options;
  const names = allowed ?? sectionTypeNames;

  return defineField({
    name,
    title,
    type: 'array',
    group,
    hidden,
    of: names.map((type) => defineArrayMember({ type })),
    options: {
      insertMenu: { filter: true, showIcons: true },
      // Le glisser-déposer réordonne : c'est déjà changer la composition.
      sortable: !locked,
    },
    ...(locked
      ? {
          components: {
            /*
              `arrayFunctions` est le bloc de boutons sous la liste — « Add
              item » et ses variantes. Le remplacer par un composant vide les
              retire sans toucher au reste du formulaire : chaque bloc garde son
              formulaire d'édition complet.
            */
            input: (props: ArrayOfObjectsInputProps) =>
              props.renderDefault({ ...props, arrayFunctions: () => null }),
          },
        }
      : {}),
  });
}

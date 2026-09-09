import { defineArrayMember, defineField } from 'sanity';
import type { ConditionalProperty } from '@sanity/types';

import { SECTION_TYPE_NAMES } from '../../../../src/lib/sections';

import { manifestoHero } from './manifestoHero';
import { servicesMenu } from './servicesMenu';
import { studioStatement } from './studioStatement';
import { pullQuote } from './pullQuote';
import { plateSpread } from './plateSpread';
import { projectShowcase } from './projectShowcase';
import { fullBleedImage } from './fullBleedImage';
import { testimonials } from './testimonials';
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
  testimonials,
  heroSection,
  richTextSection,
  mediaSection,
  projectListSection,
  ctaSection,
];

/*
  ┌─ UNE SEULE LISTE DE NOMS ─────────────────────────────────────────────────┐
  │ Elle vit dans `src/lib/sections.ts`, hors du Studio, parce que le RENDU   │
  │ en a besoin autant que les schémas — et qu'il ne peut pas importer ce     │
  │ fichier-ci sans embarquer le paquet `sanity` dans le bundle du site.      │
  │                                                                           │
  │ Le registre de rendu la recopiait donc à la main. Les deux listes         │
  │ pouvaient diverger en silence : une section déclarée ici et absente       │
  │ là-bas se pose dans le back-office, se publie, et ne s'affiche jamais.    │
  └───────────────────────────────────────────────────────────────────────────┘

  La vérification ci-dessous referme le seul écart que le partage laisse
  ouvert : un schéma ajouté à `sectionTypes` sans son nom dans la liste
  partagée, ou l'inverse. Elle tombe au chargement du Studio — donc devant
  la personne qui vient d'écrire le schéma, pas devant l'éditrice.
*/
const declaredNames = sectionTypes.map((section) => section.name);
const missing = declaredNames.filter(
  (name) => !(SECTION_TYPE_NAMES as readonly string[]).includes(name),
);
const orphaned = SECTION_TYPE_NAMES.filter((name) => !declaredNames.includes(name));

if (missing.length > 0 || orphaned.length > 0) {
  throw new Error(
    `[sections] Les registres divergent. ` +
      `Schémas absents de SECTION_TYPE_NAMES : ${missing.join(', ') || '—'}. ` +
      `Noms sans schéma : ${orphaned.join(', ') || '—'}. ` +
      `Voir src/lib/sections.ts.`,
  );
}

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
     * Fige la COMPOSITION : ni ajout, ni suppression, ni duplication, ni copie,
     * ni réordonnancement. Le contenu de chaque bloc reste entièrement
     * modifiable — c'est le seul geste qui subsiste.
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
  const names = allowed ?? [...SECTION_TYPE_NAMES];

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
      /*
        Les SIX actions que Sanity expose sur un tableau. Les couper toutes
        retire le bouton d'ajout ET le menu « ⋮ » de chaque bloc — dupliquer,
        copier, insérer avant/après, supprimer. Il ne reste que l'ouverture du
        bloc et l'édition de ses champs.

        `disableActions` est marqué @beta par Sanity. C'est malgré tout la bonne
        voie : l'alternative — remplacer le composant d'item pour lui retirer
        son menu — obligerait à réimplémenter le pli, le glisser, la validation
        et la présence, et casserait à la première évolution du Studio.
      */
      ...(locked
        ? {
            disableActions: [
              'add',
              'addBefore',
              'addAfter',
              'remove',
              'duplicate',
              'copy',
            ] as const,
          }
        : {}),
    },
  });
}

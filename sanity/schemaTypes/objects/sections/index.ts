import { defineArrayMember, defineField } from 'sanity';

import { manifestoHero } from './manifestoHero';
import { servicesMenu } from './servicesMenu';
import { studioStatement } from './studioStatement';
import { pullQuote } from './pullQuote';
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
export function definePageBuilder(options: { name?: string; title?: string; allowed?: string[] } = {}) {
  const { name = 'sections', title = 'Contenu de la page', allowed } = options;
  const names = allowed ?? sectionTypeNames;

  return defineField({
    name,
    title,
    type: 'array',
    of: names.map((type) => defineArrayMember({ type })),
    options: { insertMenu: { filter: true, showIcons: true } },
  });
}

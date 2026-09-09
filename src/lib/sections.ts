/**
 * Le vocabulaire du page builder — la liste des blocs, et la cardinalité des
 * compositions figées.
 *
 * Ce module existe pour la même raison que `src/i18n/config.ts` et
 * `src/lib/siteIndex.ts` : ce sont des faits que les DEUX côtés doivent
 * connaître, les schémas du Studio comme le rendu Astro. Écrits deux fois, ils
 * divergent au premier ajout — et rien ne le signale avant de le voir à
 * l'écran.
 *
 * Il ne dépend donc d'AUCUN runtime, et n'emploie que des imports relatifs :
 * le bundle du Studio ne connaît pas l'alias `~/`.
 */

/**
 * Les blocs du page builder, dans l'ordre du menu d'insertion.
 *
 * Miroir exact de deux registres qui, sans cette liste, se recopiaient l'un
 * l'autre à la main :
 *  · `sanity/schemaTypes/objects/sections/index.ts` — les schémas ;
 *  · `src/components/sections/SectionRenderer.astro` — les composants.
 *
 * ➜ AJOUTER UNE SECTION : un nom ici, un schéma, un composant, une ligne dans
 *   le `switch` du renderer. La cohérence des deux registres est vérifiée au
 *   chargement du Studio (voir l'index des schémas).
 */
export const SECTION_TYPE_NAMES = [
  'manifestoHero',
  'servicesMenu',
  'studioStatement',
  'pullQuote',
  'plateSpread',
  'projectShowcase',
  'fullBleedImage',
  'testimonials',
  'heroSection',
  'richTextSection',
  'mediaSection',
  'projectListSection',
  'ctaSection',
] as const;

/**
 * Nombre de figures de la planche du manifeste illustré.
 *
 * Ce n'est pas un réglage : les cinq positions sont DESSINÉES dans la feuille
 * de style du composant (`.statement__figure:nth-child(1…5)`). Le nombre vit
 * ici parce que deux endroits en dépendent et doivent tomber d'accord :
 *
 *  · le schéma, qui refuse la sixième figure à la saisie ;
 *  · le composant, qui borne ce qu'il pose sur la planche — la validation
 *    d'un tableau ne garde pas ce qui est arrivé avant elle.
 *
 * Le faire changer suppose de redessiner la planche — c'est une décision de
 * mise en page, pas une valeur à ajuster.
 */
export const PLATE_FIGURES = 5;

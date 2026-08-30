import { createDataAttribute } from '@sanity/visual-editing/create-data-attribute';

import { dataset, projectId, studioUrl, visualEditingEnabled } from './sanity/env';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DÉSIGNER UN CHAMP QUAND LE TEXTE A ÉTÉ TRANSFORMÉ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── Comment l'édition visuelle fonctionne, normalement ──────────────────────
 * Sanity accroche à chaque chaîne renvoyée une traîne de caractères invisibles
 * (« stega ») qui dit de quel document et de quel champ elle provient. Le texte
 * rendu tel quel dans la page reste donc traçable : l'overlay lit la traîne,
 * et le clic ouvre le bon champ. Rien à faire, tant qu'on affiche la chaîne
 * telle qu'elle arrive.
 *
 * ── Là où ça casse ─────────────────────────────────────────────────────────
 * Deux composants de la charte ne peuvent pas afficher la chaîne telle quelle :
 * la déclaration du manifeste met trois expressions en italique, et la citation
 * se découpe en lignes puis en mots pour son animation d'apparition. Or :
 *
 *  · `split()` disperse le texte en plusieurs nœuds, et la traîne — accrochée à
 *    la FIN de la chaîne — se retrouve tout entière dans le dernier fragment,
 *    orpheline du texte qu'elle décrit ;
 *  · `stegaClean()` la supprime franchement, ce qui est nécessaire dès qu'on
 *    veut compter des mots ou couper sur un motif : sans quoi les caractères
 *    invisibles fausseraient les découpes et se retrouveraient au milieu des
 *    mots.
 *
 * Dans les deux cas le texte s'affiche correctement, et devient impossible à
 * cliquer. Rien ne le signale — c'est un champ qui cesse d'être éditable en
 * silence, et on ne s'en aperçoit qu'en essayant.
 *
 * ── La parade ──────────────────────────────────────────────────────────────
 * Quand on transforme le texte, on désigne le champ EXPLICITEMENT, par un
 * attribut `data-sanity` posé sur l'élément qui le contient. L'overlay le lit
 * au lieu de la traîne. C'est le mécanisme prévu par Sanity pour exactement
 * cette situation.
 *
 * ➜ RÈGLE : tout composant qui appelle `stegaClean()` ou `split()` sur un texte
 *   venu du CMS doit poser cet attribut, sinon il rend le champ inéditable.
 */

/**
 * Attribut `data-sanity` désignant quelque chose DANS une section du page
 * builder — un champ, ou un élément d'un de ses tableaux.
 *
 * Rend `undefined` hors édition visuelle : en production, l'attribut n'existe
 * pas et pas un octet n'est ajouté aux pages.
 *
 * @param documentId   `_id` du document qui porte la section
 * @param documentType `_type` du document (`page`, `project`…)
 * @param sectionKey   `_key` de la section dans le tableau `sections`
 * @param path         chemin RELATIF à la section — `statement`, `text`, ou
 *                     `figures[_key=="f5"]` pour viser un élément de tableau
 */
export function sectionFieldAttribute(
  documentId: string | undefined,
  documentType: string | undefined,
  sectionKey: string | undefined,
  path: string,
): string | undefined {
  if (!visualEditingEnabled) return undefined;
  if (!documentId || !documentType || !sectionKey) return undefined;

  return createDataAttribute({
    projectId,
    dataset,
    baseUrl: studioUrl,
    id: documentId,
    type: documentType,
    /*
      La section est désignée par sa CLÉ et non par son rang : réordonner le
      page builder ne doit pas faire pointer l'attribut vers le voisin. Même
      raison pour les éléments de tableau visés par `path`.
    */
    path: `sections[_key=="${sectionKey}"].${path}`,
  }).toString();
}

/**
 * Les images ne portent JAMAIS de traîne d'édition visuelle : stega n'encode
 * que des chaînes de caractères, et une image est un objet — une référence
 * d'asset, un recadrage, un texte alternatif. Une planche d'images est donc
 * entièrement inerte dans le Presentation Tool tant qu'on ne désigne pas
 * chaque figure explicitement.
 *
 * On vise la FIGURE et non son image : le clic ouvre alors l'entrée complète —
 * image, légende et réglages de mise en page — c'est-à-dire ce que l'éditrice
 * cherche à changer quand elle clique sur une planche.
 */
export function figureAttribute(
  documentId: string | undefined,
  documentType: string | undefined,
  sectionKey: string | undefined,
  figureKey: string | undefined,
): string | undefined {
  if (!figureKey) return undefined;
  return sectionFieldAttribute(
    documentId,
    documentType,
    sectionKey,
    `figures[_key=="${figureKey}"]`,
  );
}

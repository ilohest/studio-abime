import type { Locale } from '~/i18n/config';

/**
 * Texte d'accueil de la Bibliothèque.
 *
 * Même rôle que `shopFallback` : porter un contenu réel tant que le singleton
 * Sanity n'est pas rempli. Dès qu'un texte est saisi dans le Studio, celui-ci
 * s'efface.
 *
 * ── La syntaxe des mots-rubriques ───────────────────────────────────────────
 * `[[valeur|mot]]` marque le mot qui ouvre une rubrique : `[[essais|essais]]`.
 * Le texte du CMS, lui, passe par une annotation Portable Text — l'éditrice
 * n'écrit jamais ces crochets. Ils ne servent qu'ici, pour tenir le repli dans
 * une simple chaîne plutôt que dans un faux document Portable Text.
 *
 * Les six mots doivent être présents : cinq rubriques et `tout`. C'est le seul
 * chemin vers les articles depuis cette page — un mot oublié est une section
 * du site devenue inatteignable. `assertCompleteComposition` le vérifie au
 * rendu plutôt que de laisser passer une page muette.
 *
 * ⚠️ TEXTE DE CHANTIER — à réécrire depuis le Studio (Page Bibliothèque).
 */
const composition: Record<string, string> = {
  fr:
    'Rien ne se range ici par ordre d’arrivée. Ce qui s’écrit au studio et ce qui s’y lit ' +
    'tiennent dans le même [[journal|journal]], entre deux nouvelles venues du dehors. Ce qui ' +
    'se déplace — un pays traversé, une idée qui creuse au même endroit pendant des mois — passe ' +
    'au [[carnet-de-voyages|carnet de voyages]]. Ce qui nous arrive d’ailleurs, une discussion, ' +
    'un lien envoyé un soir, une émission qu’on se repasse, reste en ' +
    '[[correspondances|correspondances]].\n\n' +
    'Ce qui nous tient depuis longtemps sans qu’on sache toujours dire pourquoi s’accumule en ' +
    '[[references|références]]. Et ce qui résiste, ce qui n’a pas de réponse et n’en aura ' +
    'peut-être jamais, s’écrit en [[essais|essais]]. On peut aussi ouvrir [[tout|l’ensemble]] ' +
    'd’un seul geste, et lire dans le désordre de sa fabrication.',
};

export function getLibraryComposition(locale: Locale): string {
  return composition[locale] ?? composition.fr!;
}

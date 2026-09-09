/**
 * Étiquette de figure — « fig.05 — Compréhension de la constitution ».
 *
 * Le CMS ne demande QU'UN champ : l'éditeur écrit la ligne telle qu'elle doit
 * se lire. Le repère de tête (fig.05, pl.2, n°3…) est isolé ici, au rendu, pour
 * garder sa mise en forme propre sans imposer un second champ à la saisie.
 *
 * La fonction reste VARIADIQUE parce que les légendes n'arrivent pas toujours
 * d'un seul tenant : `FigureCaption` reçoit parfois un repère et un texte par
 * deux chemins distincts, et les recompose ici avant analyse.
 */
/*
  Les parenthèses sont tolérées — « fig. (34) » se lit comme « fig. 34 ».
  L'éditrice en a mis, et un repère non reconnu part dans le TEXTE de la
  légende : il s'y afficherait tel quel, en plus du repère calculé, et la
  figure porterait deux numéros contradictoires.
*/
const REFERENCE = /^\s*((?:fig|pl|réf|ref|n°|no)\.?\s?\(?\d+[a-z]?\)?)\s*(?:[—–-]\s*)?/i;
const FIGURE_REFERENCE = /^fig\.?\s*\(?(\d+[a-z]?)\)?$/i;

export interface FigureLabel {
  /** Repère de tête, s'il y en a un. */
  reference?: string;
  /** Reste de la ligne. */
  text?: string;
}

/** Uniformise les variantes « Fig.01 » et « fig 01 » en « fig. 01 ». */
function normalizeReference(reference: string): string {
  const figure = reference.match(FIGURE_REFERENCE);
  return figure ? `fig. ${figure[1]}` : reference;
}

/** Recompose puis découpe une étiquette. Les parties vides sont ignorées. */
export function figureLabel(...parts: Array<string | undefined | null>): FigureLabel {
  const raw = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .trim();

  if (!raw) return {};

  const match = raw.match(REFERENCE);
  if (!match) return { text: raw };

  const text = raw.slice(match[0].length).trim();
  return { reference: normalizeReference(match[1]), text: text || undefined };
}

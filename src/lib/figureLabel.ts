/**
 * Étiquette de figure — « fig.05 — Compréhension de la constitution ».
 *
 * Le CMS ne demande QU'UN champ : l'éditeur écrit la ligne telle qu'elle doit
 * se lire. Le repère de tête (fig.05, pl.2, n°3…) est isolé ici, au rendu, pour
 * garder sa mise en forme propre sans imposer un second champ à la saisie.
 *
 * Les documents antérieurs portaient deux champs séparés : leurs valeurs sont
 * recomposées avant analyse, ce qui rend la bascule invisible côté contenu.
 */
const REFERENCE = /^\s*((?:fig|pl|réf|ref|n°|no)\.?\s?\d+[a-z]?)\s*(?:[—–-]\s*)?/i;

export interface FigureLabel {
  /** Repère de tête, s'il y en a un. */
  reference?: string;
  /** Reste de la ligne. */
  text?: string;
}

/**
 * Recompose puis découpe une étiquette. Les parties vides sont ignorées, ce qui
 * permet de passer directement `figureLabel(figure.number, figure.caption)` :
 * l'ancien champ « Numéro » disparaît de lui-même une fois le contenu migré.
 */
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
  return { reference: match[1], text: text || undefined };
}

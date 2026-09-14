import { stegaClean } from '@sanity/client/stega';
import { libraryRubricPath, libraryRubricsPath } from '~/i18n/routes';
import {
  ALL_RUBRICS,
  isLibraryRubricTarget,
  LIBRARY_RUBRICS,
  type LibraryRubricTarget,
} from '~/content/libraryRubrics';
import { getLibraryComposition } from '~/content/libraryFallback';
import type { Locale } from '~/i18n/config';
import type { PostCardView } from './journal';
import type { PortableTextBlock } from './sanity/types';

/**
 * Le texte d'accueil de la Bibliothèque, préparé pour le rendu.
 *
 * ── Pourquoi ne pas passer par `@portabletext/to-html` ? ────────────────────
 * Parce que la page ne veut pas seulement des liens dans du texte : elle veut
 * SAVOIR où sont les mots. Chaque mot-rubrique reçoit un encadré tracé et un
 * trait qui le relie au suivant — ce qui suppose de les compter, de les
 * ordonner et de leur donner un repère stable. On aplatit donc le Portable
 * Text en segments plutôt que de rendre du HTML opaque qu'il faudrait ensuite
 * ré-analyser dans le navigateur.
 *
 * Le contrat vaut pour les deux sources : texte du CMS et texte de repli
 * produisent exactement la même structure.
 */

export type LibrarySegment =
  | { kind: 'text'; key: string; text: string }
  | {
      kind: 'rubric';
      key: string;
      text: string;
      target: LibraryRubricTarget;
      href: string;
      /** Rang du mot dans l'ordre de lecture — c'est l'ordre du trait. */
      order: number;
    };

export interface LibraryParagraph {
  key: string;
  segments: LibrarySegment[];
}

export interface LibraryComposition {
  paragraphs: LibraryParagraph[];
  /** Les cibles réellement atteintes par le texte, dans l'ordre de lecture. */
  reached: LibraryRubricTarget[];
  /**
   * Les cibles qu'aucun mot n'ouvre.
   *
   * Ce n'est pas un détail de mise en page : cette page est le SEUL chemin
   * vers les rubriques. Un mot oublié dans le CMS rendrait une section du site
   * inatteignable à la souris. La page affiche alors un rattrapage discret
   * plutôt que de laisser une porte murée.
   */
  missing: LibraryRubricTarget[];
}

/** Adresse d'un mot-rubrique : une rubrique, ou leur réunion. */
export function rubricTargetPath(target: LibraryRubricTarget, locale: Locale): string {
  return target === ALL_RUBRICS ? libraryRubricsPath(locale) : libraryRubricPath(locale, target);
}

/** Toutes les cibles que le texte devrait atteindre, dans l'ordre du classement. */
const allTargets: LibraryRubricTarget[] = [
  ...LIBRARY_RUBRICS.map((rubric) => rubric.value),
  ALL_RUBRICS,
];

/**
 * Construit la composition à partir du CMS, avec repli sur le texte du dépôt.
 *
 * Le repli s'applique aussi quand le texte saisi n'ouvre AUCUNE rubrique : une
 * page d'accueil sans un seul lien vers ses articles n'est pas une page
 * d'accueil, c'est une impasse. Un texte incomplet, lui, est conservé — il
 * reste le texte de l'autrice — et les mots manquants sont signalés.
 */
export function toLibraryComposition(
  blocks: PortableTextBlock[] | undefined | null,
  locale: Locale,
): LibraryComposition {
  const fromCms = blocks?.length ? fromPortableText(blocks, locale) : [];
  const paragraphs = countRubrics(fromCms) > 0 ? fromCms : fromTemplate(getLibraryComposition(locale), locale);

  const reached: LibraryRubricTarget[] = [];
  for (const paragraph of paragraphs) {
    for (const segment of paragraph.segments) {
      if (segment.kind === 'rubric' && !reached.includes(segment.target)) reached.push(segment.target);
    }
  }

  return {
    paragraphs,
    reached,
    missing: allTargets.filter((target) => !reached.includes(target)),
  };
}

function countRubrics(paragraphs: LibraryParagraph[]): number {
  return paragraphs.reduce(
    (total, paragraph) => total + paragraph.segments.filter((s) => s.kind === 'rubric').length,
    0,
  );
}

/**
 * L'intitulé de cette rubrique forme une seule expression. Dans Portable Text,
 * une annotation peut cependant n'avoir été posée que sur « voyages » : le
 * navigateur encadrait alors ce seul mot, alors que la porte s'appelle bien
 * « carnet de voyages ». On reprend le préfixe adjacent sans toucher aux
 * annotations déjà correctes ni aux autres rubriques.
 */
function completeTravelNotebookLabel(segments: LibrarySegment[], text: string): string {
  if (stegaClean(text).trim().toLocaleLowerCase('fr') !== 'voyages') return text;

  const previous = segments.at(-1);
  if (!previous || previous.kind !== 'text') return text;

  const cleanPrevious = stegaClean(previous.text);
  const prefix = cleanPrevious.match(/carnet\s+de\s+$/iu);
  if (!prefix || prefix.index === undefined) return text;

  const before = cleanPrevious.slice(0, prefix.index);
  if (before) previous.text = before;
  else segments.pop();

  return `${prefix[0]}${text}`;
}

/**
 * Portable Text → segments.
 *
 * Un mot-rubrique est un `span` portant une annotation `rubricLink`. Les
 * autres marques (gras, italique, lien libre) sont ignorées : ce texte n'a pas
 * de mise en forme propre, il n'a que des portes. Le champ Sanity ne propose
 * d'ailleurs qu'elle.
 */
function fromPortableText(blocks: PortableTextBlock[], locale: Locale): LibraryParagraph[] {
  let order = 0;

  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => {
      const markDefs = (block.markDefs ?? []) as Array<{ _key: string; _type: string; rubric?: string }>;
      const children = (block.children ?? []) as Array<{ _key: string; text?: string; marks?: string[] }>;

      const segments: LibrarySegment[] = [];

      for (const child of children) {
        const text = child.text ?? '';
        if (!text) continue;

        const definition = (child.marks ?? [])
          .map((mark) => markDefs.find((def) => def._key === mark))
          .find((def) => def?._type === 'rubricLink');

        const target = stegaClean(definition?.rubric);

        if (definition && isLibraryRubricTarget(target)) {
          const label =
            target === 'carnet-de-voyages'
              ? completeTravelNotebookLabel(segments, text)
              : text;
          segments.push({
            kind: 'rubric',
            key: child._key,
            text: label,
            target,
            href: rubricTargetPath(target, locale),
            order: order++,
          });
          continue;
        }

        segments.push({ kind: 'text', key: child._key, text });
      }

      return { key: block._key ?? `block-${segments.length}`, segments };
    })
    .filter((paragraph) => paragraph.segments.length > 0);
}

/**
 * Texte de repli → segments.
 *
 * La syntaxe `[[valeur|mot]]` n'existe que dans `libraryFallback.ts` : elle
 * évite d'écrire un faux document Portable Text à la main pour un texte
 * destiné à être remplacé.
 */
const TOKEN = /\[\[([a-z-]+)\|([^\]]+)\]\]/g;

function fromTemplate(text: string, locale: Locale): LibraryParagraph[] {
  let order = 0;

  return text.split('\n\n').map((raw, paragraphIndex) => {
    const segments: LibrarySegment[] = [];
    let cursor = 0;

    for (const match of raw.matchAll(TOKEN)) {
      const [token, value, label] = match;
      const start = match.index ?? 0;

      if (start > cursor) {
        segments.push({
          kind: 'text',
          key: `p${paragraphIndex}-t${cursor}`,
          text: raw.slice(cursor, start),
        });
      }

      if (isLibraryRubricTarget(value)) {
        segments.push({
          kind: 'rubric',
          key: `p${paragraphIndex}-r${start}`,
          text: label!,
          target: value,
          href: rubricTargetPath(value, locale),
          order: order++,
        });
      } else {
        // Valeur inconnue : on rend le mot, jamais le balisage.
        segments.push({ kind: 'text', key: `p${paragraphIndex}-x${start}`, text: label ?? token! });
      }

      cursor = start + token!.length;
    }

    if (cursor < raw.length) {
      segments.push({ kind: 'text', key: `p${paragraphIndex}-t${cursor}`, text: raw.slice(cursor) });
    }

    return { key: `p${paragraphIndex}`, segments };
  });
}

/* -------------------------------------------------------------------------- */
/* La trame d'une rubrique                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Une case de la trame : sa cote, et l'article qu'elle porte — ou rien.
 *
 * La page d'une rubrique n'est pas une liste : c'est une planche cotée, dont
 * la plupart des cases restent vides. Le vide y fait la composition, comme au
 * dos d'une pochette de disque : on lit d'abord la trame, ensuite les entrées.
 */
export interface LibraryCell {
  /** Cote imprimée dans la case — « 01 », « 02 »… Toutes les cases en ont une. */
  number: string;
  entry: PostCardView | null;
}

/**
 * Écarts appliqués à un placement régulier.
 *
 * Sans eux, les articles tomberaient à intervalle constant et la planche
 * ressemblerait à un tableau. Ce sont des valeurs fixes et non un tirage
 * aléatoire : la page est générée au build, elle doit tomber deux fois de
 * suite au même endroit.
 */
const DRIFT = [0, 2, -1, 1, 3, -2, 1, -1];

/** Densité : une entrée toutes les trois cases environ. */
const CELLS_PER_ENTRY = 3;

/**
 * Trame minimale — deux rangées de six.
 *
 * Assez pour qu'on lise une planche et non une liste, assez peu pour qu'une
 * rubrique de deux articles tienne dans un écran. Au-delà, c'est la densité
 * qui décide : le vide doit rester une respiration, pas un défilement.
 */
const MIN_CELLS = 12;

/** Multiple commun aux nombres de colonnes (2, 3 et 6) : les rangées restent pleines. */
const ROW_UNIT = 6;

export function toLibraryGrid(posts: PostCardView[]): LibraryCell[] {
  const wanted = Math.max(MIN_CELLS, posts.length * CELLS_PER_ENTRY);
  const total = Math.ceil(wanted / ROW_UNIT) * ROW_UNIT;

  /*
    Placement : les entrées s'étalent sur toute la trame, de la première case à
    la dernière, puis chacune se décale de quelques cases. Deux entrées ne
    peuvent pas revendiquer la même case — la seconde glisse d'un cran.
  */
  const taken = new Map<number, PostCardView>();
  const span = posts.length > 1 ? (total - 1) / (posts.length - 1) : 0;

  posts.forEach((post, index) => {
    const regular = Math.round(index * span);
    let slot = regular + DRIFT[index % DRIFT.length]!;
    slot = Math.min(Math.max(slot, 0), total - 1);
    while (taken.has(slot)) slot = (slot + 1) % total;
    taken.set(slot, post);
  });

  return Array.from({ length: total }, (_, index) => ({
    number: String(index + 1).padStart(2, '0'),
    entry: taken.get(index) ?? null,
  }));
}

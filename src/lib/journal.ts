import { stegaClean } from '@sanity/client/stega';
import { resolveImage } from './sanity/image';
import { libraryRubricPath, postPath } from '~/i18n/routes';
import {
  LIBRARY_RUBRICS,
  defaultLibraryRubric,
  getLibraryRubric,
  isLibraryRubric,
  type LibraryRubric,
} from '~/content/libraryRubrics';
import type { Locale } from '~/i18n/config';
import type { JournalBlock, JournalFigure, JournalNote, PostCard } from './sanity/types';

/**
 * Modèles de vue du Journal.
 *
 * Même contrat que `viewModels.ts` pour le portfolio : le composant client ne
 * reçoit que des chaînes déjà formatées (dates, temps de lecture, URLs), jamais
 * de document Sanity brut ni de logique de formatage à rejouer côté navigateur.
 */

export interface LibraryRubricView {
  key: LibraryRubric;
  title: string;
  mark: string;
  description: string;
  /** La planche qui accompagne la rubrique — voir `PlateFigure.astro`. */
  plate: string;
  href: string;
  /** Cote de la rubrique dans le classement — « 01 » à « 05 ». */
  folio: string;
  count: number;
}

export interface PostCardView {
  title: string;
  href: string;
  /** Rubriques de l'article, dans l'ordre du classement. */
  rubrics: Array<{ key: LibraryRubric; title: string; mark: string }>;
  /** Date compacte imprimée en grand sur la fiche : « 25.08.26 ». */
  dateStamp: string;
  /** Attribut `datetime` de la balise `<time>`. */
  dateIso: string;
  image: {
    src: string;
    srcset: string;
    width: number;
    height: number;
    alt: string;
  } | null;
}

/**
 * Rubriques d'un article, nettoyées et remises dans l'ordre du classement.
 *
 * L'ordre vient de `LIBRARY_RUBRICS`, jamais de la saisie : deux articles
 * classés dans les mêmes rubriques doivent afficher leurs cotes dans le même
 * ordre, sans quoi la grille ne se lit plus. Un article dont aucune valeur
 * n'est reconnue retombe sur la rubrique par défaut plutôt que de paraître
 * sans classement.
 */
export function postRubrics(card: Pick<PostCard, 'rubrics'>): LibraryRubric[] {
  const declared = new Set(
    (card.rubrics ?? []).map((rubric) => stegaClean(rubric)).filter(isLibraryRubric),
  );

  const ordered = LIBRARY_RUBRICS.map(({ value }) => value).filter((value) => declared.has(value));
  return ordered.length > 0 ? ordered : [defaultLibraryRubric];
}

/** Date ISO exploitable, quelle que soit la fraîcheur du champ côté CMS. */
function toDate(value: string | undefined): Date | null {
  const clean = stegaClean(value ?? '');
  if (!clean) return null;
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Cote de la fiche : jour.mois.année sur deux chiffres, à la manière d'un
 * tampon d'archive. Le format reste identique quelle que soit la langue —
 * c'est un repère graphique autant qu'une date.
 */
export function formatJournalStamp(value: string | undefined): string {
  const date = toDate(value);
  if (!date) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return [pad(date.getDate()), pad(date.getMonth() + 1), pad(date.getFullYear() % 100)].join('.');
}

export function toPostCardView(
  card: PostCard,
  locale: Locale,
): PostCardView {
  const image = resolveImage(card.coverImage, { width: 900 });
  const rubrics = postRubrics(card).map((key) => {
    const rubric = getLibraryRubric(key)!;
    return { key, title: rubric.title, mark: rubric.mark };
  });

  return {
    title: card.title,
    href: postPath(locale, card.slug),
    rubrics,
    dateStamp: formatJournalStamp(card.publishedAt),
    dateIso: stegaClean(card.publishedAt ?? '').slice(0, 10),
    image: image ? { ...image, alt: image.alt || card.title } : null,
  };
}

/**
 * Les cinq rubriques, avec leur adresse et le nombre d'articles qu'elles tiennent.
 *
 * Contrairement à l'ancien filtre, une rubrique vide n'est PAS retirée : elle a
 * désormais une page, une adresse partageable et un mot dans le texte
 * d'accueil. La faire disparaître casserait un lien plutôt qu'elle
 * n'épargnerait une grille vide — la page vide, elle, le dit avec des mots.
 */
export function toLibraryRubricViews(posts: PostCardView[], locale: Locale): LibraryRubricView[] {
  return LIBRARY_RUBRICS.map(({ value, title, mark, description, plate }, index) => ({
    key: value,
    title,
    mark,
    description,
    plate,
    href: libraryRubricPath(locale, value),
    folio: String(index + 1).padStart(2, '0'),
    count: posts.filter((post) => post.rubrics.some((rubric) => rubric.key === value)).length,
  }));
}

/** Les articles d'une rubrique, dans l'ordre chronologique déjà établi. */
export function filterByRubric(posts: PostCardView[], rubric: LibraryRubric): PostCardView[] {
  return posts.filter((post) => post.rubrics.some((entry) => entry.key === rubric));
}

/* -------------------------------------------------------------------------- */
/* Composition d'un article                                                    */
/* -------------------------------------------------------------------------- */

export type JournalFigureView = JournalFigure & { label: string | null };
export type JournalNoteView = JournalNote & { index: number };

/**
 * Une rangée de la composition : ce qui occupe la colonne de lecture, et ce qui
 * l'accompagne en marge.
 *
 * La mise en page place les notes et les figures de marge EN FACE du bloc
 * qu'elles commentent. Une grille CSS seule ne sait pas le faire — chaque bloc
 * y prendrait sa propre rangée, et la note tomberait sous le texte au lieu de
 * se tenir à côté. On regroupe donc ici, à la construction, avant tout rendu.
 */
export interface JournalRow {
  key: string;
  main: JournalBlock | null;
  mainFigure: JournalFigureView | null;
  aside: Array<JournalNoteView | JournalFigureView>;
}

export function toJournalRows(blocks: JournalBlock[] = []): JournalRow[] {
  const rows: JournalRow[] = [];
  let figureCount = 0;
  let noteCount = 0;

  /** Ajoute une entrée en marge du dernier bloc de lecture, sinon ouvre une rangée. */
  const pushAside = (key: string, entry: JournalNoteView | JournalFigureView) => {
    const target = rows.at(-1);
    // Une note d'ouverture n'a rien à commenter : elle inaugure sa rangée.
    if (target?.main) target.aside.push(entry);
    else rows.push({ key, main: null, mainFigure: null, aside: [entry] });
  };

  for (const block of blocks) {
    if (block._type === 'journalNote') {
      pushAside(block._key, { ...block, index: ++noteCount });
      continue;
    }

    if (block._type === 'journalFigure') {
      /*
        Le repère s'écrit comme partout ailleurs sur le site — « fig. 01 » —
        et non en chiffres romains : la légende d'un article se lit dans la
        même forme que celle d'une planche d'accueil ou d'une fiche projet.
      */
      const label = `fig. ${String(++figureCount).padStart(2, '0')}`;

      if (stegaClean(block.placement) === 'marge') {
        pushAside(block._key, { ...block, label });
        continue;
      }

      rows.push({ key: block._key, main: block, mainFigure: { ...block, label }, aside: [] });
      continue;
    }

    rows.push({ key: block._key, main: block, mainFigure: null, aside: [] });
  }

  return rows;
}

import { stegaClean } from '@sanity/client/stega';
import { resolveImage } from './sanity/image';
import { postPath } from '~/i18n/routes';
import {
  JOURNAL_CATEGORIES,
  defaultJournalCategory,
  getJournalCategory,
  type JournalCategory,
} from '~/content/journalCategories';
import type { Locale } from '~/i18n/config';
import type { JournalBlock, JournalFigure, JournalNote, PostCard } from './sanity/types';

/**
 * Modèles de vue du Journal.
 *
 * Même contrat que `viewModels.ts` pour le portfolio : le composant client ne
 * reçoit que des chaînes déjà formatées (dates, temps de lecture, URLs), jamais
 * de document Sanity brut ni de logique de formatage à rejouer côté navigateur.
 */

export interface JournalCategoryView {
  key: JournalCategory;
  title: string;
  mark: string;
  count: number;
}

export interface PostCardView {
  id: string;
  /** Rang chronologique, figé sur la liste complète : il ne bouge pas au filtrage. */
  number: string;
  title: string;
  href: string;
  categoryKey: JournalCategory;
  categoryTitle: string;
  /** Date complète, lisible : « 25 août 2026 ». */
  dateLabel: string;
  /** Date compacte imprimée en grand sur la fiche : « 25.08.26 ». */
  dateStamp: string;
  /** Attribut `datetime` de la balise `<time>`. */
  dateIso: string;
  /**
   * Fiche de l'article, à la manière d'une planche de botanique : la rubrique
   * ouvre la liste, puis viennent les lignes libres saisies dans le CMS.
   */
  facts: Array<{ key: string; label: string; value: string }>;
  excerpt: string | null;
  image: {
    src: string;
    srcset: string;
    width: number;
    height: number;
    alt: string;
  } | null;
}

/** Rubrique d'un article, avec repli sur le Cahier de recherche. */
export function postCategory(card: Pick<PostCard, 'category'>): JournalCategory {
  return getJournalCategory(stegaClean(card.category))?.value ?? defaultJournalCategory;
}

/** Date ISO exploitable, quelle que soit la fraîcheur du champ côté CMS. */
function toDate(value: string | undefined): Date | null {
  const clean = stegaClean(value ?? '');
  if (!clean) return null;
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatJournalDate(value: string | undefined, locale: Locale): string {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
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

/** Lignes libres de la fiche, nettoyées des saisies incomplètes. */
export function postFreeFacts(card: Pick<PostCard, 'listingFacts'>) {
  return (card.listingFacts ?? [])
    .filter((fact): fact is typeof fact & { label: string; value: string } =>
      Boolean(fact.label?.trim() && fact.value?.trim()),
    )
    .slice(0, 5)
    .map((fact) => ({ key: fact._key, label: fact.label.trim(), value: fact.value.trim() }));
}

export function toPostCardView(
  card: PostCard,
  locale: Locale,
  index = 0,
  /** Intitulé de la ligne « rubrique », traduit par la page appelante. */
  categoryLabel = 'Rubrique',
): PostCardView {
  const image = resolveImage(card.coverImage, { width: 900 });
  const category = postCategory(card);
  const categoryTitle = getJournalCategory(category)?.title ?? '';

  return {
    id: card._id,
    number: String(index + 1).padStart(2, '0'),
    title: card.title,
    href: postPath(locale, card.slug),
    categoryKey: category,
    categoryTitle,
    dateLabel: formatJournalDate(card.publishedAt, locale),
    dateStamp: formatJournalStamp(card.publishedAt),
    dateIso: stegaClean(card.publishedAt ?? '').slice(0, 10),
    facts: [
      ...(categoryTitle
        ? [{ key: 'category', label: categoryLabel, value: categoryTitle }]
        : []),
      ...postFreeFacts(card),
    ],
    excerpt: card.excerpt?.trim() ? card.excerpt : null,
    image: image ? { ...image, alt: image.alt || card.title } : null,
  };
}

/**
 * Rubriques proposées au filtrage.
 *
 * Une rubrique sans article n'est pas affichée : aucun filtre ne peut renvoyer
 * une grille vide.
 */
export function toJournalCategoryViews(posts: PostCardView[]): JournalCategoryView[] {
  return JOURNAL_CATEGORIES.map(({ value, title, mark }) => ({
    key: value,
    title,
    mark,
    count: posts.filter((post) => post.categoryKey === value).length,
  })).filter((category) => category.count > 0);
}

/* -------------------------------------------------------------------------- */
/* Composition d'un article                                                    */
/* -------------------------------------------------------------------------- */

const ROMAN = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
] as const;

/** Chiffre romain — la numérotation des planches d'une flore, pas des pages. */
export function toRoman(value: number): string {
  let rest = Math.max(1, Math.floor(value));
  let out = '';
  for (const [weight, symbol] of ROMAN) {
    while (rest >= weight) {
      out += symbol;
      rest -= weight;
    }
  }
  return out;
}

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
      const label = `Fig. ${toRoman(++figureCount)}`;

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

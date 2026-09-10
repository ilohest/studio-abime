/**
 * Table des folios du site — la numérotation « 01 » à « 05 » et ses sous-numéros.
 *
 * Cette table alimente le rail de navigation et garantit que ses numéros, ses
 * ancres et son suivi de lecture restent issus d'une seule source.
 *
 * Les libellés restent en français : ce sont ceux du rail avant cette
 * extraction. Le jour où une seconde langue arrive, c'est ici qu'ils passeront
 * par le dictionnaire d'interface — pas dans deux composants à la fois.
 */
/*
  Imports relatifs, et non `~/…` : ce module est aussi lu par les schémas du
  Studio, dont le bundle ne connaît pas l'alias du site.
*/
import type { Locale } from '../i18n/config';
import {
  contactPath,
  journalIndexPath,
  laboPath,
  projectsIndexPath,
  shopIndexPath,
} from '../i18n/routes';

export type SiteSectionKey = 'labo' | 'experiences' | 'journal' | 'shop' | 'contact';

export interface SiteSectionItem {
  key: string;
  label: string;
  /** Ancre dans la page de la section. */
  hash: string;
  /** Clé de filtre du Journal, lue par le rail pour son suivi de lecture. */
  filterKey?: string;
}

interface SiteSectionDefinition {
  key: SiteSectionKey;
  title: string;
  path: (locale: Locale) => string;
  items: SiteSectionItem[];
}

/**
 * L'ordre de ce tableau EST la numérotation : première section = 01. Réordonner
 * renumérote le rail d'un seul geste.
 */
const sections: SiteSectionDefinition[] = [
  {
    key: 'labo',
    title: 'Le Labo',
    path: laboPath,
    items: [
      { key: 'services', label: 'Services', hash: '#services' },
      { key: 'vision', label: 'Vision', hash: '#vision' },
      { key: 'methode', label: 'La méthode', hash: '#methode' },
      { key: 'archives', label: 'Archives', hash: '#archives' },
    ],
  },
  {
    key: 'experiences',
    title: 'Expériences',
    path: projectsIndexPath,
    items: [
      { key: 'cas-etude', label: 'Cas d’étude', hash: '#cas-etude' },
      { key: 'references', label: 'Références', hash: '#references' },
    ],
  },
  {
    key: 'journal',
    title: 'Journal',
    path: journalIndexPath,
    items: [
      {
        key: 'cahier-de-recherche',
        label: 'Cahier de recherche',
        hash: '#cahier-de-recherche',
        filterKey: 'cahier-de-recherche',
      },
      { key: 'actualites', label: 'Actualités', hash: '#actualites', filterKey: 'actualites' },
    ],
  },
  {
    /*
      Aucune sous-entrée fixe : celles du Shop sont les collections Shopify,
      injectées par le rail au rendu.
    */
    key: 'shop',
    title: 'Shop',
    path: shopIndexPath,
    items: [],
  },
  {
    key: 'contact',
    title: 'Contact',
    path: contactPath,
    items: [
      { key: 'informations', label: 'Informations', hash: '#informations' },
      { key: 'enquete', label: 'Enquête', hash: '#enquete' },
      { key: 'index', label: 'Index', hash: '#index' },
    ],
  },
];

export interface ResolvedSiteItem extends SiteSectionItem {
  /** « 01.2 ». */
  folio: string;
  href: string;
}

export interface ResolvedSiteSection {
  key: SiteSectionKey;
  title: string;
  /** « 01 ». */
  folio: string;
  href: string;
  items: ResolvedSiteItem[];
}

const pad = (position: number) => String(position).padStart(2, '0');

/** Les sections du site, numérotées et résolues en URLs pour une langue. */
export function getSiteSections(locale: Locale): ResolvedSiteSection[] {
  return sections.map((section, index) => {
    const folio = pad(index + 1);
    const href = section.path(locale);

    return {
      key: section.key,
      title: section.title,
      folio,
      href,
      items: section.items.map((item, itemIndex) => ({
        ...item,
        folio: `${folio}.${itemIndex + 1}`,
        href: `${href}${item.hash}`,
      })),
    };
  });
}

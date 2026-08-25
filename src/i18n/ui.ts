/**
 * Dictionnaire des micro-textes d'interface (labels, boutons, états vides).
 *
 * Règle : tout ce qui est éditorial vit dans Sanity ; seuls les textes d'UI
 * structurels vivent ici. Le dictionnaire de `defaultLocale` fait foi pour le typage,
 * les autres langues sont partielles et retombent dessus si une clé manque.
 */
import { defaultLocale, type Locale } from './config';

const fr = {
  'nav.skipToContent': 'Aller au contenu',
  'nav.menu': 'Menu',
  'nav.close': 'Fermer',
  'nav.projects': 'Expériences',
  'nav.journal': 'Journal',
  'locale.switch': 'Changer de langue',
  'projects.all': 'Tous',
  'projects.filterBy': 'Filtrer par',
  'projects.empty': 'Aucun projet ne correspond à cette sélection.',
  'projects.count': 'projet(s)',
  'projects.viewProject': 'Voir le projet',
  'references.title': 'Références',
  'project.client': 'Client',
  'project.year': 'Année',
  'project.services': 'Services',
  'project.channels': 'Canaux',
  'project.backToProjects': 'Retour aux expériences',
  'project.next': 'Projet suivant',
  'journal.title': 'Journal',
  'journal.all': 'Tout',
  'journal.filterBy': 'Filtrer par rubrique',
  'journal.empty': 'Aucun article dans cette rubrique.',
  'journal.emptyAll': 'Le Journal ouvre bientôt ses pages.',
  'journal.count': 'article(s)',
  'journal.category': 'Rubrique',
  'journal.read': 'Lire l’article',
  'journal.backToJournal': 'Retour au journal',
  'journal.next': 'Article suivant',
  'error.notFound.title': 'Page introuvable',
  'error.notFound.body': "La page demandée n'existe pas ou a été déplacée.",
  'error.backHome': "Retour à l'accueil",
} as const;

export type TranslationKey = keyof typeof fr;

const en: Partial<Record<TranslationKey, string>> = {
  'nav.skipToContent': 'Skip to content',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'nav.projects': 'Work',
  'nav.journal': 'Journal',
  'locale.switch': 'Change language',
  'projects.all': 'All',
  'projects.filterBy': 'Filter by',
  'projects.empty': 'No project matches this selection.',
  'projects.count': 'project(s)',
  'projects.viewProject': 'View project',
  'references.title': 'References',
  'project.client': 'Client',
  'project.year': 'Year',
  'project.services': 'Services',
  'project.channels': 'Channels',
  'project.backToProjects': 'Back to work',
  'project.next': 'Next project',
  'journal.title': 'Journal',
  'journal.all': 'All',
  'journal.filterBy': 'Filter by section',
  'journal.empty': 'No article in this section.',
  'journal.emptyAll': 'The journal opens its pages soon.',
  'journal.count': 'article(s)',
  'journal.category': 'Section',
  'journal.read': 'Read the article',
  'journal.backToJournal': 'Back to the journal',
  'journal.next': 'Next article',
  'error.notFound.title': 'Page not found',
  'error.notFound.body': 'The requested page does not exist or has been moved.',
  'error.backHome': 'Back to home',
};

const dictionaries: Record<string, Partial<Record<TranslationKey, string>>> = { fr, en };

/** Retourne une fonction `t()` liée à une langue, avec fallback sur la langue par défaut. */
export function useTranslations(locale: Locale) {
  return function t(key: TranslationKey): string {
    return dictionaries[locale]?.[key] ?? dictionaries[defaultLocale]?.[key] ?? key;
  };
}

/** Dictionnaire complet d'une langue — utile pour hydrater un composant Vue. */
export function getDictionary(locale: Locale): Record<TranslationKey, string> {
  const base = dictionaries[defaultLocale] ?? {};
  return { ...base, ...(dictionaries[locale] ?? {}) } as Record<TranslationKey, string>;
}

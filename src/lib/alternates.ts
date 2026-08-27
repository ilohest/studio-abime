import { isLocale, locales, type Locale } from '~/i18n/config';
import {
  contactPath,
  journalIndexPath,
  laboPath,
  localizedPath,
  pagePath,
  postPath,
  projectPath,
  projectsIndexPath,
  orderConfirmationPath,
  shopIndexPath,
} from '~/i18n/routes';
import { loadQuery } from './sanity/loadQuery';
import { translationsQuery } from './sanity/queries';

interface Translation {
  _type: 'page' | 'project' | 'post';
  language: Locale;
  slug: string | null;
}

/**
 * URLs de la page courante dans les autres langues (balises `hreflang`
 * et sélecteur de langue).
 *
 * Court-circuité tant que le site est monolingue : aucune requête inutile
 * aujourd'hui, activation automatique le jour où une langue est ajoutée.
 */
export async function getDocumentAlternates(
  documentId: string | undefined,
  locale: Locale,
): Promise<Partial<Record<Locale, string>>> {
  if (locales.length < 2 || !documentId) return {};

  const translations = await loadQuery<Translation[] | null>({
    query: translationsQuery,
    params: { id: documentId },
    locale,
    fallback: [],
  });

  const alternates: Partial<Record<Locale, string>> = {};

  for (const translation of translations ?? []) {
    if (!translation?.slug || !isLocale(translation.language)) continue;
    alternates[translation.language] =
      translation._type === 'project'
        ? projectPath(translation.language, translation.slug)
        : translation._type === 'post'
          ? postPath(translation.language, translation.slug)
          : pagePath(translation.language, translation.slug);
  }

  return alternates;
}

/** Alternates des routes générées par le code (accueil, index portfolio). */
export function getStaticAlternates(
  kind: 'home' | 'projectIndex' | 'labo' | 'contact' | 'journal' | 'shop' | 'orderConfirmation',
): Partial<Record<Locale, string>> {
  if (locales.length < 2) return {};

  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      kind === 'home'
        ? localizedPath(locale)
        : kind === 'contact'
          ? contactPath(locale)
        : kind === 'labo'
          ? laboPath(locale)
        : kind === 'journal'
          ? journalIndexPath(locale)
        : kind === 'shop'
          ? shopIndexPath(locale)
        : kind === 'orderConfirmation'
          ? orderConfirmationPath(locale)
          : projectsIndexPath(locale),
    ]),
  );
}

import type { StructureBuilder, StructureResolver } from 'sanity/structure';
import { locales, localeMeta } from '../../src/i18n/config';

/** Identifiant figé du document de réglages globaux (instance unique). */
export const SITE_SETTINGS_ID = 'siteSettings';

/** Types pilotés par une entrée dédiée : on les retire de la liste générique. */
const HANDLED_TYPES = ['page', 'project', 'category', 'siteSettings', 'localizedSettings', 'translation.metadata'];

/**
 * Liste de documents d'un type, éclatée par langue dès qu'il y en a plusieurs.
 * En monolingue, on affiche la liste à plat : aucun niveau de navigation inutile.
 */
function byLanguage(S: StructureBuilder, schemaType: string, title: string) {
  if (locales.length === 1) {
    return S.documentTypeList(schemaType).title(title);
  }

  return S.list()
    .title(title)
    .items(
      locales.map((locale) =>
        S.listItem()
          .title(localeMeta[locale]?.label ?? locale)
          .id(locale)
          .child(
            // La création d'une traduction passe par le sélecteur de langue du
            // plugin document-internationalization (dans le document lui-même),
            // qui garantit le lien entre versions.
            S.documentTypeList(schemaType)
              .title(`${title} — ${locale.toUpperCase()}`)
              .filter('_type == $type && language == $locale')
              .params({ type: schemaType, locale }),
          ),
      ),
    );
}

/**
 * Structure du back-office.
 *
 * Objectif : que l'éditeur voie « Contenu » puis « Réglages », et jamais la
 * plomberie (métadonnées de traduction, types techniques).
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Studio Abîme')
    .items([
      S.listItem()
        .title('Pages')
        .id('pages')
        .child(byLanguage(S, 'page', 'Pages')),

      S.listItem()
        .title('Projets')
        .id('projects')
        .child(byLanguage(S, 'project', 'Projets')),

      S.listItem()
        .title('Catégories')
        .id('categories')
        .child(byLanguage(S, 'category', 'Catégories')),

      S.divider(),

      S.listItem()
        .title('Réglages du site')
        .id('localizedSettings')
        .child(
          locales.length === 1
            ? S.documentTypeList('localizedSettings').title('Réglages du site')
            : byLanguage(S, 'localizedSettings', 'Réglages du site'),
        ),

      S.listItem()
        .title('Réglages globaux')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId(SITE_SETTINGS_ID)
            .title('Réglages globaux'),
        ),

      S.divider(),

      // Filet de sécurité : tout type non explicitement traité reste accessible.
      ...S.documentTypeListItems().filter((item) => !HANDLED_TYPES.includes(item.getId() ?? '')),
    ]);

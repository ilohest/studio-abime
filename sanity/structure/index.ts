import type {
  StructureBuilder,
  StructureResolver,
  StructureResolverContext,
} from 'sanity/structure';
import { locales, localeMeta } from '../../src/i18n/config';

/** Identifiant figé du document de réglages globaux (instance unique). */
export const SITE_SETTINGS_ID = 'siteSettings';

/** Types pilotés par une entrée dédiée : on les retire de la liste générique. */
const HANDLED_TYPES = [
  'page',
  'project',
  'category',
  'client',
  'post',
  'projectsPage',
  'laboPage',
  'journalPage',
  'siteSettings',
  'localizedSettings',
  'translation.metadata',
];

/**
 * Liste de documents d'un type, éclatée par langue dès qu'il y en a plusieurs.
 * En monolingue, on affiche la liste à plat : aucun niveau de navigation inutile.
 */
function byLanguage(
  S: StructureBuilder,
  schemaType: string,
  title: string,
  /* Tri par défaut de la liste. Sert aux types dont l'ordre a un sens à
     l'affichage : la liste montre alors ce que le site montrera. */
  defaultOrdering?: Array<{ field: string; direction: 'asc' | 'desc' }>,
) {
  const list = (listTitle: string) => {
    const documents = S.documentTypeList(schemaType).title(listTitle);
    return defaultOrdering ? documents.defaultOrdering(defaultOrdering) : documents;
  };

  if (locales.length === 1) {
    return list(title);
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
            list(`${title} — ${locale.toUpperCase()}`)
              .filter('_type == $type && language == $locale')
              .params({ type: schemaType, locale }),
          ),
      ),
    );
}

/** Ouvre directement la page d’accueil référencée pour une langue donnée. */
async function homePageDocument(
  S: StructureBuilder,
  context: StructureResolverContext,
  locale: string,
) {
  const documentId = await context
    .getClient({ apiVersion: '2025-02-19' })
    .fetch<string | null>(
      '*[_type == "localizedSettings" && language == $locale && defined(homePage)][0].homePage._ref',
      { locale },
    );

  /*
    Jamais de point dans un identifiant figé : Sanity traite tout `_id` qui en
    contient comme un chemin privé — le même mécanisme que `drafts.`. Le
    document reste visible dans le Studio, mais l'API publique le renvoie vide
    et la page n'existe pas sur le site. Des tirets, donc, ici comme dans
    `sanity/seed/build-home.mjs`, qui doit produire le MÊME identifiant.
  */
  const fallbackId = locale === 'fr' ? 'page-accueil-fr' : `page-home-${locale}`;

  return S.document()
    .schemaType('page')
    .documentId(documentId ?? fallbackId)
    .initialValueTemplate(`page-${locale}`)
    .title(`Page d’accueil${locales.length > 1 ? ` — ${locale.toUpperCase()}` : ''}`);
}

function homePageByLanguage(S: StructureBuilder, context: StructureResolverContext) {
  if (locales.length === 1) {
    return () => homePageDocument(S, context, locales[0]);
  }

  return S.list()
    .title('Page d’accueil')
    .items(
      locales.map((locale) =>
        S.listItem()
          .title(localeMeta[locale]?.label ?? locale)
          .id(locale)
          .child(() => homePageDocument(S, context, locale)),
      ),
    );
}

/** Un document unique par langue, ouvert directement sans liste intermédiaire. */
function localizedSingleton(S: StructureBuilder, schemaType: string, title: string) {
  if (locales.length === 1) {
    const locale = locales[0];
    return S.document()
      .schemaType(schemaType)
      .documentId(`${schemaType}-${locale}`)
      .initialValueTemplate(`${schemaType}-${locale}`)
      .title(title);
  }

  return S.list()
    .title(title)
    .items(
      locales.map((locale) =>
        S.listItem()
          .title(localeMeta[locale]?.label ?? locale)
          .id(locale)
          .child(
            S.document()
              .schemaType(schemaType)
              .documentId(`${schemaType}-${locale}`)
              .initialValueTemplate(`${schemaType}-${locale}`)
              .title(`${title} — ${locale.toUpperCase()}`),
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
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Studio Abîme')
    .items([
      S.listItem()
        .title('Pages')
        .id('pages')
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Page d’accueil')
                .id('homePage')
                .child(homePageByLanguage(S, context)),
              S.listItem()
                .title('Page Expériences')
                .id('projectsPage')
                .child(localizedSingleton(S, 'projectsPage', 'Page Expériences')),
              S.listItem()
                .title('Page Labo')
                .id('laboPage')
                .child(localizedSingleton(S, 'laboPage', 'Page Labo')),
              S.listItem()
                .title('Page Journal')
                .id('journalPage')
                .child(localizedSingleton(S, 'journalPage', 'Page Journal')),
            ]),
        ),

      S.listItem()
        .title('Projets')
        .id('projects')
        .child(byLanguage(S, 'project', 'Projets')),

      S.listItem()
        .title('Clients')
        .id('clients')
        // Ordre d'encodage : c'est lui qui remplit les cases de la table des
        // éléments de la page Expériences.
        .child(byLanguage(S, 'client', 'Clients', [{ field: '_createdAt', direction: 'asc' }])),

      S.listItem()
        .title('Journal')
        .id('posts')
        .child(byLanguage(S, 'post', 'Articles du Journal')),

      S.listItem()
        .title('Catégories')
        .id('categories')
        .child(byLanguage(S, 'category', 'Catégories')),

      S.divider(),

      S.listItem()
        .title('Réglages du site')
        .id('settings')
        .child(
          S.list()
            .title('Réglages du site')
            .items([
              S.listItem()
                .title('Textes et SEO')
                .id('localizedSettings')
                .child(
                  localizedSingleton(
                    S,
                    'localizedSettings',
                    'Textes et SEO',
                  ),
                ),
              S.listItem()
                .title('Logo et réseaux sociaux')
                .id('siteSettings')
                .child(
                  S.document()
                    .schemaType('siteSettings')
                    .documentId(SITE_SETTINGS_ID)
                    .title('Logo et réseaux sociaux'),
                ),
            ]),
        ),

      S.divider(),

      // Filet de sécurité : tout type non explicitement traité reste accessible.
      ...S.documentTypeListItems().filter((item) => !HANDLED_TYPES.includes(item.getId() ?? '')),
    ]);

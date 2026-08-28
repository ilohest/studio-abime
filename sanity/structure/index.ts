import type {
  StructureBuilder,
  StructureResolver,
  StructureResolverContext,
} from 'sanity/structure';
import { locales, localeMeta } from '../../src/i18n/config';
import type { LegalPageKey } from '../../src/i18n/routes';
import { homePageId } from '../../src/i18n/routes';
import Documentation from '../components/Documentation';

/** Identifiant figé du document de réglages globaux (instance unique). */
export const SITE_SETTINGS_ID = 'siteSettings';

/** Identifiant figé de l'interrupteur de maintenance (instance unique). */
export const MAINTENANCE_ID = 'maintenance';

/** Types pilotés par une entrée dédiée : on les retire de la liste générique. */
const HANDLED_TYPES = [
  'page',
  'project',
  'client',
  'post',
  'projectsPage',
  'laboPage',
  'journalPage',
  'shopPage',
  'siteSettings',
  'localizedSettings',
  'maintenance',
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
  locale: (typeof locales)[number],
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
  return S.document()
    .schemaType('page')
    .documentId(documentId ?? homePageId(locale))
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

/**
 * Un document unique par langue, ouvert directement sans liste intermédiaire.
 *
 * `idBase` sépare l'identifiant du document de son type. Les pages à contenu
 * unique se suffisent du type (`laboPage-fr`), mais plusieurs documents peuvent
 * partager un même type tout en étant chacun singulier : c'est le cas des pages
 * légales, qui sont des `page` ordinaires à l'emplacement figé.
 */
function localizedSingleton(
  S: StructureBuilder,
  schemaType: string,
  title: string,
  idBase: string = schemaType,
) {
  const document = (locale: (typeof locales)[number], documentTitle: string) =>
    S.document()
      .schemaType(schemaType)
      .documentId(`${idBase}-${locale}`)
      .initialValueTemplate(`${schemaType}-${locale}`)
      .title(documentTitle);

  if (locales.length === 1) return document(locales[0], title);

  return S.list()
    .title(title)
    .items(
      locales.map((locale) =>
        S.listItem()
          .title(localeMeta[locale]?.label ?? locale)
          .id(locale)
          .child(document(locale, `${title} — ${locale.toUpperCase()}`)),
      ),
    );
}

/**
 * Pages légales.
 *
 * Ce sont des documents `page` comme les autres, mais leur existence et leur
 * slug sont imposés par le site — le pied de page les attend à une adresse
 * précise, et la loi les attend tout court. Elles sont donc nommées une à une,
 * au même rang que les pages à contenu unique, plutôt que noyées dans une liste
 * ouverte où il faudrait les chercher.
 *
 * Leur contenu est amorcé par `npm run legal:seed`, qui crée les documents aux
 * identifiants ci-dessous.
 */
const LEGAL_PAGES: Array<{ key: LegalPageKey; title: string }> = [
  { key: 'notice', title: 'Mentions légales' },
  { key: 'privacy', title: 'Politique de confidentialité' },
  { key: 'cookies', title: 'Politique cookies' },
];

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
              S.listItem()
                .title('Page Shop')
                .id('shopPage')
                .child(localizedSingleton(S, 'shopPage', 'Page Shop')),

              // Les pages légales restent au même rang que les précédentes, mais
              // ne relèvent pas du même geste éditorial : le trait les sépare
              // sans les reléguer.
              S.divider(),

              ...LEGAL_PAGES.map(({ key, title }) =>
                S.listItem()
                  .title(title)
                  .id(`legal-${key}`)
                  .child(localizedSingleton(S, 'page', title, `page-legal-${key}`)),
              ),
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
                .title('Identité et réseaux sociaux')
                .id('siteSettings')
                .child(
                  S.document()
                    .schemaType('siteSettings')
                    .documentId(SITE_SETTINGS_ID)
                    .title('Identité et réseaux sociaux'),
                ),

              // Interrupteur, pas contenu : il masque le site entier. Il est
              // séparé du reste des réglages pour qu'on ne l'active — ni ne
              // l'oublie allumé — par distraction.
              S.divider(),

              S.listItem()
                .title('Écran de maintenance')
                .id('maintenance')
                .child(
                  S.document()
                    .schemaType('maintenance')
                    .documentId(MAINTENANCE_ID)
                    .title('Écran de maintenance'),
                ),
            ]),
        ),

      S.divider(),

      // Notice d'utilisation — écrite en code, rien à saisir ni à publier.
      S.listItem()
        .title('Mode d’emploi')
        .id('documentation')
        .child(S.component(Documentation).title('Mode d’emploi').id('documentation')),

      S.divider(),

      // Filet de sécurité : tout type non explicitement traité reste accessible.
      ...S.documentTypeListItems().filter((item) => !HANDLED_TYPES.includes(item.getId() ?? '')),
    ]);

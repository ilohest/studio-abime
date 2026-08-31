import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { documentInternationalization } from '@sanity/document-internationalization';

import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';
import { baseLanguage, supportedLanguages, TRANSLATED_DOCUMENT_TYPES } from './sanity/lib/i18n';
import { resolvePresentationLocations } from './sanity/lib/presentation';
import {
  createSlugAwareDuplicateAction,
  SlugOnPublishAction,
} from './sanity/actions/slugOnPublishAction';
import type { DuplicateDocumentActionComponent } from 'sanity';

/**
 * Configuration du Studio Sanity.
 *
 * Le Studio est une application autonome, déployée à part sur
 * https://studio.studioabime.com (`npm run studio:dev` / `npm run studio:build`).
 * Le site et le back-office vivent donc sur deux origines distinctes : les deux
 * doivent être déclarées dans les origines CORS du projet Sanity, et l'origine
 * du site prévisualisé est fournie ci-dessous au Presentation Tool.
 */
/**
 * Résolution des variables d'environnement.
 *
 * La CLI Sanity n'expose au bundle navigateur que les variables préfixées
 * `SANITY_STUDIO_` — le préfixe `PUBLIC_` d'Astro y est ignoré. Le Studio lit
 * donc `SANITY_STUDIO_*` en priorité et retombe sur les variables `PUBLIC_*`,
 * qui restent la source de vérité côté site et fonctionnent quand la config est
 * chargée par Node (CLI, typegen).
 */
const env = {
  ...(typeof process !== 'undefined' ? process.env : {}),
  ...(import.meta.env ?? {}),
};

const read = (studioKey: string, publicKey: string) =>
  env[studioKey] || env[publicKey] || undefined;

/**
 * Vision est une console GROQ : un outil de développement. Utile en local pour
 * mettre au point une requête, hors sujet dans le back-office livré — d'où sa
 * présence conditionnée au serveur de développement.
 */
const isDev = Boolean((import.meta.env ?? {}).DEV);

const projectId = read('SANITY_STUDIO_PROJECT_ID', 'PUBLIC_SANITY_PROJECT_ID') ?? '';
const dataset = read('SANITY_STUDIO_DATASET', 'PUBLIC_SANITY_DATASET') ?? 'production';
const apiVersion = read('SANITY_STUDIO_API_VERSION', 'PUBLIC_SANITY_API_VERSION') ?? '2025-02-19';

/** Origine du site prévisualisé dans le Presentation Tool. */
const previewOrigin =
  read('SANITY_STUDIO_SITE_URL', 'PUBLIC_SITE_URL') ?? 'http://localhost:4321';

/** Libellés sobres pour les modèles localisés quand une seule langue est active. */
const creationTitles: Record<string, string> = {
  project: 'Projet',
  post: 'Article',
  localizedSettings: 'Réglages du site',
  projectsPage: 'Page Expériences',
  laboPage: 'Page Labo',
  journalPage: 'Page Journal',
  shopPage: 'Page Shop',
};

export default defineConfig({
  name: 'studio-abime',
  title: 'Studio Abîme',

  projectId,
  dataset,

  schema: {
    types: schemaTypes,
    // Les types techniques ne doivent pas apparaître dans le menu « Créer ».
    templates: (templates) =>
      templates.filter(
        (template) => template.schemaType !== 'siteSettings' && template.schemaType !== 'maintenance',
      ),
  },

  plugins: [
    structureTool({ structure }),

    /**
     * PRESENTATION TOOL — édition en direct avec écran scindé.
     *
     * Le site est chargé dans un iframe à côté du formulaire : cliquer sur un
     * texte de la page ouvre le champ correspondant, et toute modification se
     * reflète immédiatement.
     *
     * Prérequis côté site (déjà en place) :
     *  - stega activé (`astro.config.ts`) → chaque chaîne rendue porte son origine ;
     *  - composant <VisualEditing /> monté dans le layout ;
     *  - routes en rendu à la demande quand PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true.
     */
    presentationTool({
      previewUrl: {
        origin: previewOrigin,
        preview: '/',
      },
      // Depuis un document, indique où il est visible sur le site.
      resolve: resolvePresentationLocations,
    }),

    /**
     * Multilingue au niveau document : chaque langue est un document distinct,
     * relié aux autres par un document `translation.metadata`.
     * La liste des langues vient de `src/i18n/config.ts` — source unique.
     */
    documentInternationalization({
      supportedLanguages,
      schemaTypes: [...TRANSLATED_DOCUMENT_TYPES],
      languageField: 'language',
      // Références fortes : supprimer une traduction sans la délier est bloqué.
      weakReferences: false,
      // Permet de publier toutes les langues d'un document en une action.
      bulkPublish: true,
    }),

    ...(isDev
      ? [visionTool({ defaultApiVersion: apiVersion, defaultDataset: dataset })]
      : []),
  ],

  /**
   * Les « Releases » regroupent des changements pour les publier ensemble à une
   * date donnée. Le site n'a pas de calendrier éditorial : on publie quand
   * c'est prêt. L'onglet est retiré plutôt que laissé inutilisé.
   */
  releases: { enabled: false },

  document: {
    /**
     * Le plugin i18n ajoute un modèle par langue (`project-fr`) en plus du
     * modèle natif (`project`). On masque le modèle natif, qui créerait un
     * document sans langue, ainsi que le modèle paramétré réservé au plugin.
     * En monolingue, « Français Projet » redevient simplement « Projet ».
     */
    newDocumentOptions: (prev) =>
      prev
        /*
          Les pages sont à emplacement figé : l'accueil et les trois pages
          légales, toutes ouvertes depuis leur entrée du back-office. Une page
          créée à la main n'aurait ni titre ni slug — donc aucune adresse, et
          aucun moyen d'être servie. On retire l'entrée du menu « Créer ».
        */
        .filter(({ templateId }) => templateId !== 'page' && !templateId.startsWith('page-'))
        .filter(
          ({ templateId }) =>
            templateId !== 'projectsPage' &&
            !templateId.startsWith('projectsPage-') &&
            templateId !== 'laboPage' &&
            !templateId.startsWith('laboPage-') &&
            templateId !== 'journalPage' &&
            !templateId.startsWith('journalPage-') &&
            templateId !== 'shopPage' &&
            !templateId.startsWith('shopPage-') &&
            templateId !== 'localizedSettings' &&
            !templateId.startsWith('localizedSettings-'),
        )
        .filter(
          ({ templateId }) =>
            !TRANSLATED_DOCUMENT_TYPES.some(
              (schemaType) => templateId === schemaType || templateId === `${schemaType}-parameterized`,
            ),
        )
        .map((item) => {
          if (supportedLanguages.length !== 1) return item;

          const schemaType = TRANSLATED_DOCUMENT_TYPES.find(
            (type) => item.templateId === `${type}-${baseLanguage}`,
          );

          return schemaType ? { ...item, title: creationTitles[schemaType] } : item;
        }),

    // Les singletons ne doivent pas être dupliqués ni supprimés par erreur.
    actions: (prev, { schemaType }) => {
      if (
        schemaType === 'siteSettings' ||
        schemaType === 'maintenance' ||
        schemaType === 'localizedSettings' ||
        schemaType === 'projectsPage' ||
        schemaType === 'laboPage' ||
        schemaType === 'journalPage' ||
        schemaType === 'shopPage'
      ) {
        return prev.filter(
          ({ action }) => action !== 'duplicate' && action !== 'delete' && action !== 'unpublish',
        );
      }

      // Projets et articles partagent la même règle : l'URL technique suit le
      // titre à chaque publication, jamais saisie à la main.
      if (schemaType === 'project' || schemaType === 'post') {
        const isPost = schemaType === 'post';

        return prev.map((originalAction) => {
          if (originalAction.action === 'publish') return SlugOnPublishAction;
          if (originalAction.action === 'duplicate') {
            return createSlugAwareDuplicateAction(
              originalAction as DuplicateDocumentActionComponent,
              isPost
                ? { label: 'Dupliquer l’article', fallbackTitle: 'Article sans titre' }
                : { label: 'Dupliquer le projet', fallbackTitle: 'Projet sans titre' },
            );
          }
          return originalAction;
        });
      }

      return prev;
    },
  },
});

export { baseLanguage };

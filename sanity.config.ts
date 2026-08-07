import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { documentInternationalization } from '@sanity/document-internationalization';

import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';
import { baseLanguage, supportedLanguages, TRANSLATED_DOCUMENT_TYPES } from './sanity/lib/i18n';
import { resolvePresentationLocations } from './sanity/lib/presentation';

/**
 * Configuration du Studio Sanity.
 *
 * Le Studio est embarqué dans Astro (route `/studio`, voir `astro.config.ts`),
 * ce qui garantit que le CMS et le site partagent la même origine — condition
 * la plus simple pour que l'édition visuelle fonctionne sans configuration CORS.
 */
const projectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? '';
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION ?? '2025-02-19';

/** Origine du site prévisualisé dans le Presentation Tool. */
const previewOrigin = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  name: 'studio-abime',
  title: 'Studio Abîme',
  basePath: '/studio',

  projectId,
  dataset,

  schema: {
    types: schemaTypes,
    // Les types techniques ne doivent pas apparaître dans le menu « Créer ».
    templates: (templates) => templates.filter((template) => template.schemaType !== 'siteSettings'),
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

    visionTool({ defaultApiVersion: apiVersion, defaultDataset: dataset }),
  ],

  document: {
    // Les singletons ne doivent pas être dupliqués ni supprimés par erreur.
    actions: (prev, { schemaType }) =>
      schemaType === 'siteSettings'
        ? prev.filter(({ action }) => action !== 'duplicate' && action !== 'delete' && action !== 'unpublish')
        : prev,
  },
});

export { baseLanguage };

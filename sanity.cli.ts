import { defineCliConfig } from 'sanity/cli';

/**
 * Configuration du CLI Sanity (`npx sanity <commande>`).
 * Le Studio étant embarqué dans Astro, on n'utilise le CLI que pour les
 * opérations de données : datasets, import/export, tokens, typegen.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.PUBLIC_SANITY_DATASET ?? 'production',
  },
  studioHost: 'studio-abime',
});

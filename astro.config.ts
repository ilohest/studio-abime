import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import vue from '@astrojs/vue';
import react from '@astrojs/react';
import node from '@astrojs/node';
import sanity from '@sanity/astro';
import tailwindcss from '@tailwindcss/vite';

import { locales, defaultLocale, prefixDefaultLocale } from './src/i18n/config';

const {
  PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET,
  PUBLIC_SANITY_API_VERSION,
  PUBLIC_SANITY_STUDIO_URL,
  PUBLIC_SANITY_VISUAL_EDITING_ENABLED,
  PUBLIC_SITE_URL,
} = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

const visualEditingEnabled = PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true';

export default defineConfig({
  site: PUBLIC_SITE_URL || 'https://studio-abime.com',
  trailingSlash: 'never',

  /**
   * Statique par défaut (performance maximale).
   * L'adaptateur Node permet de basculer certaines routes en rendu à la demande
   * (`export const prerender = false`) : c'est ce qui alimente le Presentation Tool
   * de Sanity, qui a besoin d'un rendu serveur frais pour l'édition en direct.
   */
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  /**
   * Routage i18n natif d'Astro.
   * Les valeurs viennent de `src/i18n/config.ts` : ajouter une langue là-bas
   * suffit à faire apparaître ses routes ici.
   */
  i18n: {
    locales: [...locales],
    defaultLocale,
    routing: {
      prefixDefaultLocale,
      redirectToDefaultLocale: false,
    },
  },

  integrations: [
    vue(),
    // React n'est utilisé QUE pour le Studio embarqué et l'overlay Visual Editing
    // (composants fournis par Sanity). L'UI publique reste Astro + Vue.
    react(),
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET || 'production',
      apiVersion: PUBLIC_SANITY_API_VERSION || '2025-02-19',
      // CDN désactivé en mode édition visuelle pour toujours servir la donnée fraîche.
      useCdn: !visualEditingEnabled,
      // Studio embarqué : http://localhost:4321/studio
      studioBasePath: '/studio',
      // Stega encode les identifiants Sanity dans les chaînes rendues :
      // c'est ce qui rend chaque texte cliquable dans le Presentation Tool.
      stega: {
        enabled: visualEditingEnabled,
        studioUrl: PUBLIC_SANITY_STUDIO_URL || '/studio',
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    format: 'directory',
  },
});

import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import vue from '@astrojs/vue';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
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

  redirects: {
    '/projets': '/experiences',
  },

  /**
   * Statique par défaut (performance maximale) : les pages partent en HTML sur le
   * CDN. L'adaptateur ne prend le relais que pour les routes explicitement en
   * rendu à la demande (`export const prerender = false`) — aujourd'hui
   * `/api/contact`, plus l'ensemble du site quand l'édition visuelle est active,
   * le Presentation Tool de Sanity ayant besoin d'un rendu serveur frais.
   *
   * En production, `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` vaut "false" : un seul
   * Worker est déployé (le formulaire de contact), tout le reste est servi comme
   * asset statique. Sur l'environnement de preview, le drapeau passe à "true" et
   * les pages basculent en rendu serveur le temps de l'édition.
   */
  output: 'static',
  /**
   * `imageService: 'compile'` — À NE PAS RETIRER.
   *
   * Par défaut, l'adaptateur route les images vers le binding Cloudflare Images,
   * c'est-à-dire une transformation **à chaque visite** : les pages émettent des
   * URLs `/_image?...` qui réveillent le Worker et consomment un produit facturé.
   * En `compile`, sharp optimise tout au build et les images partent comme des
   * assets statiques — servis gratuitement et sans limite de trafic.
   */
  adapter: cloudflare({ imageService: 'compile' }),

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
      /**
       * Pas de `studioBasePath` : le Studio n'est PAS embarqué dans le site.
       * Il est déployé à part sur https://studio.studio-abime.com (`npm run
       * studio:build`, voir README § Déploiement) et se lance en local avec
       * `npm run studio:dev` sur le port 3333.
       *
       * L'embarquer ferait transiter tout React et tout le bundle du Studio
       * par le déploiement du site public, et lierait chaque mise à jour du
       * back-office à un redéploiement du site.
       */
      // Stega encode les identifiants Sanity dans les chaînes rendues :
      // c'est ce qui rend chaque texte cliquable dans le Presentation Tool.
      stega: {
        enabled: visualEditingEnabled,
        studioUrl: PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333',
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],

    /**
     * Le composant d'édition visuelle de Sanity est un `.tsx` brut servi depuis
     * `node_modules` : le scanner de Vite ne le voit pas au démarrage. Sa chaîne de
     * dépendances (`@sanity/mutate` → `import isObject from 'lodash/isObject.js'`,
     * un module CJS importé en ESM) n'est donc découverte qu'à l'hydratation, ce qui
     * déclenche une re-optimisation en cours de route et invalide les modules déjà
     * chargés (504 « Outdated Optimize Dep »). On la pré-bundle explicitement.
     */
    optimizeDeps: {
      include: [
        '@sanity/visual-editing/react',
        '@sanity/mutate',
        'lodash/isObject.js',
        // GSAP n'est importé que dans des `<script>` de composants Astro : même
        // découverte tardive, même re-optimisation en cours de route.
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/SplitText',
      ],
      // NB : ne pas ajouter `sanity` ni ses sous-chemins ici — les forcer
      // casse sa carte d'exports (`sanity/structure` se retrouve vide).
    },
  },

  build: {
    format: 'directory',
  },
});

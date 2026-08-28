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
  MAINTENANCE_MODE,
} = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

const visualEditingEnabled = PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true';

/**
 * MODE MAINTENANCE — l'interrupteur, lu une fois, au build.
 *
 * Il vit dans le back-office (document `maintenance`) pour que la cliente
 * puisse fermer et rouvrir le site seule. On l'interroge ici, et pas à chaque
 * visite : les pages sont servies en HTML statique depuis le CDN, sans serveur
 * pour poser la question. Publier dans Sanity déclenche la reconstruction du
 * site (webhook → deploy hook, README § Déploiement) : c'est ce build-là qui
 * tire ou lève le rideau.
 *
 * La valeur décide de deux choses : le rendu des pages (statique, ou à la
 * demande pour que `src/middleware.ts` puisse vérifier un mot de passe) et
 * l'affichage de l'écran lui-même.
 *
 * `MAINTENANCE_MODE="on"|"off"` court-circuite le back-office. Deux usages :
 * travailler l'écran en local sans toucher au dataset, et rouvrir le site en
 * urgence si Sanity est injoignable.
 */
async function resolveMaintenanceFlag(): Promise<boolean> {
  const override = (MAINTENANCE_MODE ?? '').trim().toLowerCase();
  if (override === 'on' || override === 'true') return true;
  if (override === 'off' || override === 'false') return false;

  if (!PUBLIC_SANITY_PROJECT_ID) return false;

  const dataset = PUBLIC_SANITY_DATASET || 'production';
  const apiVersion = PUBLIC_SANITY_API_VERSION || '2025-02-19';
  const query = encodeURIComponent('*[_id == "maintenance"][0].enabled');

  /*
    `api` et non `apicdn` : une seule requête par build, mais elle doit voir
    l'état publié à la seconde près. Le CDN peut encore servir la réponse
    précédente au moment où le webhook déclenche la reconstruction — le site
    rouvrirait alors qu'on vient de le fermer.
  */
  const endpoint =
    `https://${PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v${apiVersion}` +
    `/data/query/${dataset}?query=${query}&perspective=published`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Sanity a répondu ${response.status}.`);
    const { result } = (await response.json()) as { result?: boolean };
    return result === true;
  } catch (error) {
    /*
      En production, on refuse de deviner : si l'interrupteur était allumé, un
      repli silencieux sur « ouvert » publierait le site que l'on voulait
      cacher. Faire échouer le build laisse en ligne le déploiement précédent —
      c'est-à-dire l'état voulu. Le contournement est explicite et documenté.
    */
    // `argv` plutôt que `NODE_ENV` : au moment où ce fichier est évalué, Vite
    // n'a pas encore posé `NODE_ENV=production` pour la commande `build`.
    if (process.argv.includes('build') || process.env.NODE_ENV === 'production') {
      throw new Error(
        `[maintenance] Impossible de lire l'interrupteur dans Sanity : ${(error as Error).message}\n` +
          `Le build s'arrête plutôt que de risquer de publier un site qui devait rester fermé.\n` +
          `Pour construire malgré tout, fixez explicitement MAINTENANCE_MODE="on" ou "off".`,
      );
    }

    console.warn(
      `[maintenance] Interrupteur illisible (${(error as Error).message}) — site considéré comme ouvert.`,
    );
    return false;
  }
}

const maintenanceEnabled = await resolveMaintenanceFlag();

/*
  L'interrupteur est posé dans l'environnement AVANT qu'Astro ne le lise : il
  devient alors un `import.meta.env.MAINTENANCE_ENABLED` ordinaire, disponible
  partout où le site s'exécute — dont `export const prerender`, évalué très tôt
  dans le build.
*/
process.env.MAINTENANCE_ENABLED = String(maintenanceEnabled);

if (maintenanceEnabled) {
  console.info('[maintenance] Rideau tiré : le site sera servi derrière l’écran de maintenance.');
}

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
  /*
    Deux situations font basculer le site entier en rendu à la demande :
    l'édition visuelle (le Presentation Tool a besoin d'un rendu frais) et le
    mode maintenance (un mot de passe ne se vérifie pas dans un fichier posé sur
    un CDN). Hors de ces deux cas, tout repart en HTML statique.

    La décision est prise ICI et nulle part ailleurs. Un `export const prerender`
    calculé dans une page ne ferait rien : Astro lit cet export sans l'évaluer,
    et n'y reconnaît qu'un littéral `true` ou `false` — une expression, même
    juste, est ignorée et la page suit la valeur par défaut du mode de sortie.
  */
  output: visualEditingEnabled || maintenanceEnabled ? 'server' : 'static',
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
      /*
        Toujours l'API directe, jamais le CDN — même raison qu'au-dessus pour
        l'interrupteur de maintenance : un build déclenché par une publication
        lirait sinon l'état d'avant celle-ci. Le vrai client du site est
        `src/lib/sanity/client.ts`, qui pose la même valeur ; celle-ci ne sert
        qu'à ne pas laisser traîner ici un réglage qui le contredirait.
      */
      useCdn: false,
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

import { defineCliConfig } from 'sanity/cli';

/**
 * Configuration du CLI Sanity (`npx sanity <commande>`).
 *
 * Le CLI sert à deux choses : les opérations de données (datasets, import/export,
 * tokens, typegen) et la construction du Studio autonome — `sanity dev` en local,
 * `sanity build` pour le déploiement sur studio.studioabime.com.
 *
 * `studioHost` ne concerne que `sanity deploy` (hébergement gratuit sur
 * studio-abime.sanity.studio). Il est conservé comme filet de secours : si le
 * déploiement du Studio sur le sous-domaine tombe, une commande suffit à
 * rouvrir le back-office ailleurs.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID,
    dataset:
      process.env.SANITY_STUDIO_DATASET ?? process.env.PUBLIC_SANITY_DATASET ?? 'production',
  },
  studioHost: 'studio-abime',

  /**
   * `publicDir` pointé sur `sanity/static` plutôt que sur le `public/` du site :
   * sans cela Vite recopie les fontes, textures et médias du site (~9 Mo) dans
   * le build du Studio, qui n'en utilise aucun.
   *
   * Ce dossier ne contient que `_redirects`, qui renvoie toutes les URLs vers
   * `index.html` : le Studio est une application à routage client, et rafraîchir
   * la page sur `/structure/...` demanderait sinon un fichier inexistant.
   */
  vite: (config) => ({ ...config, publicDir: 'sanity/static' }),
});

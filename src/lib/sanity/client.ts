import { createClient, type ClientPerspective } from '@sanity/client';
import { apiVersion, dataset, draftsEnabled, projectId, readToken, studioUrl, visualEditingEnabled } from './env';

/**
 * Client Sanity unique du projet.
 *
 * Deux modes, pilotés par l'environnement :
 *  - Production  → CDN activé, contenus publiés, pas de stega. Rendu 100 % statique.
 *  - Preview/dev → CDN désactivé, brouillons lus avec le token, stega activé pour
 *                  rendre chaque champ cliquable dans le Presentation Tool.
 */
const perspective: ClientPerspective = draftsEnabled ? 'drafts' : 'published';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: !visualEditingEnabled,
  perspective,
  // Le token n'est attaché que côté serveur, en mode preview.
  ...(draftsEnabled ? { token: readToken } : {}),
  stega: {
    enabled: visualEditingEnabled,
    studioUrl,
  },
});

export { projectId, dataset, apiVersion, studioUrl, visualEditingEnabled, draftsEnabled };

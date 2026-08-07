/**
 * Lecture centralisée et validée des variables d'environnement Sanity.
 * Un seul endroit à consulter (et à corriger) en cas de mauvaise configuration.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[sanity] Variable d'environnement manquante : ${name}.\n` +
        `Copiez .env.example vers .env et renseignez vos identifiants Sanity.`,
    );
  }
  return value;
}

export const projectId = required(import.meta.env.PUBLIC_SANITY_PROJECT_ID, 'PUBLIC_SANITY_PROJECT_ID');
export const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2025-02-19';
export const studioUrl = import.meta.env.PUBLIC_SANITY_STUDIO_URL || '/studio';

/** Mode édition visuelle : brouillons + stega + rendu à la demande. */
export const visualEditingEnabled = import.meta.env.PUBLIC_SANITY_VISUAL_EDITING_ENABLED === 'true';

/** Token serveur (jamais exposé au client). Requis pour lire les brouillons. */
export const readToken = import.meta.env.SANITY_API_READ_TOKEN ?? '';

/**
 * `true` quand on peut réellement afficher les brouillons.
 * Sans token, on reste en lecture publiée même si l'édition visuelle est activée.
 */
export const draftsEnabled = visualEditingEnabled && Boolean(readToken);

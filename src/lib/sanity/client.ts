import { createClient, type ClientPerspective } from '@sanity/client';
import { apiVersion, dataset, draftsEnabled, projectId, readToken, studioUrl, visualEditingEnabled } from './env';

/**
 * Client Sanity unique du projet.
 *
 * Deux modes, pilotés par l'environnement :
 *  - Production  → contenus publiés, pas de stega. Rendu 100 % statique.
 *  - Preview/dev → brouillons lus avec le token, stega activé pour rendre
 *                  chaque champ cliquable dans le Presentation Tool.
 */
const perspective: ClientPerspective = draftsEnabled ? 'drafts' : 'published';

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,

  /**
   * `useCdn: false` — API directe, et non le CDN de Sanity.
   *
   * Le CDN est fait pour un site qui interroge le CMS à chaque visite : il rend
   * la même réponse mille fois pour le prix d'une. Ce site ne fonctionne pas
   * ainsi. Les pages sont pré-rendues et servies en HTML statique ; chaque
   * requête n'est donc jouée QU'UNE FOIS, pendant le build. Un cache de lecture
   * n'a rien à y mutualiser — son bénéfice est nul par construction.
   *
   * Son coût, lui, est réel, et c'est un piège en boucle fermée. Publier dans le
   * Studio déclenche le webhook de reconstruction (README § Déploiement) : le
   * build démarre dans la seconde qui suit la publication, au moment précis où
   * le CDN sert encore la réponse d'avant. Le site se reconstruit alors à
   * l'identique. La cliente publie, attend les deux minutes annoncées, ne voit
   * rien changer — et n'a aucun moyen de comprendre pourquoi.
   *
   * Le cas s'est produit ici même, sur les pages légales : un build lancé juste
   * après l'écriture les a reconstruites dans leur état précédent, le suivant
   * les a rendues correctement.
   *
   * `astro.config.ts` avait déjà tranché dans ce sens pour l'interrupteur de
   * maintenance, et pour la même raison. C'est la même règle, appliquée partout.
   *
   * Le surcoût se compte en dizaines de requêtes par build — quelques-unes par
   * langue, les réglages étant mémoïsés (voir `siteContext.ts`) — contre une
   * publication qui n'aurait aucun effet visible.
   */
  useCdn: false,
  perspective,
  // Le token n'est attaché que côté serveur, en mode preview.
  ...(draftsEnabled ? { token: readToken } : {}),
  stega: {
    enabled: visualEditingEnabled,
    studioUrl,
  },
});

export { projectId, dataset, apiVersion, studioUrl, visualEditingEnabled, draftsEnabled };

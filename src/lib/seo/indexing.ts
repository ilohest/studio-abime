import { visualEditingEnabled } from '~/lib/sanity/env';

/**
 * Le site en cours de rendu a-t-il vocation à être indexé ?
 *
 * `PUBLIC_SANITY_VISUAL_EDITING_ENABLED` distingue déjà l'environnement de
 * preview de la production (voir README § Variables d'environnement) : « true »
 * en local et sur la preview, « false » en production. On s'en sert ici comme
 * garde-fou d'indexation.
 *
 * Sans ce garde-fou, le domaine de preview finirait tôt ou tard dans l'index :
 * il sert exactement le même contenu que la production, et Google traiterait
 * les deux comme des doublons — au risque de retenir la mauvaise version comme
 * canonique. Un site aspiré par sa propre copie de préproduction est l'un des
 * accidents de référencement les plus courants, et l'un des plus longs à
 * rattraper.
 */
export const indexingAllowed = !visualEditingEnabled;

/**
 * Directives `robots` d'une page indexable.
 *
 * Les trois `max-*` sont ce qui autorise Google à afficher une grande vignette
 * plutôt qu'une miniature, un extrait complet plutôt qu'une phrase tronquée, et
 * un aperçu vidéo sans limite de durée. Pour un studio dont le travail est
 * d'abord visuel, `max-image-preview:large` est la directive la plus rentable
 * de tout le fichier : elle change la taille de l'image affichée à côté de
 * chaque résultat.
 */
export const INDEXABLE_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

export const NOINDEX_ROBOTS = 'noindex, follow';

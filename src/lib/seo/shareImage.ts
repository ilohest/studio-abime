import type { ImageInput } from './jsonLd';
import { fromSanityImage } from './jsonLd';
import type { SanityImage } from '~/lib/sanity/types';

/**
 * Choisit l'image qui représente une page — vignette de partage, `og:image` et
 * `primaryImageOfPage` des données structurées.
 *
 * La cascade est volontairement dans cet ordre :
 *
 *  1. l'image SEO du document, quand un éditeur en a choisi une exprès ;
 *  2. l'image du document lui-même (vignette de projet, couverture d'article,
 *     premier visuel d'un tirage) — c'est elle qui rend un lien partagé
 *     reconnaissable, là où l'image générique du site ne montre rien de la page ;
 *  3. l'image sociale par défaut des réglages, en dernier recours.
 *
 * Sans le deuxième étage, chaque projet partagé sur un réseau social afficherait
 * la même vignette que l'accueil : le lien perdrait l'essentiel de ce qui donne
 * envie de le suivre.
 */
export function resolveShareImage(
  sources: {
    seo?: SanityImage | null;
    document?: SanityImage | null;
    /** Visuel déjà résolu venant d'ailleurs que Sanity (catalogue Shopify). */
    external?: ImageInput | null;
    siteDefault?: SanityImage | null;
  },
  origin: string,
): ImageInput | null {
  /*
    Recadrage paysage systématique. Les visuels du studio sont majoritairement
    en portrait ; laissés tels quels, ils sont rognés par le haut et par le bas
    au moment du partage — LinkedIn, Facebook et X composent tous leur aperçu
    dans un cadre large. Choisir le recadrage ici, c'est décider de ce qui reste
    visible plutôt que de le laisser à trois algorithmes différents.
  */
  const options = { ratio: 'landscape' } as const;

  return (
    fromSanityImage(sources.seo, origin, options) ??
    fromSanityImage(sources.document, origin, options) ??
    sources.external ??
    fromSanityImage(sources.siteDefault, origin, options)
  );
}

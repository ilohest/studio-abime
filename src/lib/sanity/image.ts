import { createImageUrlBuilder, type ImageUrlBuilder } from '@sanity/image-url';
import type { SanityImage } from './types';
import { dataset, projectId } from './env';

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImage): ImageUrlBuilder {
  return builder.image(source);
}

/** Ratios de recadrage du design system. Étendre ici plutôt qu'au cas par cas. */
export const ASPECT_RATIOS = {
  square: 1,
  portrait: 3 / 4,
  landscape: 16 / 9,
  cinema: 21 / 9,
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

/** Largeurs générées pour le `srcset` — alignées sur les breakpoints Tailwind. */
const DEFAULT_WIDTHS = [400, 640, 768, 1024, 1280, 1536, 1920] as const;

export interface ResolvedImage {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  /** Placeholder LQIP en base64 fourni par Sanity, pour un chargement progressif. */
  lqip?: string;
}

/**
 * Prépare une image Sanity pour le rendu : URL optimisée, srcset responsive,
 * dimensions explicites (pas de CLS) et texte alternatif.
 */
export function resolveImage(
  source: SanityImage | undefined | null,
  options: { width?: number; ratio?: AspectRatio; quality?: number } = {},
): ResolvedImage | null {
  if (!source?.asset) return null;

  const { width = 1280, ratio, quality = 82 } = options;
  const height = ratio ? Math.round(width / ASPECT_RATIOS[ratio]) : undefined;

  const base = (w: number) => {
    let url = urlFor(source).width(w).quality(quality).auto('format').fit('max');
    if (ratio) url = url.height(Math.round(w / ASPECT_RATIOS[ratio])).fit('crop');
    if (source.hotspot) url = url.crop('focalpoint');
    return url.url();
  };

  /*
    Sans recadrage demandé, l'image garde ses proportions d'origine : la hauteur
    se déduit donc du ratio réel de l'asset, fourni par Sanity. Retomber sur un
    ratio arbitraire donnerait des attributs `width`/`height` faux à toute image
    non recadrée — et donc une réservation d'espace erronée avant chargement.
  */
  const naturalRatio = source.asset.metadata?.dimensions?.aspectRatio;

  /*
    Le LQIP est peint EN FOND de l'image, sous elle. Le procédé ne vaut que pour
    une image OPAQUE, qui finira par le recouvrir entièrement : sous une image
    détourée, il reste visible à travers la transparence, et un spécimen posé
    sur le papier se retrouve cerné d'un rectangle flou et coloré.

    Sanity sait si l'asset porte de la transparence — on le lui demande plutôt
    que de le deviner à l'extension du fichier, un PNG étant le plus souvent
    opaque. Métadonnée absente (contenu antérieur à cette projection) : on
    suppose l'image opaque, c'est le cas de l'écrasante majorité.
  */
  const opaque = source.asset.metadata?.isOpaque ?? true;

  return {
    src: base(width),
    srcset: DEFAULT_WIDTHS.filter((w) => w <= width * 2)
      .map((w) => `${base(w)} ${w}w`)
      .join(', '),
    width,
    height: height ?? Math.round(width / (naturalRatio || ASPECT_RATIOS.landscape)),
    alt: source.alt ?? '',
    lqip: opaque ? source.asset.metadata?.lqip : undefined,
  };
}

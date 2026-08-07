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

  return {
    src: base(width),
    srcset: DEFAULT_WIDTHS.filter((w) => w <= width * 2)
      .map((w) => `${base(w)} ${w}w`)
      .join(', '),
    width,
    height: height ?? Math.round(width / ASPECT_RATIOS.landscape),
    alt: source.alt ?? '',
    lqip: source.asset.metadata?.lqip,
  };
}

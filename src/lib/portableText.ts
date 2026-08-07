import { toHTML, type PortableTextHtmlComponents } from '@portabletext/to-html';
import { resolveImage } from './sanity/image';
import { resolveLink } from './routing';
import type { PortableTextBlock, SanityImage, SanityLink } from './sanity/types';
import type { Locale } from '~/i18n/config';

/**
 * Rendu du Portable Text en HTML.
 *
 * Les styles ne sont PAS appliqués ici : le HTML produit reste sémantique et
 * c'est `.prose-abime` (src/styles/global.css) qui porte la typographie. On peut
 * ainsi faire évoluer le design system sans toucher à la logique de rendu.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function components(locale: Locale): Partial<PortableTextHtmlComponents> {
  return {
    types: {
      inlineImage: ({ value }) => {
        const image = value as SanityImage & { caption?: string };
        const resolved = resolveImage(image, { width: 1280 });
        if (!resolved) return '';

        const img = `<img src="${escapeHtml(resolved.src)}" srcset="${escapeHtml(resolved.srcset)}" sizes="100vw" width="${resolved.width}" height="${resolved.height}" alt="${escapeHtml(resolved.alt)}" loading="lazy" decoding="async" />`;

        return image.caption
          ? `<figure>${img}<figcaption>${escapeHtml(image.caption)}</figcaption></figure>`
          : `<figure>${img}</figure>`;
      },
    },
    marks: {
      linkMark: ({ value, text }) => {
        const resolved = resolveLink(value as SanityLink, locale);
        if (!resolved) return text;
        const attrs = resolved.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(resolved.href)}"${attrs}>${text}</a>`;
      },
    },
  };
}

export function renderPortableText(
  blocks: PortableTextBlock[] | undefined | null,
  locale: Locale,
): string {
  if (!blocks?.length) return '';
  return toHTML(blocks, { components: components(locale) });
}

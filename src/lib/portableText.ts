import { toHTML, type PortableTextHtmlComponents } from '@portabletext/to-html';
import { resolveImage } from './sanity/image';
import { resolveLink } from './routing';
import { figureLabel } from './figureLabel';
import {
  identityHref,
  identityPlaceholder,
  isIdentityFieldKey,
  resolveIdentityValue,
  type IdentityContext,
} from './organizationIdentity';
import type { PortableTextBlock, SanityImage, SanityLink } from './sanity/types';
import { getLocaleMeta, type Locale } from '~/i18n/config';

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

function components(
  locale: Locale,
  identity: Omit<IdentityContext, 'dateLocale'> | undefined,
): Partial<PortableTextHtmlComponents> {
  return {
    types: {
      /**
       * Renvoi vers la fiche d'entreprise (voir `organizationIdentity.ts`).
       *
       * Trois issues, et aucune n'est le silence :
       *  · la valeur existe        → elle s'affiche ;
       *  · le champ est vide       → « [À COMPLÉTER : … ] », en clair ;
       *  · la clé est inconnue     → idem, car un schéma déployé avant le rendu
       *    laisserait sinon un blanc que personne ne verrait passer.
       *
       * Le `<span>` porte une classe : une mention à compléter doit sauter aux
       * yeux sur la page (voir `.identity-value--missing` dans global.css).
       */
      identityValue: ({ value }) => {
        const key = (value as { field?: unknown })?.field;

        if (!isIdentityFieldKey(key)) {
          return `<span class="identity-value identity-value--missing">[À COMPLÉTER : information inconnue]</span>`;
        }

        const resolved = identity
          ? resolveIdentityValue(key, {
              ...identity,
              dateLocale: getLocaleMeta(locale).htmlLang,
            })
          : undefined;

        if (!resolved) {
          return `<span class="identity-value identity-value--missing">${escapeHtml(identityPlaceholder(key))}</span>`;
        }

        /*
          Une adresse e-mail devient cliquable : le texte qui l'entoure invite à
          écrire, autant que la main suive. Un trou, lui, ne devient jamais un
          lien — `mailto:[À COMPLÉTER…]` ouvrirait le client de messagerie sur
          un destinataire absurde.
        */
        const href = identityHref(key, resolved);
        const label = escapeHtml(resolved);

        return href
          ? `<a class="identity-value" href="${escapeHtml(href)}">${label}</a>`
          : `<span class="identity-value">${label}</span>`;
      },

      inlineImage: ({ value }) => {
        const image = value as SanityImage & { caption?: string };
        const resolved = resolveImage(image, { width: 1280 });
        if (!resolved) return '';

        const img = `<img src="${escapeHtml(resolved.src)}" srcset="${escapeHtml(resolved.srcset)}" sizes="100vw" width="${resolved.width}" height="${resolved.height}" alt="${escapeHtml(resolved.alt)}" loading="lazy" decoding="async" />`;

        if (!image.caption) return `<figure>${img}</figure>`;

        const label = figureLabel(image.caption);
        const prefix = label.reference
          ? `<span class="figure-caption__prefix"><span class="figure-caption__reference">${escapeHtml(label.reference)}</span>${label.text ? '<span class="figure-caption__separator"> - </span>' : ''}</span>`
          : '';
        const text = label.text
          ? `<span class="figure-caption__text">${escapeHtml(label.text)}</span>`
          : '';

        return `<figure>${img}<figcaption class="figure-caption">${prefix}${text}</figcaption></figure>`;
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

/**
 * @param identity Fiche d'entreprise et date de révision du document, pour
 *   résoudre les renvois `identityValue`. Omise, les renvois affichent leur
 *   « [À COMPLÉTER : … ] » — jamais du vide.
 */
export function renderPortableText(
  blocks: PortableTextBlock[] | undefined | null,
  locale: Locale,
  identity?: Omit<IdentityContext, 'dateLocale'>,
): string {
  if (!blocks?.length) return '';
  return toHTML(blocks, { components: components(locale, identity) });
}

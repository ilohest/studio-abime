import type { APIRoute } from 'astro';

import { isLocale, type Locale } from '~/i18n/config';
import { postPath, projectPath } from '~/i18n/routes';
import { buildRouteManifest } from '~/lib/routing';
import { indexingAllowed } from '~/lib/seo/indexing';
import { resolveImage } from '~/lib/sanity/image';
import { loadQuery } from '~/lib/sanity/loadQuery';
import { sitemapImagesQuery } from '~/lib/sanity/queries';
import type { SanityImage } from '~/lib/sanity/types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SITEMAP
 * ═══════════════════════════════════════════════════════════════════════════
 * Écrit à la main plutôt que délégué à `@astrojs/sitemap`, pour trois raisons
 * qui tiennent toutes à la façon dont ce site est construit :
 *
 *  1. `buildRouteManifest()` connaît déjà l'intégralité des URLs — Sanity ET
 *     Shopify. L'intégration officielle, elle, ne voit que les routes émises
 *     par Astro : en mode édition visuelle, où tout bascule en rendu à la
 *     demande, elle produirait un sitemap vide.
 *  2. Le manifeste porte la date de dernière révision de chaque document. C'est
 *     ce `lastmod` qui dit à Google quoi revisiter — un sitemap sans dates ne
 *     lui apprend rien qu'un crawl ne trouverait seul.
 *  3. Les pages exclues de l'index (confirmation de commande) doivent l'être
 *     ici aussi : un sitemap qui liste une page en `noindex` envoie deux
 *     instructions contradictoires, et c'est signalé comme une erreur dans la
 *     Search Console.
 *
 * Volontairement absents : `<priority>` et `<changefreq>`. Google a annoncé
 * publiquement les ignorer. Les inclure ne fait qu'alourdir le fichier et
 * laisser croire à un pilotage qui n'existe pas.
 *
 * Volontairement absents aussi : les `<xhtml:link hreflang>`. L'information
 * existe déjà dans le `<head>` de chaque page (voir `BaseLayout.astro`), et
 * Google demande l'une OU l'autre forme — pas les deux.
 */
export const prerender = true;

interface SitemapImageRow {
  _type: 'project' | 'post';
  slug: string;
  language: string;
  image: SanityImage | null;
}

/** Échappe les cinq caractères réservés du XML. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Date au format `YYYY-MM-DD` attendu par le protocole sitemap. */
function toSitemapDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return undefined;
  return new Date(time).toISOString().slice(0, 10);
}

/** Chemin d'un document, selon son type — même règle que le manifeste de routes. */
function documentPath(row: SitemapImageRow, locale: Locale): string {
  return row._type === 'project'
    ? projectPath(locale, row.slug)
    : postPath(locale, row.slug);
}

export const GET: APIRoute = async ({ site, url }) => {
  const origin = (site ?? new URL(url.origin)).origin;

  /*
    Le sitemap est un fichier pré-rendu : il est servi par le CDN sans passer
    par le portier de maintenance. Publier la carte complète des URLs d'un site
    que l'on vient de fermer reviendrait à en donner le plan par la fenêtre. On
    le vide tant que l'indexation est fermée (`src/lib/seo/indexing.ts`).
  */
  if (!indexingAllowed) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" />\n',
      { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
    );
  }

  const [routes, imageRows] = await Promise.all([
    buildRouteManifest(),
    loadQuery<SitemapImageRow[]>({ query: sitemapImagesQuery, fallback: [] }),
  ]);

  /*
    Visuel représentatif par URL. La table est indexée par chemin : le sitemap
    n'a alors qu'à demander « une image pour cette URL ? » sans rien savoir du
    type de document qui se trouve derrière.
  */
  const imageByPath = new Map<string, string>();
  for (const row of imageRows) {
    if (!row?.image || !isLocale(row.language)) continue;
    const resolved = resolveImage(row.image, { width: 1600 });
    if (!resolved) continue;
    imageByPath.set(documentPath(row, row.language), new URL(resolved.src, origin).toString());
  }

  const entries = routes
    // La page de confirmation n'est atteinte que par redirection depuis le
    // paiement : elle est en `noindex`, elle n'a donc rien à faire ici.
    .filter((route) => route.kind !== 'orderConfirmation')
    .map((route) => ({
      loc: new URL(route.path, origin).toString(),
      lastmod: toSitemapDate(route.lastmod),
      image: imageByPath.get(route.path),
    }))
    // Une même URL ne doit apparaître qu'une fois, quelle que soit la source
    // qui l'a produite.
    .filter(
      (entry, index, all) => all.findIndex((candidate) => candidate.loc === entry.loc) === index,
    )
    .sort((a, b) => a.loc.localeCompare(b.loc));

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}${
      entry.image
        ? `\n    <image:image>\n      <image:loc>${escapeXml(entry.image)}</image:loc>\n    </image:image>`
        : ''
    }
  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

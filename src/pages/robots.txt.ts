import type { APIRoute } from 'astro';

import { locales } from '~/i18n/config';
import { orderConfirmationPath } from '~/i18n/routes';
import { indexingAllowed } from '~/lib/seo/indexing';

/**
 * `robots.txt` — généré, et non posé en fichier statique dans `public/`.
 *
 * Un fichier statique porterait une URL de sitemap en dur, valable pour un seul
 * domaine. Généré, il suit l'origine réellement servie : la preview annonce sa
 * preview, la production annonce la production, sans variante à maintenir.
 *
 * Surtout, il se ferme entièrement hors production — et pendant que le site est
 * masqué par le mode maintenance, pour la même raison : ce qu'un robot ne doit
 * pas retenir, il vaut mieux qu'il ne le demande pas. Un domaine de preview
 * ouvert aux robots sert exactement le même contenu que le site public : Google
 * y verrait un duplicata intégral, et rien ne garantit qu'il retiendrait la
 * bonne version comme canonique. Le même verrou existe côté balise `robots`
 * (voir `src/lib/seo/indexing.ts`) — deux barrières valent mieux qu'une, celle-ci
 * arrêtant le robot avant même qu'il ne demande une page.
 */
export const prerender = true;

export const GET: APIRoute = ({ site, url }) => {
  const origin = (site ?? new URL(url.origin)).origin;

  if (!indexingAllowed) {
    return respond(
      [
        '# Hors index, volontairement : préproduction ou site en maintenance.',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n'),
    );
  }

  /*
    Le segment de confirmation est traduit par langue : on le demande au
    routage plutôt que de l'écrire en dur, sinon l'ajout d'une langue laisserait
    sa page de remerciement ouverte aux robots.
  */
  const confirmationPaths = locales.map((locale) => orderConfirmationPath(locale));

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    "# La confirmation de commande n'a rien à indexer : on ne l'atteint que",
    '# depuis une transaction qui vient de se conclure.',
    ...confirmationPaths.map((path) => `Disallow: ${path}`),
    '',
    "# Le formulaire de contact est une API, pas une page.",
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  return respond(body);
};

function respond(body: string): Response {
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

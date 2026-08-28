import { defineMiddleware } from 'astro:middleware';

import {
  MAINTENANCE_COOKIE,
  MAINTENANCE_COOKIE_MAX_AGE,
  MAINTENANCE_ERROR_PARAM,
  MAINTENANCE_PATH,
  accessToken,
  maintenanceEnabled,
  passwordMatches,
  safeNextPath,
} from '~/lib/maintenance';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LE RIDEAU
 * ═══════════════════════════════════════════════════════════════════════════
 * Seul portier du site. Il ne s'interpose que lorsque le mode maintenance est
 * allumé dans Sanity ; sinon il laisse passer sans rien lire ni rien décider —
 * et, le mode étant une constante résolue au build, il disparaît purement et
 * simplement du bundle.
 *
 * Il s'exécute AVANT le rendu d'une page : c'est ce qui permet de refuser une
 * URL sans jamais construire la page qu'elle désigne. Rien du site fermé n'est
 * donc envoyé au navigateur — pas même en commentaire dans le HTML.
 */
/** Les seules adresses qui restent servies pendant la fermeture. */
const OUVERT_AUX_ROBOTS = new Set(['/robots.txt', '/sitemap.xml']);

export const onRequest = defineMiddleware(async (context, next) => {
  if (!maintenanceEnabled) return next();

  /*
    Le middleware tourne aussi PENDANT le build, pour les pages pré-rendues
    (`robots.txt`, `sitemap.xml`). Les intercepter écrirait l'écran de
    maintenance dans ces fichiers, qui resteraient figés dessus après la
    réouverture du site. On ne garde que les requêtes réelles.

    `DEV` est exclu du test : le serveur de développement ne pré-rend rien, mais
    annonce malgré tout `isPrerendered: true` — sans cette réserve, le rideau
    serait impossible à voir en local, là précisément où on le met au point.
  */
  if (!import.meta.env.DEV && context.isPrerendered) return next();

  /*
    Deux fichiers restent ouverts, parce que leur rôle est justement de parler
    aux robots pendant que le site se tait : `robots.txt` leur demande de ne
    rien indexer, `sitemap.xml` ne leur propose plus aucune adresse (voir
    `src/lib/seo/indexing.ts`). Les cacher derrière le mot de passe reviendrait
    à laisser les moteurs deviner.
  */
  if (OUVERT_AUX_ROBOTS.has(context.url.pathname)) return next();

  const expected = await accessToken();

  if (context.cookies.get(MAINTENANCE_COOKIE)?.value === expected) return next();

  /* ── Tentative de déverrouillage ────────────────────────────────────────── */
  if (context.request.method === 'POST') {
    const candidate = await readPassword(context.request);
    const destination = safeNextPath(candidate.next ?? context.url.pathname);

    if (await passwordMatches(candidate.password)) {
      context.cookies.set(MAINTENANCE_COOKIE, expected, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: context.url.protocol === 'https:',
        maxAge: MAINTENANCE_COOKIE_MAX_AGE,
      });

      // 303 : la réponse à un POST se consulte en GET. Sans lui, un rechargement
      // de page reposterait le mot de passe.
      return context.redirect(destination, 303);
    }

    /*
      Échec : on repart en GET sur l'adresse demandée, marquée d'un paramètre.
      Le rideau se réaffiche à la bonne URL, sans que le navigateur garde un
      formulaire à renvoyer.
    */
    const retry = new URL(destination, context.url.origin);
    retry.searchParams.set(MAINTENANCE_ERROR_PARAM, 'refuse');
    return context.redirect(retry.pathname + retry.search, 303);
  }

  /*
    Réécriture, et non redirection : l'adresse demandée reste dans la barre du
    navigateur, et c'est vers elle que le déverrouillage renverra. L'écran ne
    lit donc pas l'URL — une réécriture peut la réécrire aussi — mais ce que le
    portier lui passe de la main à la main.
  */
  context.locals.maintenance = {
    next: safeNextPath(context.url.pathname),
    refused: context.url.searchParams.get(MAINTENANCE_ERROR_PARAM) === 'refuse',
  };

  return next(MAINTENANCE_PATH);
});

/** Lecture tolérante du formulaire : un corps illisible n'est qu'un mot de passe vide. */
async function readPassword(request: Request): Promise<{ password: string; next?: string }> {
  try {
    const form = await request.formData();
    return {
      password: String(form.get('password') ?? ''),
      next: typeof form.get('next') === 'string' ? String(form.get('next')) : undefined,
    };
  } catch {
    return { password: '' };
  }
}

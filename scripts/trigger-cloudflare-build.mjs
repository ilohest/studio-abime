import { appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function triggerBuild({ hook, worker, secretName, fetcher = fetch }) {
  if (!hook?.trim()) throw new Error(`Ajoutez le repository secret ${secretName} dans GitHub Actions.`);
  let url;
  try { url = new URL(hook.trim()); } catch { throw new Error(`${secretName} ne contient pas une URL valide.`); }
  if (url.origin !== 'https://api.cloudflare.com' || url.username || url.password || url.search || url.hash ||
      !/^\/client\/v4\/workers\/builds\/deploy_hooks\/[a-zA-Z0-9-]+$/.test(url.pathname)) {
    throw new Error(`${secretName} doit contenir une URL officielle de deploy hook Workers Cloudflare.`);
  }
  let response;
  try {
    response = await fetcher(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000) });
  } catch { throw new Error('Cloudflare est injoignable ou le hook redirige. Vérifiez le hook et relancez le workflow.'); }
  if (!response.ok) throw new Error(`Cloudflare a refusé le lancement (HTTP ${response.status}). Vérifiez le hook.`);
  let body;
  try { body = await response.json(); } catch { throw new Error('Cloudflare a renvoyé une réponse illisible.'); }
  const result = body.result;
  if (body.success !== true || !/^[a-zA-Z0-9-]+$/.test(result?.build_uuid ?? '')) {
    throw new Error('Cloudflare n’a pas confirmé le lancement du build.');
  }
  if ((result.worker && result.worker !== worker) || (result.branch && result.branch !== 'main')) {
    throw new Error(`Le hook doit cibler ${worker} sur main. Corrigez ${secretName}.`);
  }
  return { id: result.build_uuid, existing: result.already_exists === true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const worker = process.env.EXPECTED_WORKER;
    const build = await triggerBuild({ hook: process.env.DEPLOY_HOOK_URL, worker,
      secretName: process.env.DEPLOY_HOOK_SECRET_NAME });
    console.log(`Cloudflare : build ${build.existing ? 'déjà en attente' : 'lancé'} (${build.id}).`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `### ${worker}\n\nBuild Cloudflare : \`${build.id}\`.\n\n` +
      'Le hook construit le dernier état de **main** au moment du lancement.\n\n' +
      '**Ce succès confirme le lancement, pas la fin du build ni le déploiement.** ' +
      'Vérifiez le résultat dans Cloudflare → Workers & Pages → ce projet → Deployments → Go to build history.\n');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

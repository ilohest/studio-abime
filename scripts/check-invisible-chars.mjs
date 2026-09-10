/**
 * Vérifie qu'aucun caractère invisible n'est parti dans le site construit.
 *
 *   npm run check:invisible            → inspecte `dist/`, n'écrit rien
 *   npm run check:invisible -- --fix   → retire le stega des fichiers construits
 *   npm run check:invisible -- dist-studio
 *
 * Sort en code 1 si quelque chose a été trouvé (sauf après un `--fix` réussi) :
 * le script est fait pour être branché dans une CI, ou lancé juste avant un
 * déploiement à la main.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL CHERCHE, ET POURQUOI CE N'EST PAS UN PROBLÈME DE CONTENU
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le dataset Sanity est propre. Les caractères invisibles n'y sont pas écrits :
 * ils sont AJOUTÉS À LA LECTURE, par le stega de `@sanity/client`. Chaque
 * chaîne renvoyée se voit suffixer une adresse encodée en caractères de largeur
 * nulle — c'est ce qui rend un texte cliquable dans le Presentation Tool, et
 * c'est parfaitement voulu en édition visuelle.
 *
 * Ce n'est voulu QUE là. Dans une page publiée, cette traîne :
 *   - alourdit le HTML — mesuré sur ce site : 5641 ko → 2232 ko une fois retiré,
 *     soit 60 % du poids des pages en caractères que personne ne voit ;
 *   - traverse le `<title>` et les métadonnées sociales ;
 *   - emporte l'URL du Studio — `http://localhost:3333` dans un build local ;
 *   - se lit à voix haute chez certains lecteurs d'écran.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMENT ÇA PASSE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'interrupteur est `PUBLIC_SANITY_VISUAL_EDITING_ENABLED`. Il est lu à DEUX
 * endroits, par deux mécanismes différents :
 *
 *   - `astro.config.ts` le lit via `loadEnv()` de Vite — il décide
 *     `output: 'server'` ou `'static'` ;
 *   - `src/lib/sanity/env.ts` le lit dans `import.meta.env` — il décide `stega`.
 *
 * Tant que les deux lectures s'accordent, tout va bien : en édition visuelle le
 * site part en rendu serveur AVEC le stega, en production il part en statique
 * SANS. Le piège est qu'elles ne s'accordent pas toujours — et la raison est
 * une asymétrie d'arbitrage, mesurée ici plutôt que supposée.
 *
 * Quand une CLÉ EST DÉFINIE DES DEUX CÔTÉS, `.env` et `process.env` :
 *
 *   - `loadEnv()`      → `process.env` gagne   (donc `astro.config.ts`)
 *   - `import.meta.env` → le `.env` gagne      (donc `src/lib/sanity/env.ts`)
 *
 * Ce n'est pas que `process.env` n'atteindrait pas `import.meta.env` : une clé
 * ABSENTE du `.env` y arrive très bien (vérifié avec une variable sonde). C'est
 * le conflit, et lui seul, qui se tranche dans deux sens opposés.
 *
 * D'où le résultat, à chaque fois avec `.env` resté à "true" :
 *
 *   PUBLIC_SANITY_VISUAL_EDITING_ENABLED=false npx astro build   → pollué
 *   echo ... > .env.production && npx astro build                → pollué
 *   `.env` lui-même passé à "false", puis npx astro build         → propre
 *
 * Dans les deux premiers cas, `astro.config.ts` lit "false" et bascule bien le
 * site en statique, pendant que le client Sanity lit "true" et encode. Le site
 * part alors en statique AVEC sa traîne, et personne ne voit rien : les
 * caractères sont invisibles, c'est leur métier.
 *
 * En CI le cas ne se pose pas : `.env` est ignoré par git, il n'y a donc aucun
 * conflit à arbitrer et la variable de l'environnement de build est seule à
 * parler. Le danger est le build lancé depuis un poste de travail — `npm run
 * preview`, un `wrangler deploy` à la main — c'est-à-dire précisément le geste
 * qu'on fait dans l'urgence.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `--fix` EST UNE SOUPAPE, PAS LE CORRECTIF
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le vrai correctif tient en une ligne : `PUBLIC_SANITY_VISUAL_EDITING_ENABLED`
 * à "false" dans le `.env` du build, puis reconstruire. `--fix` sert quand on
 * tient un build qu'on ne peut pas refaire tout de suite.
 *
 * Le nettoyage passe par `stegaClean`, pas par un remplacement de caractères :
 * il ne retire que des séquences stega VALIDES et décodables. Une espace de
 * largeur nulle posée à la main dans un texte survit donc — et surtout, un
 * emoji composé (👩‍💻, dont le liant EST un U+200D) reste intact. Un
 * `replace()` sur la liste des points de code, lui, le casserait en deux.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { stegaClean } from '@sanity/client/stega';

/*
  `@vercel/stega` n'est pas une dépendance déclarée du projet : il arrive dans
  les bagages de `@sanity/client`. On ne l'exige donc pas — il ne sert qu'au
  confort du diagnostic (décoder UNE traîne pour nommer le Studio d'origine).
  S'il n'est pas là, le rapport perd une ligne et rien d'autre.
*/
const vercelStegaDecode = await import('@vercel/stega')
  .then((module) => module.vercelStegaDecode)
  .catch(() => null);

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const root = resolve(args.find((arg) => !arg.startsWith('--')) ?? 'dist');

const ok = (message) => console.log(`\x1b[32m✓\x1b[0m ${message}`);
const skip = (message) => console.log(`\x1b[33m·\x1b[0m ${message}`);
const ko = (message) => console.error(`\x1b[31m✗\x1b[0m ${message}`);

/*
  Les formats qui portent du texte rendu. Les images et les polices n'ont rien
  à voir ici, et les parcourir coûterait le prix de leur poids.
*/
const EXTENSIONS = ['.html', '.xml', '.txt', '.json', '.js', '.css'];

/*
  Les points de code écrits en échappement plutôt qu'en clair : un fichier
  source dont la moitié des caractères sont invisibles ne se relit pas.

  Le stega n'utilise que quatre points de code — U+200B, U+200C, U+200D et
  U+FEFF. Tant qu'à ouvrir chaque fichier, on cherche aussi les autres
  invisibles qui traînent après un copier-coller : marques de direction,
  jointures, trait d'union conditionnel, et les « caractères d'étiquette » du
  plan 14, qui servent aux filigranes des générateurs de texte.
*/
const INVISIBLES = [
  ['\u00AD', 'U+00AD', 'trait d’union conditionnel'],
  ['\u180E', 'U+180E', 'séparateur mongol'],
  ['\u200B', 'U+200B', 'espace de largeur nulle'],
  ['\u200C', 'U+200C', 'antiliant de largeur nulle'],
  ['\u200D', 'U+200D', 'liant de largeur nulle'],
  ['\u200E', 'U+200E', 'marque gauche-à-droite'],
  ['\u200F', 'U+200F', 'marque droite-à-gauche'],
  ['\u2060', 'U+2060', 'liant de mots'],
  ['\uFEFF', 'U+FEFF', 'espace insécable de largeur nulle (BOM)'],
];

const NAMES = new Map(INVISIBLES.map(([char, code, label]) => [char, `${code}  ${label}`]));

const PATTERN =
  /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu;

function describe(char) {
  return NAMES.get(char) ?? `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
}

async function* walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (EXTENSIONS.some((extension) => entry.name.endsWith(extension))) yield path;
  }
}

/*
  Une adresse décodée vaut mieux qu'un décompte : elle NOMME la cause, et son
  `baseUrl` dit tout de suite quel Studio a signé le build. `localhost:3333` sur
  un site public, c'est le poste de travail de quelqu'un.
*/
function firstStegaPayload(content) {
  if (!vercelStegaDecode) return null;
  const at = content.search(PATTERN);
  if (at === -1) return null;
  try {
    const decoded = vercelStegaDecode(content.slice(Math.max(0, at - 200), at + 4000));
    return decoded && typeof decoded === 'object' ? decoded : null;
  } catch {
    return null;
  }
}

const census = new Map();
const touched = [];
let scanned = 0;
let payload = null;

for await (const path of walk(root)) {
  scanned += 1;
  const content = await readFile(path, 'utf8');
  const found = content.match(PATTERN);
  if (!found) continue;

  for (const char of found) census.set(char, (census.get(char) ?? 0) + 1);
  payload ??= firstStegaPayload(content);

  const cleaned = fix ? stegaClean(content) : null;
  if (fix) await writeFile(path, cleaned, 'utf8');

  touched.push({
    path: relative(process.cwd(), path),
    count: found.length,
    /*
      Ce qui SURVIT au nettoyage. `stegaClean` ne retire que des séquences
      stega valides : une espace de largeur nulle posée à la main dans un
      texte reste, et c'est voulu (voir l'en-tête). Mais alors le fichier a
      été réécrit sans être propre — le dire, plutôt que d'annoncer une
      victoire que la relance démentirait.
    */
    residual: cleaned === null ? 0 : (cleaned.match(PATTERN) ?? []).length,
    before: Buffer.byteLength(content),
    after: cleaned === null ? null : Buffer.byteLength(cleaned),
  });
}

if (scanned === 0) {
  ko(`Rien à inspecter dans ${relative(process.cwd(), root) || root}/ — le site est-il construit ?`);
  process.exit(1);
}

const total = [...census.values()].reduce((sum, count) => sum + count, 0);

console.log(`\nInspecté : ${scanned} fichier(s) dans ${relative(process.cwd(), root) || root}/\n`);

if (total === 0) {
  ok('Aucun caractère invisible. Le site est propre.');
  process.exit(0);
}

for (const [char, count] of [...census].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(9)}  ${describe(char)}`);
}

console.log(`\n  ${touched.length} fichier(s) touché(s), les plus lourds :\n`);
for (const file of [...touched].sort((a, b) => b.count - a.count).slice(0, 8)) {
  const weight =
    file.after === null
      ? `${(file.before / 1024).toFixed(0)} ko`
      : `${(file.before / 1024).toFixed(0)} ko → ${(file.after / 1024).toFixed(0)} ko`;
  console.log(`    ${String(file.count).padStart(8)}  ${file.path}  (${weight})`);
}

if (payload?.href) {
  console.log(`\n  Adresse encodée dans la première traîne rencontrée :\n    ${payload.href}\n`);
}

if (fix) {
  const before = touched.reduce((sum, file) => sum + file.before, 0);
  const after = touched.reduce((sum, file) => sum + (file.after ?? file.before), 0);
  const residual = touched.reduce((sum, file) => sum + file.residual, 0);

  ok(
    `${touched.length} fichier(s) nettoyé(s) — ${(before / 1024).toFixed(0)} ko → ${(after / 1024).toFixed(0)} ko.`,
  );
  skip(
    'Correctif réel : PUBLIC_SANITY_VISUAL_EDITING_ENABLED="false" dans le fichier .env, puis reconstruire.',
  );

  if (residual > 0) {
    const files = touched.filter((file) => file.residual > 0);
    ko(`${residual} caractère(s) invisible(s) ONT SURVÉCU au nettoyage :`);
    for (const file of files.slice(0, 8)) {
      console.error(`    ${String(file.residual).padStart(8)}  ${file.path}`);
    }
    console.error(
      "\n  Ce ne sont donc pas des traînes stega, mais des caractères écrits dans le\n" +
        '  contenu lui-même. À corriger dans Sanity, à la source.\n',
    );
    process.exit(1);
  }

  process.exit(0);
}

ko(`${total.toLocaleString('fr-FR')} caractères invisibles dans le site construit.`);
console.error(
  '\n  Cause attendue : le stega de l’édition visuelle.\n' +
    '  Passez PUBLIC_SANITY_VISUAL_EDITING_ENABLED à "false" DANS LE FICHIER .env,\n' +
    '  puis reconstruisez. Une variable posée en ligne de commande ou un\n' +
    '  .env.production ne suffisent pas : sur une clé définie des deux côtés,\n' +
    '  c’est le .env que voit import.meta.env, donc le client Sanity.\n' +
    '  Pour dépanner un build déjà fait, sans le refaire : -- --fix\n',
);
process.exit(1);

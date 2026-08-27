import { shopifyFetch } from './client';
import { shopPoliciesQuery } from './queries';
import type { PolicyKey, ShopPolicy } from './types';

/**
 * Lecture des politiques de boutique.
 *
 * Pendant du module `catalogue.ts` : seule frontière entre la forme de l'API
 * Shopify et celle du site. Ici, la traduction ne porte pas sur des champs mais
 * sur du HTML — et c'est tout le sujet, voir `normalizePolicyHtml` plus bas.
 *
 * Comme partout côté boutique, une absence de réponse ne casse rien : une
 * politique manquante vaut `null`, et la route correspondante n'est simplement
 * pas publiée.
 */

interface RawPolicy {
  title: string;
  body: string;
}

interface RawShopPolicies {
  shop: {
    termsOfService: RawPolicy | null;
    shippingPolicy: RawPolicy | null;
    refundPolicy: RawPolicy | null;
  };
}

/** Correspondance entre nos clés et les champs de l'API Storefront. */
const POLICY_FIELDS = {
  terms: 'termsOfService',
  shipping: 'shippingPolicy',
  refund: 'refundPolicy',
} as const satisfies Record<PolicyKey, keyof RawShopPolicies['shop']>;

export const policyKeys = Object.keys(POLICY_FIELDS) as PolicyKey[];

/**
 * Mémoïsé pour la durée du process, comme `getSiteContext` : au build, chaque
 * page du site peut demander la liste des politiques disponibles pour son pied
 * de page sans multiplier les appels réseau.
 */
let cache: Promise<ShopPolicy[]> | null = null;

export function getShopPolicies(): Promise<ShopPolicy[]> {
  cache ??= (async () => {
    const data = await shopifyFetch<RawShopPolicies>({
      query: shopPoliciesQuery,
      fallback: { shop: { termsOfService: null, shippingPolicy: null, refundPolicy: null } },
    });

    return policyKeys.flatMap((key) => {
      const raw = data.shop[POLICY_FIELDS[key]];
      const body = normalizePolicyHtml(raw?.body ?? '');

      // Un emplacement vide dans l'admin ne doit pas produire une page blanche.
      if (!body) return [];

      // Signalé, jamais bloquant : c'est à l'éditeur de décider quand publier.
      const placeholders = findPlaceholders(body);
      if (placeholders.length > 0) warnUnfinished(key, placeholders);

      return [{ key, title: raw?.title ?? '', body }];
    });
  })();

  return cache;
}

/** Une politique précise, ou `null` si elle n'est pas rédigée chez Shopify. */
export async function getShopPolicy(key: PolicyKey): Promise<ShopPolicy | null> {
  const policies = await getShopPolicies();
  return policies.find((policy) => policy.key === key) ?? null;
}

/* ── Repérage des emplacements laissés vides ─────────────────────────────── */

/*
  Les modèles fournis par Shopify sont livrés troués : « [INSÉRER LE NUMÉRO DE
  TVA] », « [LIEN] », « [MARCHAND] »… Facile à oublier une fois la page en
  ligne, puisque rien ne la distingue d'un texte terminé.

  La construction les énumère donc à chaque passage, sans jamais retenir la
  page : quand publier un texte juridique relève de son auteur, pas du code.
  Les pages légales portées par Sanity suivent la même règle — elles partent en
  ligne dès qu'elles sont publiées, complètes ou non.

  Le crochet est un signe sûr ici : un texte juridique rédigé n'en contient pas.
*/
const PLACEHOLDER_PATTERN = /\[[^\]\n]{3,80}\]/g;

function findPlaceholders(html: string): string[] {
  const text = html.replace(/<[^>]*>/g, '');
  return [...new Set(text.match(PLACEHOLDER_PATTERN) ?? [])];
}

function warnUnfinished(key: PolicyKey, placeholders: string[]): void {
  console.warn(
    `[shopify] Politique « ${key} » PUBLIÉE AVEC DES TROUS : le modèle contient encore ` +
      `${placeholders.length} emplacement(s) à compléter dans Paramètres → Politiques.\n` +
      placeholders.map((placeholder) => `    · ${placeholder}`).join('\n'),
  );
}

/* ── Normalisation du HTML ───────────────────────────────────────────────── */

/*
  Pourquoi ce traitement plutôt qu'un `set:html` direct.

  L'éditeur de politiques de Shopify produit du HTML plat : les CGV arrivent
  sous la forme d'UN SEUL `<p>` contenant plus de cent `<br>`, et les titres de
  section sont de simples `<strong>` en début de ligne. Injecté tel quel, cela
  donne un mur de texte sans structure de titres — illisible à l'œil, et surtout
  impossible à parcourir au lecteur d'écran, qui navigue de titre en titre.

  On reconstruit donc une vraie structure : chaque `<br>` devient une frontière
  de paragraphe, et une ligne entièrement composée d'un `<strong>` redevient le
  titre qu'elle était. Au passage, on n'accepte qu'une liste blanche de balises :
  le texte vient d'un back-office tiers, il n'a pas à pouvoir injecter du script
  ni de la mise en forme hors charte.
*/

/** Balises conservées à l'intérieur d'un paragraphe. Tout le reste est retiré. */
const INLINE_TAGS = ['strong', 'em', 'b', 'i', 'a'];

export function normalizePolicyHtml(raw: string): string {
  if (!raw) return '';

  const cleaned = raw
    // Shopify préfixe parfois le corps d'un `<meta charset>` : il n'a rien à
    // faire au milieu d'une page déjà rendue.
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(?:meta|link|head|body|html)\b[^>]*>/gi, '')
    // Une fin de paragraphe est une frontière au même titre qu'un `<br>`.
    .replace(/<\/p\s*>/gi, '<br>')
    .replace(/<\/?(?:p|div|span)\b[^>]*>/gi, '');

  const lines = cleaned
    .split(/<br\s*\/?>/i)
    .map((line) => sanitizeInline(line).trim())
    .filter(hasText);

  return mergeSoftWraps(lines).map(toBlock).join('\n');
}

/**
 * Recolle les phrases que Shopify a coupées.
 *
 * Tous les `<br>` ne se valent pas : l'éditeur de Shopify s'en sert le plus
 * souvent pour séparer deux paragraphes, mais parfois comme simple retour à la
 * ligne au milieu d'une phrase. Découper aveuglément produit alors une phrase
 * en deux morceaux, visiblement orpheline une fois la colonne élargie.
 *
 * Le signe qui les distingue : une vraie fin de paragraphe se termine par une
 * ponctuation forte, et la suivante commence par une majuscule. Quand ni l'un
 * ni l'autre n'est vrai, c'est la même phrase — on la recoud.
 */
function mergeSoftWraps(lines: string[]): string[] {
  return lines.reduce<string[]>((merged, line) => {
    const previous = merged[merged.length - 1];

    if (previous && !isHeading(previous) && !isHeading(line) && continuesSentence(previous, line)) {
      merged[merged.length - 1] = `${previous} ${line}`;
      return merged;
    }

    merged.push(line);
    return merged;
  }, []);
}

/** Texte nu d'une ligne, sans balises ni espaces insécables. */
function plainText(line: string): string {
  return line.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '').trim();
}

function continuesSentence(previous: string, line: string): boolean {
  const before = plainText(previous);
  const after = plainText(line);
  if (!before || !after) return false;

  // Ponctuation forte : le paragraphe précédent est bel et bien terminé.
  if (/[.!?:;»"')\]]$/.test(before)) return false;

  // Une majuscule ou un tiret de liste ouvre une nouvelle unité de texte.
  return /^[a-zà-öø-ÿ(«]/.test(after);
}

/** Retire toute balise hors liste blanche, et tout attribut hors `href`. */
function sanitizeInline(line: string): string {
  return line
    /*
      Toutes les ouvertures d'ancre passent par le MÊME remplacement, y compris
      celles sans `href` exploitable. Les traiter en deux passes laisserait des
      `</a>` orphelins — ou effacerait les liens tout juste reconstruits.
    */
    .replace(/<a\b([^>]*)>/gi, (_match, attributes: string) =>
      renderAnchor(attributes.match(/href\s*=\s*(["'])(.*?)\1/i)?.[2] ?? ''),
    )
    .replace(
      new RegExp(`<(?!/?(?:${INLINE_TAGS.join('|')})\\b)[^>]*>`, 'gi'),
      '',
    )
    // Les balises autorisées perdent leurs éventuels attributs.
    .replace(new RegExp(`<(${INLINE_TAGS.join('|')})\\b[^>]*>`, 'gi'), (_match, tag: string) =>
      tag.toLowerCase() === 'a' ? _match : `<${tag.toLowerCase()}>`,
    );
}

/**
 * Un lien de politique pointe soit vers un e-mail, soit vers un site tiers.
 * Dans le second cas, on ouvre dans un nouvel onglet : le lecteur est en train
 * de lire un texte juridique, on ne lui fait pas perdre sa page.
 *
 * Une destination absente ou refusée donne un `<a>` sans `href` : le texte
 * reste lisible, le lien devient inerte, et le `</a>` correspondant garde son
 * ouverture.
 */
function renderAnchor(href: string): string {
  const safe = href.trim();

  // `javascript:` et consorts n'ont rien à faire ici.
  if (!/^(?:https?:|mailto:|tel:|\/|#)/i.test(safe)) return '<a>';

  const isExternal = /^https?:/i.test(safe);
  const escaped = safe.replace(/"/g, '&quot;');

  return isExternal
    ? `<a href="${escaped}" target="_blank" rel="noopener noreferrer">`
    : `<a href="${escaped}">`;
}

/** `true` s'il reste du texte une fois les balises et espaces insécables retirés. */
function hasText(line: string): boolean {
  return line.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

/**
 * Une ligne entièrement en gras était un titre de section dans l'éditeur
 * Shopify : on lui rend son niveau. Les pages de politique n'ayant qu'un seul
 * `<h1>` (le titre de la page), ces titres-ci sont des `<h2>`.
 */
function isHeading(line: string): boolean {
  return /^<strong>[\s\S]*?<\/strong>\s*$/i.test(line);
}

function toBlock(line: string): string {
  const heading = line.match(/^<strong>([\s\S]*?)<\/strong>\s*$/i);
  if (heading) return `<h2>${heading[1]!.trim()}</h2>`;

  return `<p>${line}</p>`;
}

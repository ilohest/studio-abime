import { loadQuery } from "~/lib/sanity/loadQuery";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MODE MAINTENANCE
 * ═══════════════════════════════════════════════════════════════════════════
 * Un rideau tiré devant le site, levable avec un mot de passe.
 *
 * Deux pièces, et il faut comprendre pourquoi elles sont séparées :
 *
 *  1. L'INTERRUPTEUR vit dans Sanity (document `maintenance`), donc entre les
 *     mains de la cliente. Il est lu AU BUILD (voir `astro.config.ts`) et non à
 *     chaque visite : le site est statique, personne n'est là pour répondre
 *     quand une page est servie par le CDN. Publier déclenche la
 *     reconstruction (webhook, README § Déploiement) et la bascule se fait
 *     quelques minutes plus tard.
 *
 *  2. Le MOT DE PASSE vit dans l'environnement (`MAINTENANCE_PASSWORD`), jamais
 *     dans Sanity : le contenu d'un dataset est lisible publiquement par l'API,
 *     un mot de passe écrit dans le back-office serait affiché à qui sait le
 *     demander.
 *
 * Quand l'interrupteur est allumé, les pages basculent en rendu à la demande
 * (`prerender = false`) : c'est la seule façon d'avoir un serveur qui vérifie
 * quelque chose avant de répondre. Éteint, le site retrouve son rendu 100 %
 * statique et ce fichier ne coûte plus rien — aucun Worker réveillé, aucune
 * requête supplémentaire.
 */

/**
 * Interrupteur résolu au build, injecté par `astro.config.ts`.
 * Constante littérale après compilation : les branches mortes disparaissent du
 * bundle, et le mot de passe avec elles quand le mode est éteint.
 */
export const maintenanceEnabled =
  import.meta.env.MAINTENANCE_ENABLED === "true";

/** Mot de passe d'accès. Vide = personne n'entre, l'écran reste seul. */
const password = (import.meta.env.MAINTENANCE_PASSWORD ?? "").trim();

/** Sans mot de passe configuré, le formulaire d'accès n'est même pas affiché. */
export const accessPossible = password.length > 0;

/** Chemin de l'écran vers lequel le middleware réécrit les requêtes. */
export const MAINTENANCE_PATH = "/maintenance";

/** Cookie porteur du laissez-passer. */
export const MAINTENANCE_COOKIE = "abime-acces";

/** Durée du laissez-passer : trente jours, pour ne pas ressaisir à chaque visite. */
export const MAINTENANCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Paramètre d'URL signalant un mot de passe refusé (voir `src/middleware.ts`). */
export const MAINTENANCE_ERROR_PARAM = "acces";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Valeur attendue du cookie : l'empreinte du mot de passe, jamais le mot de
 * passe lui-même. Un cookie volé ne le révèle pas, et un cookie fabriqué de
 * toutes pièces ne passe pas — il faudrait connaître le mot de passe pour
 * produire l'empreinte.
 */
export function accessToken(): Promise<string> {
  return sha256Hex(`studio-abime:acces:${password}`);
}

export async function passwordMatches(candidate: string): Promise<boolean> {
  if (!accessPossible) return false;
  return (
    (await sha256Hex(`studio-abime:acces:${candidate.trim()}`)) ===
    (await accessToken())
  );
}

/**
 * Destination de retour après déverrouillage.
 * Seuls les chemins internes sont acceptés : sans ce filtre, le formulaire
 * serait un tremplin de redirection vers n'importe quel domaine.
 */
export function safeNextPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return "/";
  if (value.startsWith(MAINTENANCE_PATH)) return "/";
  return value;
}

export interface MaintenanceContent {
  title: string;
  message: string;
  signature: string | null;
}

/**
 * Textes de repli. L'écran doit tenir debout même si le document n'a jamais été
 * rempli — ou si Sanity ne répond pas au moment précis où le site est fermé.
 */
export const MAINTENANCE_FALLBACK: MaintenanceContent = {
  title: "Nous revenons très vite.",
  message:
    "Le site du Studio Abîme se prépare. Nous plongeons un peu plus loin sous le visible, et nous remontons bientôt.",
  signature: "Studio Abîme",
};

/*
  Requête gardée ici plutôt que dans `src/lib/sanity/queries.ts` : elle ne
  partage aucun fragment avec le reste et ne connaît pas les langues. Toute la
  fonctionnalité tient ainsi dans quatre fichiers, et se retire aussi vite
  qu'elle s'ajoute.
*/
const maintenanceQuery = /* groq */ `*[_id == "maintenance"][0]{ title, message, signature }`;

export async function getMaintenanceContent(): Promise<MaintenanceContent> {
  const document = await loadQuery<Partial<MaintenanceContent> | null>({
    query: maintenanceQuery,
    fallback: null,
  });

  return {
    title: document?.title?.trim() || MAINTENANCE_FALLBACK.title,
    message: document?.message?.trim() || MAINTENANCE_FALLBACK.message,
    signature: document?.signature?.trim() || MAINTENANCE_FALLBACK.signature,
  };
}

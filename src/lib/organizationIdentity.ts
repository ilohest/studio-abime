import type { OrganizationIdentity } from './sanity/types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * L'IDENTITÉ DE L'ENTREPRISE, CITÉE DANS LE TEXTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les mentions légales, la politique de confidentialité et la politique
 * cookies répètent toutes les mêmes informations : dénomination, siège, numéro
 * d'entreprise, adresse de contact. Écrites en toutes lettres dans chaque page,
 * elles divergent au premier déménagement — et c'est la page qu'on a oublié de
 * corriger qui fait foi devant un juge.
 *
 * Elles sont donc saisies UNE fois (Réglages du site → Identité et réseaux
 * sociaux) et citées partout ailleurs par référence : l'éditrice insère un
 * élément « Numéro de TVA » dans son texte, le rendu va chercher la valeur.
 *
 * ── Ce fichier est le registre partagé ──────────────────────────────────────
 * Il est importé des DEUX côtés : par le schéma Sanity (`identityValue`), qui y
 * lit la liste proposée à l'éditrice, et par le rendu (`portableText.ts`), qui
 * y lit comment résoudre chaque clé. Une seule liste, donc aucun moyen de
 * proposer dans le back-office un champ que le site ne saurait pas afficher.
 * (Même dispositif que `MAX_FEATURED_PROJECTS`, lu par le schéma projet.)
 *
 * ⚠️ Il est donc compilé par DEUX bundlers : celui d'Astro et celui de la CLI
 *    Sanity, qui ne résout pas l'alias `~/`. Aucun import de valeur ici — d'où
 *    la langue de formatage reçue en paramètre plutôt que lue dans
 *    `~/i18n/config`. Le seul import est un `import type`, effacé à la
 *    compilation.
 *
 * ── Règle absolue : un trou reste visible ───────────────────────────────────
 * Une valeur manquante ne disparaît PAS du texte : elle laisse à sa place le
 * même « [À COMPLÉTER : … ] » qu'avant. C'est délibéré, et c'est l'inverse de
 * ce que fait `jsonLd.ts` — qui, lui, omet les champs vides.
 *
 * La différence tient à qui lit. Des données structurées incomplètes ne valent
 * qu'un affichage moins riche dans Google. Des mentions légales incomplètes
 * sont une infraction : le Code de droit économique impose ces informations.
 * Une page qui omettrait silencieusement le numéro d'entreprise aurait l'air
 * complète tout en étant en faute — le pire des deux mondes. Mieux vaut
 * qu'elle crie ce qui lui manque.
 */

/**
 * Les informations citables, dans l'ordre où elles sont proposées à l'éditrice.
 *
 * `placeholder` est le texte affiché tant que le champ n'est pas rempli. Il
 * décrit ce qu'on attend et, quand c'est utile, sous quelle forme : c'est la
 * seule consigne que verra la personne qui remplit la fiche.
 */
export const IDENTITY_FIELDS = [
  {
    value: 'legalName',
    title: 'Dénomination légale',
    placeholder: 'dénomination légale de l’entreprise',
  },
  {
    value: 'legalForm',
    title: 'Forme juridique',
    placeholder: 'forme juridique — SRL, entreprise personne physique…',
  },
  {
    value: 'address',
    title: 'Adresse du siège',
    placeholder: 'rue, numéro, code postal, commune',
  },
  {
    value: 'email',
    title: 'Adresse e-mail',
    placeholder: 'adresse e-mail professionnelle du studio',
  },
  {
    value: 'phone',
    title: 'Téléphone',
    placeholder: 'numéro de téléphone, ou supprimer cette ligne',
  },
  {
    value: 'companyNumber',
    title: 'Numéro d’entreprise (BCE)',
    placeholder: 'numéro d’entreprise BCE — 0XXX.XXX.XXX',
  },
  {
    value: 'vatId',
    title: 'Numéro de TVA',
    placeholder: 'numéro de TVA — BE 0XXX.XXX.XXX',
  },
  {
    value: 'judicialDistrict',
    title: 'Arrondissement judiciaire',
    placeholder: 'arrondissement judiciaire — celui du siège',
  },
  {
    value: 'host',
    title: 'Hébergeur du site',
    placeholder: 'nom et adresse de l’hébergeur du site',
  },
  {
    value: 'updatedAt',
    title: 'Date de dernière mise à jour',
    placeholder: 'date de dernière mise à jour',
  },
] as const;

export type IdentityFieldKey = (typeof IDENTITY_FIELDS)[number]['value'];

const FIELD_BY_KEY = new Map(IDENTITY_FIELDS.map((field) => [field.value, field]));

export function isIdentityFieldKey(value: unknown): value is IdentityFieldKey {
  return typeof value === 'string' && FIELD_BY_KEY.has(value as IdentityFieldKey);
}

/** Libellé de la référence — ce que l'éditrice lit dans son texte. */
export function identityFieldTitle(key: IdentityFieldKey): string {
  return FIELD_BY_KEY.get(key)?.title ?? key;
}

/** Ce qui s'affiche à la place d'une valeur non renseignée. */
export function identityPlaceholder(key: IdentityFieldKey): string {
  const field = FIELD_BY_KEY.get(key);
  return `[À COMPLÉTER : ${field?.placeholder ?? key}]`;
}

/* -------------------------------------------------------------------------- */
/* Résolution                                                                  */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Adresse du siège sur une ligne : « Rue de la Loi 16, 1000 Bruxelles ».
 *
 * Le pays n'y figure pas. Il est saisi en code à deux lettres (BE, FR…) pour
 * les données structurées, et « BE » au bout d'une phrase française ne
 * ressemble à rien. Une adresse belge lue sur un site belge n'a pas besoin de
 * son pays ; le jour où il le faudra, c'est ici qu'il s'ajoutera.
 */
function formatAddress(organization: OrganizationIdentity): string | undefined {
  const street = text(organization.streetAddress);
  const city = [text(organization.postalCode), text(organization.addressLocality)]
    .filter(Boolean)
    .join(' ');

  const parts = [street, city || undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * Numéro d'entreprise, déduit du numéro de TVA quand il n'est pas saisi.
 *
 * En Belgique, les deux portent les mêmes chiffres : le numéro de TVA est le
 * numéro d'entreprise préfixé de « BE ». Les faire saisir tous les deux, c'est
 * demander deux fois la même chose et ouvrir la porte à ce qu'ils se
 * contredisent. On dérive donc, et le champ dédié ne sert qu'aux cas où la
 * déduction ne s'applique pas — une entreprise non assujettie à la TVA, ou un
 * siège hors de Belgique.
 */
function formatCompanyNumber(organization: OrganizationIdentity): string | undefined {
  const explicit = text(organization.companyNumber);
  if (explicit) return explicit;

  const digits = (text(organization.vatId) ?? '').replace(/\D/g, '');
  if (digits.length !== 10) return undefined;

  return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
}

/**
 * Date de dernière révision du texte, en toutes lettres.
 *
 * Elle vient du document lui-même (`_updatedAt`), et non d'un champ à tenir à
 * jour. Une politique de confidentialité doit dire quand elle a changé : une
 * date saisie à la main annonce, tôt ou tard, une révision qui n'a pas eu lieu.
 * Celle-ci ne peut pas mentir — modifier le texte, c'est modifier la date.
 */
function formatUpdatedAt(iso: string | undefined, dateLocale: string): string | undefined {
  const raw = text(iso);
  if (!raw) return undefined;

  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return undefined;

  return new Intl.DateTimeFormat(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    /*
      UTC, et non le fuseau de la machine de build : une révision enregistrée à
      1 h du matin à Bruxelles daterait de la veille sur un serveur à Londres.
      La page afficherait alors une date différente selon l'endroit d'où elle a
      été construite.
    */
    timeZone: 'UTC',
  }).format(new Date(time));
}

export interface IdentityContext {
  organization?: OrganizationIdentity | null;
  /** `_updatedAt` du document qui porte le texte — pour la clé `updatedAt`. */
  updatedAt?: string;
  /** Étiquette BCP 47 (`fr-FR`, `nl-BE`…) pour la mise en forme de la date. */
  dateLocale: string;
}

/**
 * Valeur à afficher pour une référence, ou `undefined` si elle n'est pas
 * renseignée — auquel cas l'appelant pose le `[À COMPLÉTER : … ]`.
 */
export function resolveIdentityValue(
  key: IdentityFieldKey,
  context: IdentityContext,
): string | undefined {
  if (key === 'updatedAt') return formatUpdatedAt(context.updatedAt, context.dateLocale);

  const organization = context.organization;
  if (!organization) return undefined;

  switch (key) {
    case 'address':
      return formatAddress(organization);
    case 'companyNumber':
      return formatCompanyNumber(organization);
    default:
      return text(organization[key]);
  }
}

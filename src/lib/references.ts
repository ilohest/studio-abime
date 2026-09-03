/**
 * Références du studio — table des éléments de la page Expériences.
 *
 * Une seule règle de remplissage, partagée par la table et par la note de bas
 * de page, en deux temps :
 *
 *  1. les SEPT CASES RÉSERVÉES reçoivent d'abord les projets favoris (ordre
 *     éditorial, du plus récent au plus ancien), puis les clients encodés sans
 *     projet (ordre d'encodage) pour celles que les projets laissent libres ;
 *  2. les clients encore sans case REPRENNENT LA TABLE PAR LE DÉBUT — 1, 2,
 *     3… — en enjambant les cases réservées, déjà attribuées au premier temps.
 *
 * Ce qui reste vide garde son véritable élément chimique : la table ne ment
 * jamais sur ce qu'elle montre.
 *
 * Ce module ne dépend d'aucun runtime : il est importé aussi bien par les
 * composants Astro que par les schémas Sanity (limite des 7 favoris).
 */
import type { Client, ProjectCard } from './sanity/types';

/**
 * Numéros atomiques des cases réservées aux références, dans l'ordre de
 * remplissage. Choisis pour leur répartition sur toute la table : Ti, Fe, Cu,
 * Ag, Au, Rn, Ts.
 */
export const REFERENCE_SLOTS = [22, 26, 29, 47, 79, 86, 117] as const;

/** Nombre maximal de projets favoris — une case réservée chacun. */
export const MAX_FEATURED_PROJECTS = REFERENCE_SLOTS.length;

/** Dernier numéro atomique de la table. Au-delà, plus une case à donner. */
const LAST_ELEMENT = 118;

/**
 * Cases de débordement : toute la table, du début à la fin, moins les sept
 * réservées. Un client en surnombre prend la première venue.
 */
const OVERFLOW_SLOTS = Array.from({ length: LAST_ELEMENT }, (_, index) => index + 1).filter(
  (atomicNumber) => !REFERENCE_SLOTS.includes(atomicNumber as (typeof REFERENCE_SLOTS)[number]),
);

/** Entrée de la table : soit un projet publié, soit un client sans projet. */
export type ReferenceSource =
  | { kind: 'project'; project: ProjectCard }
  | { kind: 'client'; client: Client };

/** Case réservée, une fois attribuée. */
export interface ReferenceSlot {
  /** Numéro atomique de la case occupée — sert aussi d'appel de note. */
  atomicNumber: number;
  source: ReferenceSource;
}

/**
 * Nom porté par la case : celui du CLIENT avant tout. Un projet sans client
 * renseigné retombe sur son propre titre plutôt que de laisser une case muette.
 */
export function referenceName(source: ReferenceSource): string {
  if (source.kind === 'client') return source.client.name;
  return source.project.client?.trim() || source.project.title;
}

/**
 * Nom qui donne les INITIALES de la case. Un projet signe de son titre — c'est
 * le symbole que sa page reprend en tête, et la case doit tenir la promesse de
 * ce qui s'ouvrira. Un client, lui, n'a que son nom.
 */
export function referenceSymbolName(source: ReferenceSource): string {
  return source.kind === 'project' ? source.project.title : source.client.name;
}

/** Secteur affiché à la place du mot « élément ». */
export function referenceSector(source: ReferenceSource): string | undefined {
  const sector = source.kind === 'client' ? source.client.sector : source.project.sector;
  return sector?.trim() || undefined;
}

/**
 * Numéro que porte un projet partout où on le montre : celui de sa case
 * réservée s'il en occupe une, son rang au catalogue sinon. La grille, la case
 * d'en-tête et l'étiquette de la fiche s'accordent ainsi sans se concerter.
 */
export function projectDisplayNumber(project: {
  featured?: boolean;
  featuredRank?: number;
  number?: number;
}): number | undefined {
  const rank = project.featuredRank;
  return project.featured && typeof rank === 'number' && rank < MAX_FEATURED_PROJECTS
    ? REFERENCE_SLOTS[rank]
    : project.number;
}

/** Projets favoris de la langue courante, dans l'ordre déjà trié par la requête. */
export function featuredProjects(projects: ProjectCard[]): ProjectCard[] {
  return projects.filter((project) => project.featured).slice(0, MAX_FEATURED_PROJECTS);
}

/**
 * Attribue les cases réservées. Le résultat contient au plus 7 entrées ; les
 * cases non attribuées ne figurent simplement pas dans la liste.
 */
export function buildReferenceSlots(
  projects: ProjectCard[],
  clients: Client[] = [],
): ReferenceSlot[] {
  const sources: ReferenceSource[] = [
    ...featuredProjects(projects).map((project) => ({ kind: 'project' as const, project })),
    ...clients
      .filter((client) => client?.name?.trim())
      .map((client) => ({ kind: 'client' as const, client })),
  ];

  const reserved = sources
    .slice(0, REFERENCE_SLOTS.length)
    .map((source, index) => ({ atomicNumber: REFERENCE_SLOTS[index]!, source }));

  // Les sources en surnombre ne peuvent être que des clients : les favoris sont
  // plafonnés au nombre de cases réservées.
  const overflow = sources
    .slice(REFERENCE_SLOTS.length)
    .map((source, index) => ({ atomicNumber: OVERFLOW_SLOTS[index], source }))
    .filter((slot): slot is ReferenceSlot => slot.atomicNumber !== undefined);

  return [...reserved, ...overflow];
}

/** Client de la note de bas de page, avec l'appel de note qui lui revient. */
export interface ClientFootnote {
  client: Client;
  /** Case occupée dans la table, quand il en reste une pour lui. */
  atomicNumber?: number;
}

/**
 * Note de bas de page : TOUS les clients encodés sans projet, qu'ils aient
 * trouvé une case ou non. Les projets favoris en sont exclus — ils se lisent
 * déjà dans la table et dans la grille.
 *
 * L'ordre est celui des appels de note, pas celui de la saisie : une note se
 * lit par ses numéros. Les clients sans case ferment la liste.
 */
export function buildClientFootnotes(
  projects: ProjectCard[],
  clients: Client[] = [],
): ClientFootnote[] {
  const placed = new Map(
    buildReferenceSlots(projects, clients)
      .filter((slot) => slot.source.kind === 'client')
      .map((slot) => [
        (slot.source as { kind: 'client'; client: Client }).client._id,
        slot.atomicNumber,
      ]),
  );

  return clients
    .filter((client) => client?.name?.trim())
    .map((client) => ({ client, atomicNumber: placed.get(client._id) }))
    .sort((a, b) => (a.atomicNumber ?? Infinity) - (b.atomicNumber ?? Infinity));
}

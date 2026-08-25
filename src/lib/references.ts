/**
 * Références du studio — table des éléments de la page Expériences.
 *
 * Une seule règle de remplissage, partagée par la table et par la note de bas
 * de page : les cases réservées reçoivent d'abord les PROJETS favoris (dans
 * l'ordre éditorial, du plus récent au plus ancien), puis les CLIENTS encodés
 * sans projet (dans leur ordre d'encodage). Ce qui reste vide garde son
 * véritable élément chimique — la table ne ment jamais sur ce qu'elle montre.
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

/** Secteur affiché à la place du mot « élément ». */
export function referenceSector(source: ReferenceSource): string | undefined {
  const sector = source.kind === 'client' ? source.client.sector : source.project.sector;
  return sector?.trim() || undefined;
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

  return sources
    .slice(0, REFERENCE_SLOTS.length)
    .map((source, index) => ({ atomicNumber: REFERENCE_SLOTS[index]!, source }));
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
    .map((client) => ({ client, atomicNumber: placed.get(client._id) }));
}

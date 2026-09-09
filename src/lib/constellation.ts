/**
 * Constellations — le studio au centre, les collaborateurs autour.
 *
 * ┌─ Le propos ─────────────────────────────────────────────────────────────┐
 * │ Une constellation n'est pas une rosace : les étoiles d'un relevé céleste │
 * │ ne sont ni équidistantes ni régulièrement réparties. Ce module place     │
 * │ donc les points de façon HÉTÉROGÈNE — angles inégaux, distances au       │
 * │ centre variables — tout en garantissant qu'aucun libellé n'en recouvre   │
 * │ un autre.                                                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Le placement est DÉTERMINISTE : la même liste d'étoiles, le même germe, la
 * même figure. Deux raisons, et la seconde est la plus importante :
 *
 *  · le rendu est statique — un tirage aléatoire à chaque build ferait bouger
 *    la figure d'un déploiement à l'autre sans qu'aucun contenu n'ait changé ;
 *  · deux projets qui partagent des collaborateurs doivent avoir DEUX figures
 *    différentes — c'est l'identifiant du document qui sert de germe.
 *
 * Toutes les coordonnées sont en POURCENTAGE de la planche (0 → 100), sur les
 * deux axes. Le composant les pose telles quelles en `left` / `top` : la figure
 * s'étire donc avec son conteneur, et le même relevé tient aussi bien dans un
 * bandeau large que dans une planche haute (voir `Constellation.astro`).
 *
 * Aucune dépendance : ce module est importé par Astro au build, mais pourrait
 * l'être ailleurs — il ne fait que du calcul.
 */

/** Une étoile telle qu'elle sort de Sanity. */
export interface ConstellationStar {
  _id: string;
  name: string;
  role?: string;
}

/** Une étoile placée sur la planche. */
export interface PlacedStar extends ConstellationStar {
  /** Position en pourcentage de la planche. */
  x: number;
  y: number;
  /** Côté où pousser le libellé : toujours vers l'EXTÉRIEUR de la figure. */
  side: 'left' | 'right';
  /** Éloignement du centre, 0 → 1. Échelonne l'entrée : le proche s'allume d'abord. */
  depth: number;
}

/**
 * Poussière d'étoiles : des points muets, sans nom ni trait. Décor pur.
 *
 * Même ENCRE que les étoiles nommées — un relevé est tracé d'une seule plume.
 * Seul le diamètre les distingue : plus petits, ils reculent d'eux-mêmes sans
 * qu'on ait à les pâlir.
 */
export interface DustGrain {
  x: number;
  y: number;
  /** Diamètre relatif, 0.5 → 1.4 — le champ n'a pas un grain unique. */
  size: number;
  /** Décalage d'apparition, en secondes : le fond de ciel ne s'allume pas d'un bloc. */
  delay: number;
}

export interface Constellation {
  center: { x: number; y: number };
  stars: PlacedStar[];
  dust: DustGrain[];
}

export interface ConstellationOptions {
  /** Germe du tirage — l'identifiant du document qui porte la figure. */
  seed?: string;
  /** Demi-largeur et demi-hauteur du champ, en % de la planche. */
  spreadX?: number;
  spreadY?: number;
  /**
   * Écart minimal entre deux étoiles, en % de la planche. Ce n'est pas la
   * distance entre les POINTS mais entre les LIBELLÉS : large en X (un nom est
   * long), courte en Y (deux lignes de texte). D'où deux valeurs.
   */
  gapX?: number;
  gapY?: number;
  /** Nombre de grains de poussière. `auto` par défaut : proportionnel au champ. */
  dust?: number;
}

const DEFAULTS = {
  spreadX: 30,
  spreadY: 33,
  gapX: 26,
  gapY: 11,
} as const;

/* -------------------------------------------------------------------------- */
/* Tirage reproductible                                                        */
/* -------------------------------------------------------------------------- */

/** FNV-1a — un germe textuel réduit à 32 bits. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 — court, sans état global, suffisant pour une figure. */
function createRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/* -------------------------------------------------------------------------- */
/* Placement                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Compose la figure.
 *
 * Trois temps :
 *
 *  1. UN SECTEUR PAR ÉTOILE. Le tour est découpé en parts égales et chaque
 *     étoile tire sa position à l'intérieur de la sienne. C'est ce qui évite
 *     le paquet de trois étoiles d'un côté et le grand vide de l'autre, sans
 *     pour autant produire la régularité d'un cadran.
 *  2. UNE DISTANCE INÉGALE. Le rayon est tiré entre 45 % et 100 % du champ,
 *     avec un exposant qui pousse les valeurs vers le bord : quelques étoiles
 *     proches, la plupart au large — la répartition d'un vrai relevé.
 *  3. UNE DÉTENTE. Les étoiles se repoussent tant que leurs libellés se
 *     chevauchent, et sont maintenues hors du centre et dans le cadre. C'est
 *     cette passe qui rend la figure lisible quel qu'en soit le nombre.
 */
export function buildConstellation(
  stars: ConstellationStar[],
  options: ConstellationOptions = {},
): Constellation {
  const list = stars.filter((star) => Boolean(star?.name));
  /*
    Sans germe explicite, ce sont les étoiles elles-mêmes qui le donnent : la
    même liste redonne la même figure, deux listes différentes en donnent deux.
    (`join()` renvoie toujours une chaîne — une liste vide donne '', et le
    générateur retombe sur son état de repli.)
  */
  const random = createRandom(options.seed ?? list.map((star) => star._id).join('|'));

  const spreadX = options.spreadX ?? DEFAULTS.spreadX;
  const spreadY = options.spreadY ?? DEFAULTS.spreadY;
  const gapX = options.gapX ?? DEFAULTS.gapX;
  const gapY = options.gapY ?? DEFAULTS.gapY;

  /*
    Le centre n'est pas au milieu exact : décalé de quelques pour cent, il
    retire à la figure sa symétrie d'horloge — comme le « S » du relevé, posé
    à droite de la planche.
  */
  const center = {
    x: 50 + (random() - 0.5) * 7,
    y: 50 + (random() - 0.5) * 7,
  };

  if (list.length === 0) {
    return { center, stars: [], dust: [] };
  }

  /*
    Le cadre laisse 16 % de marge de chaque côté : c'est la place du LIBELLÉ,
    qui pousse toujours vers l'extérieur. Une étoile plus proche du bord
    enverrait son nom hors de la planche.
  */
  const bounds = {
    minX: clamp(center.x - spreadX * 1.05, 16, 50),
    maxX: clamp(center.x + spreadX * 1.05, 50, 84),
    minY: clamp(center.y - spreadY * 1.05, 6, 50),
    maxY: clamp(center.y + spreadY * 1.05, 50, 94),
  };

  const sector = 360 / list.length;
  const rotation = random() * 360;
  /* Aucune étoile ne vient se poser sur le centre ni sur le nom du studio. */
  const inner = 0.4;

  /*
    DES DISTANCES FRANCHEMENT INÉGALES.

    Tirer chaque rayon au hasard dans le même intervalle donnait, sur un petit
    nombre d'étoiles, deux points quasiment à la même distance du centre : la
    figure retombait sur un cercle, ce qu'une constellation n'est jamais.

    L'intervalle est donc DÉCOUPÉ en autant de tranches qu'il y a d'étoiles, une
    par étoile, et le hasard ne joue plus qu'à l'intérieur de la sienne. Une
    étoile est forcément proche, une autre forcément au large, les autres
    échelonnées entre les deux. Les tranches sont ensuite BATTUES : la première
    étoile de la liste n'est pas la plus proche, sans quoi l'ordre d'encodage se
    lirait dans la figure.
  */
  const bands = list.map((_, index) => index);
  for (let index = bands.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [bands[index], bands[swap]] = [bands[swap], bands[index]];
  }

  const placed = list.map((star, index) => {
    const angle = ((rotation + index * sector + (0.16 + random() * 0.68) * sector) * Math.PI) / 180;
    const band = (bands[index] + 0.12 + random() * 0.76) / list.length;
    const reach = inner + (1 - inner) * band;

    return {
      ...star,
      x: center.x + Math.cos(angle) * spreadX * reach,
      y: center.y + Math.sin(angle) * spreadY * reach,
      side: 'right' as 'left' | 'right',
      depth: reach,
    };
  });

  /*
    DÉTENTE — 140 passes suffisent largement à démêler une vingtaine de points,
    et le calcul se fait une fois au build. On borne quand même : une
    configuration pathologique ne doit pas tourner sans fin.
  */
  for (let pass = 0; pass < 140; pass += 1) {
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i];
        const b = placed[j];
        /*
          Distance mesurée dans un repère ÉTIRÉ : un écart horizontal de 26 %
          et un écart vertical de 11 % y valent la même chose. C'est la forme
          d'un libellé — large et bas —, pas celle d'un point.
        */
        const dx = (b.x - a.x) / gapX;
        const dy = (b.y - a.y) / gapY;
        const distance = Math.hypot(dx, dy);

        if (distance >= 1) continue;

        if (distance < 0.0001) {
          /* Deux points confondus n'ont pas de direction : on en écarte un. */
          b.x += gapX * 0.5;
          continue;
        }

        const push = (1 - distance) / 2;
        a.x -= (dx / distance) * push * gapX;
        a.y -= (dy / distance) * push * gapY;
        b.x += (dx / distance) * push * gapX;
        b.y += (dy / distance) * push * gapY;
      }
    }

    for (const star of placed) {
      /* Le centre appartient au studio : aucune étoile ne vient s'y poser. */
      const dx = (star.x - center.x) / spreadX;
      const dy = (star.y - center.y) / spreadY;
      const reach = Math.hypot(dx, dy) || 0.0001;

      if (reach < inner) {
        star.x = center.x + (dx / reach) * inner * spreadX;
        star.y = center.y + (dy / reach) * inner * spreadY;
      }

      star.x = clamp(star.x, bounds.minX, bounds.maxX);
      star.y = clamp(star.y, bounds.minY, bounds.maxY);
    }
  }

  const finished: PlacedStar[] = placed.map((star) => {
    const dx = (star.x - center.x) / spreadX;
    const dy = (star.y - center.y) / spreadY;

    return {
      ...star,
      /* Le libellé fuit toujours le centre : il ne passe jamais sur le trait. */
      side: star.x >= center.x ? 'right' : 'left',
      depth: clamp(Math.hypot(dx, dy), 0, 1),
    };
  });

  return { center, stars: finished, dust: buildDust(finished, center, options, random) };
}

/**
 * Le fond de ciel.
 *
 * Des points minuscules, sans nom et sans trait, tirés au hasard sur toute la
 * planche puis écartés de ce qui compte : ni sur une étoile nommée, ni sur son
 * libellé, ni sur le centre. Le relevé gagne une profondeur ; rien ne s'y lit.
 */
function buildDust(
  stars: PlacedStar[],
  center: { x: number; y: number },
  options: ConstellationOptions,
  random: () => number,
): DustGrain[] {
  const target = options.dust ?? clamp(Math.round(stars.length * 1.8) + 6, 8, 26);
  const grains: DustGrain[] = [];
  const gapX = (options.gapX ?? DEFAULTS.gapX) * 0.42;
  const gapY = (options.gapY ?? DEFAULTS.gapY) * 0.75;

  /* Tirage avec rejet : on tente, on jette ce qui tombe mal, on s'arrête net. */
  for (let attempt = 0; attempt < target * 12 && grains.length < target; attempt += 1) {
    const x = 4 + random() * 92;
    const y = 5 + random() * 90;

    const collides = [...stars, { x: center.x, y: center.y }].some(
      (point) => Math.hypot((point.x - x) / gapX, (point.y - y) / gapY) < 1,
    );
    if (collides) continue;

    grains.push({
      x,
      y,
      size: 0.5 + random() * 0.9,
      delay: random() * 6,
    });
  }

  return grains;
}

/* -------------------------------------------------------------------------- */
/* Tracé                                                                       */
/* -------------------------------------------------------------------------- */

/** Un trait de liaison, prêt à être posé dans le SVG. */
export interface ConstellationRay {
  /** Index de l'étoile desservie. */
  star: number;
  depth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Les liaisons du centre vers chaque étoile.
 *
 * Un trait par étoile, et il va d'un point à l'autre EXACTEMENT : du centre à
 * l'étoile, les deux disques recouvrant ses extrémités. Une liaison qui s'arrête
 * avant son point laisse un flottement, et une carte ne flotte pas.
 *
 * Cette fonction est appelée DEUX FOIS pour une même figure : au build, pour le
 * rendu servi, et dans le navigateur quand la figure est rejouée au chargement.
 * D'où sa place ici plutôt que dans le composant.
 */
export function buildRays(field: Constellation): ConstellationRay[] {
  return field.stars.map((star, index) => ({
    star: index,
    depth: star.depth,
    x1: field.center.x,
    y1: field.center.y,
    x2: star.x,
    y2: star.y,
  }));
}

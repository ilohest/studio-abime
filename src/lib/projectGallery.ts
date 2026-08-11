import { stegaClean } from '@sanity/client/stega';
import type { Project, SanityImage } from './sanity/types';

/**
 * Visuels d'un projet, prêts à poser sur une grille.
 *
 * Partagé par les modèles de page qui montrent une planche d'images : ils en
 * dessinent la trame chacun à leur façon, mais lisent le même contenu et la
 * même règle de largeur.
 */
export interface GalleryItem {
  key: string;
  image: SanityImage;
  /** Nombre de colonnes demandé — à borner par la trame du modèle. */
  span: number;
  caption?: string;
}

/*
  Le couple `half`/`full` d'origine reste lisible : `full` visait toute la
  largeur, il vaut donc le maximum et se laissera borner par la trame.
*/
const SPANS: Record<string, number> = { '1': 1, '2': 2, '3': 3, half: 1, full: 3 };

export function projectGallery(project: Project): GalleryItem[] {
  const items = (project.gallery ?? []).filter((item) => Boolean(item.image?.asset));

  /* Chaque modèle a sa trame, donc son champ de largeur. */
  const wideTrame = stegaClean(project.template) === 'banner';

  if (items.length > 0) {
    return items.map((item) => ({
      key: item._key,
      image: item.image as SanityImage,
      /*
        `stegaClean` : en édition visuelle, Sanity glisse des caractères
        invisibles dans CHAQUE chaîne pour rendre le texte cliquable. Inoffensif
        dans du texte affiché, fatal dès qu'une valeur pilote un sélecteur — la
        valeur vaudrait « full + marqueurs » et ne correspondrait à aucune règle.
      */
      span: SPANS[stegaClean(wideTrame ? (item.spanWide ?? item.span) : item.span) ?? ''] ?? 1,
      caption: item.caption,
    }));
  }

  /*
    Sans visuel dans la planche, la vignette prend le relais : la page reste
    composée dès la création du projet, avant même que la planche soit montée.
  */
  if (project.thumbnail?.asset) {
    return [{ key: 'thumbnail', image: project.thumbnail, span: 3 }];
  }

  return [];
}

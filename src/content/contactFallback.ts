import type { Locale } from '~/i18n/config';
import type { ContactPage } from '~/lib/sanity/types';

/**
 * Page Contact de repli, tant que le singleton n'a pas été publié.
 *
 * Même rôle que `homeFallback`, `laboFallback` et `shopFallback` : la page doit
 * s'afficher sur un jeu de données neuf. Ce fichier devient inutile — et
 * supprimable — le jour où le document existe.
 *
 * Il ne porte plus de texte : le mot d'accueil est composé dans le plateau de
 * la première section, un fragment par case, et l'adresse e-mail vient des
 * réglages du site. Ne restent ici que la mention de bas de fiche et l'index,
 * tous deux facultatifs — d'où un repli vide, mais valide.
 */
export function getContactFallback(locale: Locale): ContactPage {
  return {
    _id: 'contactPage-fallback',
    _type: 'contactPage',
    language: locale,
  };
}

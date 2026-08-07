import type { Locale } from '~/i18n/config';
import type { Page, Section } from '~/lib/sanity/types';

/**
 * Contenu d'amorçage de la page d'accueil.
 *
 * Sert UNIQUEMENT tant qu'aucune page d'accueil n'est désignée dans Sanity :
 * le site est ainsi présentable avant même que le CMS soit alimenté, au lieu
 * de renvoyer un 404 sur sa propre racine.
 *
 * Dès qu'une page d'accueil est créée et désignée dans « Réglages du site »,
 * ce contenu n'est plus jamais rendu. Ce fichier peut alors être supprimé —
 * il n'est référencé qu'à un seul endroit (`src/pages/[...path].astro`).
 */
const sections: Record<string, Section[]> = {
  fr: [
    {
      _key: 'hero',
      _type: 'manifestoHero',
      metaLines: [
        { _key: 'par', label: 'Par', value: 'Studio Abime' },
        { _key: 'type', label: 'Type', value: 'Labo de Com' },
        { _key: 'mail', label: 'Mail', value: 'elodie@studioabime.com' },
        { _key: 'date', label: 'Date', autoDate: true },
      ],
      hypothesisLabel: 'HYPOTHÈSE',
      hypothesis: "communiquer, c'est relier des systèmes.",
      intentionLabel: "NOTE D'INTENTION",
      intention: [
        "Ce qu'on montre est toujours un choix, jamais un hasard.",
        'Autant le faire consciemment.',
      ],
      tagline:
        "Studio Abime est un labo de com et d'identités sensorielles qui naissent d'une plongée sous le visible.",
      showStamp: true,
    },
  ],
};

export function getHomeFallback(locale: Locale): Page | null {
  const localeSections = sections[locale] ?? sections.fr;
  if (!localeSections?.length) return null;

  return {
    _id: `home-fallback-${locale}`,
    _type: 'page',
    language: locale,
    title: 'Studio Abîme',
    slug: '',
    sections: localeSections,
  };
}

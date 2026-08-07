import etudeLune from '~/assets/sections/etude-lune.webp';
import papierLumiere from '~/assets/sections/papier-lumiere.webp';
import atelierBandes from '~/assets/sections/atelier-bandes.webp';

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
    {
      _key: 'services',
      _type: 'servicesMenu',
      groups: [
        {
          _key: 'g1',
          title: 'Labo de com',
          items: ['Recherche de Sens', 'Accompagnement', 'Audit'],
        },
        {
          _key: 'g2',
          title: 'Définition',
          items: ['Direction artistique', 'Conception rédaction'],
        },
        {
          _key: 'g3',
          title: 'Production',
          items: ['Identité sensorielle', 'Graphisme', 'Visuels', 'Rédaction'],
        },
        {
          _key: 'g4',
          title: 'Expansion',
          items: ['Déploiement', 'Ateliers & formations', 'Conférences', 'Outils de com'],
        },
      ],
    },
    {
      _key: 'statement',
      _type: 'studioStatement',
      statement:
        "Studio Abîme est un espace où on ne produit pas pour vous mais où on expérimente la communication ensemble. Un labo dans lequel on relie les outils et les langages qui font un projet. Son identité ne se regarde pas seulement. Elle se vit.",
      noteNumber: 'fig.04',
      note: "— On étudie la communication à l'échelle humaine : celle des sens, des émotions et des moyens réels dont un projet dispose.",
      marker: '94,65+50,65',
      figures: [
        {
          _key: 'f5',
          number: 'fig.05',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'left',
          fallbackImage: etudeLune,
        },
        {
          _key: 'f6',
          number: 'fig.06',
          caption: 'Compréhension de la constitution',
          span: 3,
          fallbackImage: papierLumiere,
        },
        {
          _key: 'f7',
          number: 'fig.07',
          caption: 'Compréhension de la constitution',
          span: 3,
          bleed: 'right',
          pushRight: true,
          fallbackImage: atelierBandes,
        },
      ],
      cta: {
        kind: 'external',
        label: 'Entrer dans le studio →',
        externalUrl: '/projets',
        openInNewTab: false,
      },
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

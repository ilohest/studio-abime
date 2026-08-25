import type { LaboPage } from '~/lib/sanity/types';
import type { Locale } from '~/i18n/config';

/** Contenu de repli tant que le singleton Labo n'a pas encore été publié. */
const fr: LaboPage = {
  _id: 'laboPage-fallback-fr',
  _type: 'laboPage',
  language: 'fr',
  title: 'Le Labo',
  eyebrow: 'La philosophie — un laboratoire créatif',
  philosophy: [
    'Studio Abîme est un laboratoire créatif parce qu’ici, on prend le temps de penser, de sentir et de relier.',
    'On n’y cherche pas des réponses rapides, mais une compréhension juste de ce qui est à l’œuvre dans un projet, une pratique, une traversée.',
    'Le laboratoire est un espace de recherche sensible. Un lieu où l’on explore le fond : l’intention, la posture, le regard, les récits que l’on porte consciemment ou non.',
    'Pour que ce qui prendra forme ensuite ne soit pas une façade, mais une traduction fidèle.',
    'Nous y explorons l’esthétique, le sensible, la symbolique et le réel pour aider chacun à devenir auteur de sa propre image, sans travestir qui il est. Créer devient alors un acte d’alignement. Voir devient un geste éthique.',
  ],
  whyTitle: 'Pourquoi un laboratoire',
  whyLead: 'Parce que la création, comme la transformation, demande un espace protégé. Un endroit où l’on peut :',
  principles: [
    'questionner sans devoir produire',
    'déconstruire sans se perdre',
    'faire émerger sans forcer',
  ],
  whyClosing: 'Dans le laboratoire, on observe, on écoute, on met à l’épreuve. On accepte le flou comme une étape nécessaire. On travaille avec ce qui est vivant et donc parfois instable.',
  servicesTitle: 'On y travaille',
  services: [
    {
      _key: 'direction-artistique',
      title: 'La direction artistique comme travail de fond',
      description: 'Clarifier une vision, un univers, une cohérence sensible avant toute production.',
    },
    {
      _key: 'identite-representation',
      title: 'L’identité et la représentation',
      description: 'Ce que l’on montre, ce que l’on raconte, la manière dont on se rend visible.',
    },
    {
      _key: 'gestation',
      title: 'Les projets en gestation',
      description: 'Donner un cadre à ce qui cherche à naître : entreprise, œuvre, pratique, parole.',
    },
    {
      _key: 'regard',
      title: 'Les pratiques du regard',
      description: 'Photographes, artistes, architectes, créateur·ices : accompagner celles et ceux qui travaillent avec des visions.',
    },
    {
      _key: 'traversees',
      title: 'Les traversées personnelles',
      description: 'Moments de bascule, de deuil, de transformation, où il est nécessaire de remettre du sens avant de redonner forme.',
    },
    {
      _key: 'collectif',
      title: 'La pensée collective',
      description: 'Cercles, échanges, écriture, mise en commun : pour que la recherche ne reste pas solitaire.',
    },
  ],
  note: 'Chaque accompagnement se construit sur mesure, en fonction du moment, du besoin et du rythme.',
  closingLines: [
    'Ce qui doit prendre forme ne se décide pas à la surface, il se révèle en profondeur.',
    'Ici, l’image n’est pas un vernis : elle devient une réponse.',
    'Le fond précède la forme. Toujours.',
    'Quand le fond est clarifié, la forme devient possible. Le laboratoire prépare le terrain.',
  ],
  cta: {
    kind: 'external',
    label: 'Donner forme',
    externalUrl: '/contact',
    openInNewTab: false,
  },
  archiveTitle: 'Archives',
  archiveProjects: [],
};

export function getLaboFallback(locale: Locale): LaboPage {
  return { ...fr, language: locale, _id: `laboPage-fallback-${locale}` };
}

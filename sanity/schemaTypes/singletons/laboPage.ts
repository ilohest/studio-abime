import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField, sameLanguageFilter } from '../../lib/i18n';

/**
 * Page Labo : une narration volontairement structurée, plutôt qu'un assemblage
 * libre de blocs. Les champs suivent l'ordre de lecture de la composition.
 */
export const laboPage = defineType({
  name: 'laboPage',
  title: 'Page Labo',
  type: 'document',
  initialValue: {
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
    principles: ['questionner sans devoir produire', 'déconstruire sans se perdre', 'faire émerger sans forcer'],
    whyClosing: 'Dans le laboratoire, on observe, on écoute, on met à l’épreuve. On accepte le flou comme une étape nécessaire. On travaille avec ce qui est vivant et donc parfois instable.',
    servicesTitle: 'On y travaille',
    services: [
      { _key: 'direction-artistique', _type: 'laboService', title: 'La direction artistique comme travail de fond', description: 'Clarifier une vision, un univers, une cohérence sensible avant toute production.' },
      { _key: 'identite-representation', _type: 'laboService', title: 'L’identité et la représentation', description: 'Ce que l’on montre, ce que l’on raconte, la manière dont on se rend visible.' },
      { _key: 'gestation', _type: 'laboService', title: 'Les projets en gestation', description: 'Donner un cadre à ce qui cherche à naître : entreprise, œuvre, pratique, parole.' },
      { _key: 'regard', _type: 'laboService', title: 'Les pratiques du regard', description: 'Photographes, artistes, architectes, créateur·ices : accompagner celles et ceux qui travaillent avec des visions.' },
      { _key: 'traversees', _type: 'laboService', title: 'Les traversées personnelles', description: 'Moments de bascule, de deuil, de transformation, où il est nécessaire de remettre du sens avant de redonner forme.' },
      { _key: 'collectif', _type: 'laboService', title: 'La pensée collective', description: 'Cercles, échanges, écriture, mise en commun : pour que la recherche ne reste pas solitaire.' },
    ],
    note: 'Chaque accompagnement se construit sur mesure, en fonction du moment, du besoin et du rythme.',
    closingLines: [
      'Ce qui doit prendre forme ne se décide pas à la surface, il se révèle en profondeur.',
      'Ici, l’image n’est pas un vernis : elle devient une réponse.',
      'Le fond précède la forme. Toujours.',
      'Quand le fond est clarifié, la forme devient possible. Le laboratoire prépare le terrain.',
    ],
    cta: { _type: 'link', kind: 'external', label: 'Donner forme', externalUrl: '/contact', openInNewTab: false },
    archiveTitle: 'Archives',
    archiveProjects: [],
  },
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'archive', title: 'Archives' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      group: 'content',
      initialValue: 'Le Labo',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Sur-titre',
      type: 'string',
      group: 'content',
      initialValue: 'La philosophie — un laboratoire créatif',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'philosophy',
      title: 'Philosophie',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'text', rows: 4 })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'whyTitle',
      title: 'Titre « Pourquoi »',
      type: 'string',
      group: 'content',
      initialValue: 'Pourquoi un laboratoire',
    }),
    defineField({ name: 'whyLead', title: 'Introduction', type: 'text', rows: 3, group: 'content' }),
    defineField({
      name: 'principles',
      title: 'Principes',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.max(6),
    }),
    defineField({ name: 'whyClosing', title: 'Conclusion', type: 'text', rows: 4, group: 'content' }),
    defineField({
      name: 'servicesTitle',
      title: 'Titre des champs de recherche',
      type: 'string',
      group: 'content',
      initialValue: 'On y travaille',
    }),
    defineField({
      name: 'services',
      title: 'Champs de recherche',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          name: 'laboService',
          title: 'Champ de recherche',
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Titre', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 3, validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: 'title', subtitle: 'description' } },
        }),
      ],
      validation: (rule) => rule.required().min(1).max(8),
    }),
    defineField({ name: 'note', title: 'Note d’accompagnement', type: 'text', rows: 3, group: 'content' }),
    defineField({
      name: 'closingLines',
      title: 'Manifeste de conclusion',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: 'cta', title: 'Appel à l’action', type: 'link', group: 'content' }),
    defineField({
      name: 'archiveTitle',
      title: 'Titre de l’archive',
      type: 'string',
      group: 'archive',
      initialValue: 'Archives',
    }),
    defineField({
      name: 'archiveProjects',
      title: 'Projets de l’archive (ancien champ)',
      type: 'array',
      group: 'archive',
      description:
        'Remplacé par la case « Projet favori » de la fiche projet : les 6 premiers favoris sont désormais affichés ici. Ce champ n’est plus lu.',
      deprecated: {
        reason: 'Remplacé par la case « Projet favori » de la fiche projet.',
      },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'project' }],
          options: { filter: sameLanguageFilter },
        }),
      ],
      validation: (rule) => [rule.max(6), rule.unique()],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: {
    select: { language: 'language' },
    prepare: ({ language }) => ({ title: 'Page Labo', subtitle: language?.toUpperCase() ?? '—' }),
  },
});

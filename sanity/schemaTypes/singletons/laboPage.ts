import { defineArrayMember, defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

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
      { _key: 'ouverture', _type: 'laboParagraph', layout: 'pleine', text: 'Un labo de com, car avant de donner naissance à de nouvelles visions, il faut les expérimenter.' },
      { _key: 'destinataires', _type: 'laboParagraph', layout: 'pleine', text: 'Celles et ceux qui gardent la foi en une version de demain plus apaisée et sont prêt·e·s à revoir leur façon de communiquer. On n’a pas de solution toute faite à proposer, plutôt l’envie de consolider vos fondations, ensemble. Un virage doux, pas une rupture.' },
      { _key: 'recherche-sensible', _type: 'laboParagraph', layout: 'colonne', text: 'Le laboratoire est un espace de recherche sensible. Un lieu où l’on explore le fond : l’intention, la posture, le regard, les récits que l’on porte consciemment ou non.' },
      { _key: 'traduction-fidele', _type: 'laboParagraph', layout: 'pleine', text: 'Pour que ce qui prendra forme ensuite ne soit pas une façade, mais une traduction fidèle. Nous y explorons l’esthétique, le sensible, la symbolique et le réel pour aider chacun à devenir auteur de sa propre image, sans travestir qui il est. Créer devient alors un acte d’alignement. Voir devient un geste éthique.' },
      { _key: 'racine-devenir', _type: 'laboParagraph', layout: 'colonne', text: 'Une vision qui s’épanouit entre racine et devenir, qui décode pour mieux recoder. Le geste n’est pas de rejeter le passé, mais de le comprendre, et de questionner la pertinence de chaque choix visible pour qu’il construise un nouveau demain plus humain.' },
      { _key: 'regard-systemique', _type: 'laboParagraph', layout: 'colonne', text: 'Notre regard est systémique : on ne travaille pas des éléments séparés, mais ce qui les relie. Un nom, un texte, une image ne tiennent pas ensemble s’ils sont pensés chacun de leur côté. Ils tiennent s’ils s’engagent dans la même direction. Un système où tout dépend de tout peut s’effondrer. Alors au studio, on privilégie celui dont les parties se répondent sans se tenir en otage. C’est pourquoi on travaille à votre autonomie.' },
      { _key: 'sobriete', _type: 'laboParagraph', layout: 'declaration', text: 'L’optique choisie est la sobriété. On s’appuie sur vos ressources disponibles et pas sur celles qu’il faudrait avoir, tout en réfléchissant à celles qu’il serait judicieux de développer. On vous aide à trouver des solutions alternatives et on ne produit que lorsque c’est véritablement nécessaire.' },
      { _key: 'collectif', _type: 'laboParagraph', layout: 'colonne', text: 'Et durant toute la traversée, on ne vous laisse pas avancer seul·e. On partage avec vous notre réseau de partenaires de confiance, on s’appuie sur ce en quoi on croit le plus : le collectif.' },
    ],
    servicesTitle: 'On y travaille',
    teamTitle: 'L’équipe',
    teamLead: 'Studio Abîme n’est ni une personne ni une agence. C’est un lieu de travail que des humain·e·s ont choisi, parce qu’on y partage la même conviction : plonger sous le visible pour mieux s’ancrer. On y cherche des solutions ensemble, car c’est comme ça qu’on va plus loin.',
    teamBody: 'Parfois les projets ne nécessitent qu’une personne, parfois plusieurs. On ne se rencontre pas forcément autour d’un même nom mais on s’épaule pour construire des projets solides. On se réunit autour de ce qu’une histoire demande en partageant les ressources et l’expérience que chacun peut lui offrir.',
    foundationTitle: 'Note de fondation',
    foundationParagraphs: [
      'J’ai ouvert Studio Abîme parce qu’il me manquait un endroit comme celui-là. Un lieu où, dans un monde qui vise sans cesse la performance et la rapidité, on a le droit de prendre le temps de comprendre un projet avant de le mettre en forme, et où l’on peut travailler avec ce qu’on a plutôt que sous la pression de ce qu’on n’a pas.',
      'Qui accueille la pluralité des regards avec curiosité en première intention et non le jugement qui accompagne la peur du changement.',
      'Un lieu où je n’aurais pas à travailler seule pour autant. Sans la trouille qu’on me prenne ma place. Dans lequel il existe une place pour poser les briques d’une autre vision du collectif et du monde de demain.',
      'Je ne sais pas jusqu’où il ira. Il existe maintenant, et il ne m’appartient plus tout à fait.',
    ],
    foundationSignature: 'Élodie',
    services: [
      {
        _key: 'questionner-histoire',
        _type: 'laboService',
        title: 'Questionner l’histoire',
        description: 'Une histoire qui captive est celle dont la 4e de couverture nous emporte avant même d’avoir ouvert le livre et dont on se remémore le titre. On enquête à travers les strates de votre parcours pour en extraire la substance nécessaire à la construction d’une trame narrative qui touchera son lectorat.',
        tools: ['Audit', 'Gestion des ressources', 'Pose de la trame'],
      },
      {
        _key: 'composer-recit',
        _type: 'laboService',
        title: 'Composer le récit',
        description: 'Une fois cette trame pensée et le titre posé, on tisse le lien entre les concepts qui composent votre projet et les mots qui l’incarneront pour gagner en clarté. Du nom de votre projet à la manière dont il se raconte. Toujours main dans la main, on coécrit votre récit.',
        tools: ['Stratégie de marque', 'Naming', 'Conceptualisation', 'Rédaction'],
      },
      {
        _key: 'traduire-formes',
        _type: 'laboService',
        title: 'Traduire en formes',
        description: 'C’est le pivot central entre la conceptualisation du fond et la forme. On vous guide vers la phase de production en structurant les besoins et en établissant une liste des ressources nécessaires à la production de votre communication.',
        tools: ['Stratégie de com', 'Direction artistique'],
      },
      {
        _key: 'produire-besoins',
        _type: 'laboService',
        title: 'Produire selon les besoins',
        description: 'Après réflexion des besoins, on produit vos matériaux de com en cohérence avec le fond de votre projet, mêlant digital et analogique. On vous aiguille vers la personne la plus outillée pour vous y aider.',
        tools: ['Identité visuelle', 'Photographie', 'Site', 'Matériaux de com divers'],
      },
      {
        _key: 'donner-vie',
        _type: 'laboService',
        title: 'Donner vie et transmettre',
        description: 'Parce qu’on ne conçoit pas une communication sans l’extraire d’un schéma de dépendance, on veille à mettre en place un système d’accompagnement qui vise votre autonomie. Votre voix mérite d’être entendue.',
        tools: ['Mentoring', 'Formations en com', 'Accompagnement dans la construction de vos réseaux'],
      },
    ],
    note: 'Chaque accompagnement se construit sur mesure, en fonction du moment, du besoin et du rythme.',
  },
  groups: [
    { name: 'content', title: 'Contenu', default: true },
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
      description:
        'Le premier paragraphe est la citation d’ouverture. Les suivants se composent soit sur toute la largeur, soit sur une colonne étroite alignée à droite.',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          name: 'laboParagraph',
          title: 'Paragraphe',
          type: 'object',
          fields: [
            defineField({ name: 'text', title: 'Texte', type: 'text', rows: 4, validation: (rule) => rule.required() }),
            defineField({
              name: 'layout',
              title: 'Largeur',
              type: 'string',
              initialValue: 'pleine',
              options: {
                list: [
                  { title: 'Pleine largeur', value: 'pleine' },
                  { title: 'Colonne alignée à droite', value: 'colonne' },
                  { title: 'Pleine largeur, grand corps', value: 'declaration' },
                ],
                layout: 'radio',
              },
            }),
          ],
          preview: { select: { title: 'text', subtitle: 'layout' } },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
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
            defineField({
              name: 'tools',
              title: 'Prestations',
              description: 'Listées sous la description, séparées par un point médian.',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              validation: (rule) => rule.max(6),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'description' } },
        }),
      ],
      validation: (rule) => rule.required().min(1).max(8),
    }),
    defineField({ name: 'note', title: 'Note d’accompagnement', type: 'text', rows: 3, group: 'content' }),
    defineField({
      name: 'teamTitle',
      title: 'Titre « L’équipe »',
      type: 'string',
      group: 'content',
      initialValue: 'L’équipe',
    }),
    defineField({ name: 'teamLead', title: 'Ouverture de l’équipe', type: 'text', rows: 5, group: 'content' }),
    defineField({ name: 'teamBody', title: 'Texte de l’équipe', type: 'text', rows: 5, group: 'content' }),
    defineField({
      name: 'foundationTitle',
      title: 'Titre de la note de fondation',
      type: 'string',
      group: 'content',
      initialValue: 'Note de fondation',
    }),
    defineField({
      name: 'foundationImage',
      title: 'Image de la note de fondation',
      description: 'Petite image posée à gauche de la note. Portrait ou détail, format vertical de préférence.',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    defineField({
      name: 'foundationParagraphs',
      title: 'Note de fondation',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'text', rows: 4 })],
    }),
    defineField({
      name: 'foundationSignature',
      title: 'Signature',
      type: 'string',
      group: 'content',
      initialValue: 'Élodie',
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: {
    select: { language: 'language' },
    prepare: ({ language }) => ({ title: 'Page Labo', subtitle: language?.toUpperCase() ?? '—' }),
  },
});

import type { LaboPage } from '~/lib/sanity/types';
import type { Locale } from '~/i18n/config';

/** Contenu de repli tant que le singleton Labo n'a pas encore été publié. */
const fr: LaboPage = {
  _id: 'laboPage-fallback-fr',
  _type: 'laboPage',
  language: 'fr',
  title: 'Le Labo',
  /*
    Le premier paragraphe est la citation d'ouverture ; les suivants portent
    leur largeur de composition — pleine page, ou colonne étroite alignée à
    droite comme une note de marge.
  */
  philosophy: [
    {
      _key: 'ouverture',
      layout: 'pleine',
      text: 'Un labo de com, car avant de donner naissance à de nouvelles visions, il faut les expérimenter.',
    },
    {
      _key: 'destinataires',
      layout: 'pleine',
      text: 'Celles et ceux qui gardent la foi en une version de demain plus apaisée et sont prêt·e·s à revoir leur façon de communiquer. On n’a pas de solution toute faite à proposer, plutôt l’envie de consolider vos fondations, ensemble. Un virage doux, pas une rupture.',
    },
    {
      _key: 'recherche-sensible',
      layout: 'colonne',
      text: 'Le laboratoire est un espace de recherche sensible. Un lieu où l’on explore le fond : l’intention, la posture, le regard, les récits que l’on porte consciemment ou non.',
    },
    {
      _key: 'traduction-fidele',
      layout: 'pleine',
      text: 'Pour que ce qui prendra forme ensuite ne soit pas une façade, mais une traduction fidèle. Nous y explorons l’esthétique, le sensible, la symbolique et le réel pour aider chacun à devenir auteur de sa propre image, sans travestir qui il est. Créer devient alors un acte d’alignement. Voir devient un geste éthique.',
    },
    {
      _key: 'racine-devenir',
      layout: 'colonne',
      text: 'Une vision qui s’épanouit entre racine et devenir, qui décode pour mieux recoder. Le geste n’est pas de rejeter le passé, mais de le comprendre, et de questionner la pertinence de chaque choix visible pour qu’il construise un nouveau demain plus humain.',
    },
    {
      _key: 'regard-systemique',
      layout: 'colonne',
      text: 'Notre regard est systémique : on ne travaille pas des éléments séparés, mais ce qui les relie. Un nom, un texte, une image ne tiennent pas ensemble s’ils sont pensés chacun de leur côté. Ils tiennent s’ils s’engagent dans la même direction. Un système où tout dépend de tout peut s’effondrer. Alors au studio, on privilégie celui dont les parties se répondent sans se tenir en otage. C’est pourquoi on travaille à votre autonomie.',
    },
    {
      _key: 'sobriete',
      layout: 'declaration',
      text: 'L’optique choisie est la sobriété. On s’appuie sur vos ressources disponibles et pas sur celles qu’il faudrait avoir, tout en réfléchissant à celles qu’il serait judicieux de développer. On vous aide à trouver des solutions alternatives et on ne produit que lorsque c’est véritablement nécessaire.',
    },
    {
      _key: 'collectif',
      layout: 'colonne',
      text: 'Et durant toute la traversée, on ne vous laisse pas avancer seul·e. On partage avec vous notre réseau de partenaires de confiance, on s’appuie sur ce en quoi on croit le plus : le collectif.',
    },
  ],
  /*
    Les cinq étapes se lisent dans l'ordre : chacune reprend là où la
    précédente s'arrête. Cet ordre est aussi celui des orbites de l'en-tête.
  */
  services: [
    {
      _key: 'questionner-histoire',
      title: 'Questionner l’histoire',
      description: 'Une histoire qui captive est celle dont la 4e de couverture nous emporte avant même d’avoir ouvert le livre et dont on se remémore le titre. On enquête à travers les strates de votre parcours pour en extraire la substance nécessaire à la construction d’une trame narrative qui touchera son lectorat.',
      tools: ['Audit', 'Gestion des ressources', 'Pose de la trame'],
    },
    {
      _key: 'composer-recit',
      title: 'Composer le récit',
      description: 'Une fois cette trame pensée et le titre posé, on tisse le lien entre les concepts qui composent votre projet et les mots qui l’incarneront pour gagner en clarté. Du nom de votre projet à la manière dont il se raconte. Toujours main dans la main, on coécrit votre récit.',
      tools: ['Stratégie de marque', 'Naming', 'Conceptualisation', 'Rédaction'],
    },
    {
      _key: 'traduire-formes',
      title: 'Traduire en formes',
      description: 'C’est le pivot central entre la conceptualisation du fond et la forme. On vous guide vers la phase de production en structurant les besoins et en établissant une liste des ressources nécessaires à la production de votre communication.',
      tools: ['Stratégie de com', 'Direction artistique'],
    },
    {
      _key: 'produire-besoins',
      title: 'Produire selon les besoins',
      description: 'Après réflexion des besoins, on produit vos matériaux de com en cohérence avec le fond de votre projet, mêlant digital et analogique. On vous aiguille vers la personne la plus outillée pour vous y aider.',
      tools: ['Identité visuelle', 'Photographie', 'Site', 'Matériaux de com divers'],
    },
    {
      _key: 'donner-vie',
      title: 'Donner vie et transmettre',
      description: 'Parce qu’on ne conçoit pas une communication sans l’extraire d’un schéma de dépendance, on veille à mettre en place un système d’accompagnement qui vise votre autonomie. Votre voix mérite d’être entendue.',
      tools: ['Mentoring', 'Formations en com', 'Accompagnement dans la construction de vos réseaux'],
    },
  ],
  note: 'Chaque accompagnement se construit sur mesure, en fonction du moment, du besoin et du rythme.',
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
  archiveProjects: [],
};

export function getLaboFallback(locale: Locale): LaboPage {
  return { ...fr, language: locale, _id: `laboPage-fallback-${locale}` };
}

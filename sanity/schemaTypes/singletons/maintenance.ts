import { defineField, defineType } from 'sanity';

/**
 * ÉCRAN DE MAINTENANCE — l'interrupteur qui masque le site.
 *
 * Document singleton GLOBAL (`_id: "maintenance"`), volontairement hors du
 * système de traduction : masquer le site n'est pas un geste éditorial par
 * langue, c'est un état du site entier.
 *
 * Ce que l'interrupteur déclenche réellement (voir `src/lib/maintenance.ts`) :
 * activé, chaque page est servie à la demande et interceptée par
 * `src/middleware.ts`, qui répond l'écran de maintenance en 503 tant qu'aucun
 * mot de passe valide n'a été fourni. Désactivé, le site retrouve son rendu
 * 100 % statique, sans le moindre coût de fonctionnement.
 *
 * Conséquence directe : l'état est lu AU BUILD, pas à chaque visite. Publier
 * déclenche le webhook de reconstruction (README § Déploiement) et le site
 * bascule quelques minutes plus tard. C'est le prix d'un site statique — et
 * c'est aussi ce qui garantit qu'un site en ligne ne paie rien pour un
 * interrupteur qui reste éteint toute l'année.
 *
 * Le mot de passe ne vit PAS ici : le contenu de ce document est lisible
 * publiquement par l'API de Sanity, comme tout le reste du dataset. Il est posé
 * en variable d'environnement `MAINTENANCE_PASSWORD` côté hébergement.
 */
export const maintenance = defineType({
  name: 'maintenance',
  title: 'Écran de maintenance',
  type: 'document',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Masquer le site derrière l’écran de maintenance',
      type: 'boolean',
      initialValue: false,
      description:
        'Activé, les visiteurs ne voient plus que l’écran ci-dessous ; seules les personnes qui connaissent le mot de passe accèdent au site. La bascule prend effet quelques minutes après avoir cliqué sur « Publish », le temps que le site se reconstruise.',
    }),

    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      description: 'La phrase d’accueil, en grand. Trois ou quatre mots suffisent.',
      placeholder: 'Nous revenons très vite.',
      validation: (rule) => rule.max(80).warning('Au-delà de 80 signes, le titre perd sa force.'),
    }),

    defineField({
      name: 'message',
      title: 'Le mot aux visiteurs',
      type: 'text',
      rows: 4,
      description:
        'Ce que voit une personne arrivée là par hasard : pourquoi le site est fermé, et quand il rouvre.',
      placeholder:
        'Le site du Studio Abîme se prépare. Nous plongeons encore un peu, et nous remontons très vite.',
      validation: (rule) => rule.max(400).warning('Au-delà de 400 signes, on ne lit plus.'),
    }),

    defineField({
      name: 'signature',
      title: 'Signature',
      type: 'string',
      description: 'La ligne posée en bas de la feuille. Laissée vide, rien ne s’affiche.',
      placeholder: 'Studio Abîme',
    }),
  ],

  preview: {
    select: { enabled: 'enabled', title: 'title' },
    prepare: ({ enabled, title }) => ({
      title: 'Écran de maintenance',
      subtitle: enabled
        ? `Site masqué${title ? ` — « ${title} »` : ''}`
        : 'Éteint — le site est visible de tous',
    }),
  },
});

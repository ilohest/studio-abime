import { defineField, defineType } from 'sanity';
import type { ConditionalPropertyCallback } from '@sanity/types';

/**
 * Réglages propres à chaque modèle de page projet.
 *
 * Les champs sont masqués selon le modèle sélectionné : l'éditeur ne voit
 * jamais une option qui ne s'applique pas. On évite ainsi de multiplier les
 * types de documents « projet immersif », « projet éditorial », etc. — un seul
 * type de document reste interrogeable de façon homogène.
 */
const forTemplate =
  (...templates: string[]): ConditionalPropertyCallback =>
  ({ document }) =>
    !templates.includes((document?.template as string | undefined) ?? 'standard');

export const projectTemplateOptions = defineType({
  name: 'projectTemplateOptions',
  title: 'Options du modèle',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    /* Immersif */
    defineField({
      name: 'accent',
      title: 'Couleur d’accent',
      type: 'string',
      initialValue: 'lumiere',
      options: {
        list: [
          { value: 'lumiere', title: 'Lumière' },
          { value: 'ciel', title: 'Ciel' },
          { value: 'sable', title: 'Sable' },
          { value: 'papier', title: 'Papier d’archive' },
        ],
      },
      description: 'Teinte utilisée pour les titres et les détails sur fond sombre.',
      hidden: forTemplate('immersive'),
    }),
    defineField({
      name: 'coverVideoUrl',
      title: 'Vidéo de couverture',
      type: 'url',
      description: 'Fichier .mp4 en lecture automatique et muette. Remplace la couverture fixe.',
      validation: (rule) => rule.uri({ scheme: ['https'] }),
      hidden: true,
      deprecated: { reason: 'Le champ est désormais disponible dans l’onglet Contenu.' },
    }),

    /* Éditorial */
    defineField({
      name: 'showMarginNotes',
      title: 'Afficher les annotations en marge',
      type: 'boolean',
      initialValue: true,
      hidden: forTemplate('editorial'),
    }),

  ],
});

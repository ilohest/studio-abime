import { defineField, defineType } from 'sanity';

/**
 * Menu principal — visuel à gauche, navigation numérotée à droite.
 *
 * Cette section joue aussi le rôle de MENU : au défilement, le visuel sort par
 * la gauche et la colonne des prestations vient s'ancrer sur le bord gauche.
 * L'animation est portée par le composant ; le CMS ne pilote que le contenu.
 *
 * La structure de navigation est pilotée par le site : seul le visuel se règle
 * ici.
 */
export const servicesMenu = defineType({
  name: 'servicesMenu',
  title: 'Menu principal',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Visuel',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
  ],
  preview: {
    select: { media: 'image' },
    prepare: ({ media }) => ({
      title: 'Menu principal',
      subtitle: 'Navigation du site',
      media,
    }),
  },
});

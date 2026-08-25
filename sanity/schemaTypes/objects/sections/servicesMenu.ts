import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Menu principal — visuel à gauche, navigation numérotée à droite.
 *
 * Cette section joue aussi le rôle de MENU : au défilement, le visuel sort par
 * la gauche et la colonne des prestations vient s'ancrer sur le bord gauche.
 * L'animation est portée par le composant ; le CMS ne pilote que le contenu.
 *
 * La structure de navigation est désormais pilotée par le site. L'ancien
 * contenu des groupes reste conservé ci-dessous pour ne perdre aucune donnée.
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
      description: 'Colonne de gauche. Vide = visuel livré avec le site.',
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    defineField({
      name: 'groups',
      title: 'Ancienne liste de services',
      type: 'array',
      deprecated: {
        reason: 'La navigation principale est maintenant structurelle et gérée par le site.',
      },
      readOnly: true,
      hidden: ({ value }) => value === undefined,
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Intitulé',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'items',
              title: 'Prestations',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              validation: (rule) => rule.min(1),
            }),
          ],
          preview: {
            select: { title: 'title', items: 'items' },
            prepare: ({ title, items }) => ({
              title,
              subtitle: (items ?? []).join(' · '),
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { groups: 'groups', media: 'image' },
    prepare: ({ groups, media }) => ({
      title: 'Menu principal',
      subtitle: groups?.length ? 'Ancienne liste conservée' : 'Navigation du site',
      media,
    }),
  },
});

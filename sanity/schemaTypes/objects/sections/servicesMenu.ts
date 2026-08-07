import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Menu des services — visuel à gauche, prestations numérotées à droite.
 *
 * Cette section joue aussi le rôle de MENU : au défilement, le visuel sort par
 * la gauche et la colonne des prestations vient s'ancrer sur le bord gauche.
 * L'animation est portée par le composant ; le CMS ne pilote que le contenu.
 *
 * Les numéros (01, 02…) sont générés à l'affichage depuis l'ordre des groupes :
 * réordonner ne demande donc aucune renumérotation manuelle.
 */
export const servicesMenu = defineType({
  name: 'servicesMenu',
  title: 'Menu des services',
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
      title: 'Pôles',
      type: 'array',
      validation: (rule) => rule.min(1),
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
      title: 'Menu des services',
      subtitle: `${groups?.length ?? 0} pôle(s)`,
      media,
    }),
  },
});

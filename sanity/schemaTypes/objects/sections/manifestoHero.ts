import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Hero « manifeste » — l'en-tête de la page d'accueil.
 *
 * Reproduit une double page imprimée : mentions dactylographiées à gauche,
 * logo à droite, pli central. La MISE EN PAGE est figée dans le composant
 * (c'est une direction artistique, pas un gabarit) ; seuls les TEXTES sont
 * éditables ici.
 */
export const manifestoHero = defineType({
  name: 'manifestoHero',
  title: 'Hero — manifeste',
  type: 'object',
  groups: [
    { name: 'header', title: 'En-tête', default: true },
    { name: 'body', title: 'Textes' },
    { name: 'art', title: 'Direction artistique' },
  ],
  fields: [
    /* ── Bloc de mentions, en haut à gauche ─────────────────────────────── */
    defineField({
      name: 'metaLines',
      title: 'Mentions',
      type: 'array',
      group: 'header',
      description: 'Le bloc dactylographié en haut à gauche (Par, Type, Mail, Date…).',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Intitulé',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Valeur',
              type: 'string',
              hidden: ({ parent }) => Boolean(parent?.autoDate),
            }),
            defineField({
              name: 'autoDate',
              title: 'Date du jour (automatique)',
              type: 'boolean',
              initialValue: false,
              description: 'Remplace la valeur par la date du jour, formatée selon la langue.',
            }),
          ],
          preview: {
            select: { label: 'label', value: 'value', autoDate: 'autoDate' },
            prepare: ({ label, value, autoDate }) => ({
              title: label,
              subtitle: autoDate ? '(date automatique)' : value,
            }),
          },
        }),
      ],
    }),

    /* ── Corps de texte ─────────────────────────────────────────────────── */
    defineField({
      name: 'hypothesisLabel',
      title: 'Intitulé de l’hypothèse',
      type: 'string',
      group: 'body',
      initialValue: 'HYPOTHÈSE',
    }),
    defineField({
      name: 'hypothesis',
      title: 'Hypothèse',
      type: 'text',
      rows: 2,
      group: 'body',
    }),
    defineField({
      name: 'intentionLabel',
      title: 'Intitulé de la note',
      type: 'string',
      group: 'body',
      initialValue: 'NOTE D’INTENTION',
    }),
    defineField({
      name: 'intention',
      title: 'Note d’intention',
      type: 'array',
      group: 'body',
      description: 'Un paragraphe par entrée.',
      of: [defineArrayMember({ type: 'text', rows: 2 })],
    }),
    defineField({
      name: 'tagline',
      title: 'Signature',
      type: 'text',
      rows: 2,
      group: 'body',
      description: 'Phrase de présentation, en bas à droite sous le logo.',
    }),

    /* ── Direction artistique ───────────────────────────────────────────── */
    defineField({
      name: 'background',
      title: 'Texture de fond',
      type: 'image',
      group: 'art',
      description:
        'Papier utilisé en fond. Vide = texture de la charte livrée avec le site.',
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
    }),
    defineField({
      name: 'showStamp',
      title: 'Afficher le tampon',
      type: 'boolean',
      group: 'art',
      initialValue: true,
    }),
  ],
  preview: {
    select: { hypothesis: 'hypothesis', media: 'background' },
    prepare: ({ hypothesis, media }) => ({
      title: 'Hero — manifeste',
      subtitle: hypothesis,
      media,
    }),
  },
});

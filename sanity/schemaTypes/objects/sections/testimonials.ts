import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Témoignages — UN SEUL À L'ÉCRAN, choisi parmi ceux qui sont saisis.
 *
 * ── Pourquoi une bascule plutôt qu'un tri ──────────────────────────────────
 * Les témoignages s'accumulent : on en reçoit un, on veut le mettre en avant,
 * mais on ne veut pas perdre le précédent. Sans bascule, le seul geste
 * disponible est de SUPPRIMER — et le texte est perdu avec.
 *
 * On garde donc toute la collection, et une case décide de celui qui paraît.
 * C'est le même parti que le « Projet favori » de la fiche projet : le contenu
 * reste, l'affichage se choisit.
 *
 * ── Un seul, pas plusieurs ─────────────────────────────────────────────────
 * La composition tient UN témoignage, coupé en deux colonnes. En cocher deux
 * n'affiche pas deux blocs : le rendu prend le premier coché. La validation le
 * dit, en AVERTISSEMENT et non en erreur — la case est un geste d'affichage,
 * elle ne doit pas bloquer la publication d'une page pour autant.
 */
export const testimonials = defineType({
  name: 'testimonials',
  title: 'Témoignage',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Mention de section',
      type: 'string',
      description:
        'Petite mention en tête de section. Laisser vide pour n’en afficher aucune.',
    }),
    defineField({
      name: 'entries',
      title: 'Témoignages',
      description:
        'Cochez « Afficher celui-ci » sur celui qui doit paraître. Les autres restent en réserve, sans être publiés.',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'testimonial',
          title: 'Témoignage',
          type: 'object',
          fields: [
            defineField({
              name: 'quote',
              title: 'Texte',
              type: 'text',
              rows: 8,
              description:
                'Le texte se répartit tout seul sur deux colonnes : ne pas couper à la main.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'author',
              title: 'Signature',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'role',
              title: 'Fonction, structure',
              type: 'string',
              description: 'Affiché sous la signature. Facultatif.',
            }),
            defineField({
              name: 'active',
              title: 'Afficher celui-ci',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { quote: 'quote', author: 'author', role: 'role', active: 'active' },
            prepare: ({ quote, author, role, active }) => ({
              // La coche se lit dans la liste repliée : c'est là qu'on choisit.
              title: `${active ? '● ' : '○ '}${author ?? 'Sans signature'}`,
              subtitle: [role, quote].filter(Boolean).join(' — '),
            }),
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((entries?: Array<{ active?: boolean }>) => {
          if (!entries || entries.length === 0) return true;

          const shown = entries.filter((entry) => entry?.active).length;
          if (shown === 0) {
            return 'Aucun témoignage coché : la section ne s’affichera pas.';
          }
          if (shown > 1) {
            return `${shown} témoignages cochés : seul le premier paraîtra.`;
          }
          return true;
        }).warning(),
    }),
  ],
  preview: {
    select: { entries: 'entries' },
    prepare: ({ entries }) => {
      const list = (entries ?? []) as Array<{ author?: string; active?: boolean }>;
      const shown = list.find((entry) => entry?.active);

      return {
        title: 'Témoignage',
        subtitle: shown
          ? `${shown.author ?? 'Sans signature'} — ${list.length} en réserve`
          : `Aucun coché — ${list.length} en réserve`,
      };
    },
  },
});

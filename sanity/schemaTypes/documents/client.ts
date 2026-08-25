import { defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/**
 * Client sans page projet.
 *
 * Ces références complètent la table des éléments de la page Expériences après
 * les projets favoris, et composent à elles seules sa note de bas de page.
 *
 * ┌─ Ordre ─────────────────────────────────────────────────────────────────┐
 * │ Les clients occupent les cases dans leur ORDRE D'ENCODAGE : le premier   │
 * │ créé prend la première case libre. Aucun champ à remplir, aucun rang à   │
 * │ maintenir — mais réordonner impose de recréer une fiche. La liste du     │
 * │ back-office est triée de la même façon : ce que l'éditeur voit est ce    │
 * │ qui remplit le tableau.                                                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  fields: [
    languageField,
    defineField({
      name: 'name',
      title: 'Nom du client',
      type: 'string',
      description: 'Son initiale devient le symbole de la case dans la table des éléments.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sector',
      title: 'Secteur',
      type: 'string',
      description:
        'Domaine d’activité — ex. Gastronomie, Édition, Musique. Affiché sous l’initiale, à la place du mot « élément ».',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'projectName',
      title: 'Nom du projet',
      type: 'string',
      description: 'Facultatif. Cité dans la note de bas de page, à la suite du nom du client.',
    }),
  ],
  orderings: [
    {
      name: 'createdAsc',
      title: 'Ordre d’encodage (premier → dernier)',
      by: [{ field: '_createdAt', direction: 'asc' }],
    },
  ],
  preview: {
    select: { name: 'name', projectName: 'projectName', sector: 'sector', language: 'language' },
    prepare: ({ name, projectName, sector, language }) => ({
      title: name,
      subtitle: [language?.toUpperCase(), sector, projectName].filter(Boolean).join(' · '),
    }),
  },
});

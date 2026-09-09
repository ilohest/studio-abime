import { defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/**
 * Étoile — une personne qui a travaillé avec le studio.
 *
 * ┌─ Ce que c'est ──────────────────────────────────────────────────────────┐
 * │ Les collaborateurs ne sont pas listés : ils sont CARTOGRAPHIÉS. Studio  │
 * │ Abîme occupe le centre, chaque personne est une étoile reliée à lui par │
 * │ un trait fin, et l'ensemble forme une constellation (voir               │
 * │ `src/components/Constellation.astro`).                                  │
 * │                                                                         │
 * │ Une étoile s'encode ICI, une seule fois, et sert à deux endroits :      │
 * │                                                                         │
 * │  · dans un PROJET — le champ « Constellation » de la fiche projet       │
 * │    désigne qui y a pris part ; leur constellation se compose sous le    │
 * │    contenu de la page ;                                                 │
 * │  · dans le LABO — la grande constellation rassemble TOUTES les étoiles, │
 * │    automatiquement, sans avoir à les y ajouter une à une.               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * La position d'une étoile dans une figure n'est pas un réglage : elle est
 * calculée, et la même personne n'occupe pas la même place d'un projet à
 * l'autre. C'est voulu — une constellation se lit comme un relevé, pas comme
 * un organigramme.
 */
export const star = defineType({
  name: 'star',
  title: 'Étoile',
  type: 'document',
  fields: [
    languageField,
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      description: 'Le nom affiché à côté du point, dans la constellation.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Rôle',
      type: 'string',
      description:
        'Ce que la personne apporte — ex. Photographie, Développement, Illustration. Affiché sous le nom, en plus petit.',
      validation: (rule) => rule.max(60),
    }),

    /*
      L'INTERRUPTEUR DU LABO.

      La grande constellation du Labo se remplit toute seule : toute étoile
      encodée y paraît, sans qu'on ait à l'y ajouter. Il fallait donc pouvoir
      en retirer une — une collaboration terminée, une personne qui préfère ne
      pas y figurer — sans supprimer sa fiche, qui reste utile aux projets
      auxquels elle a pris part.

      Éteinte, l'étoile disparaît de la seule page Labo. Les projets qui la
      citent continuent de la montrer : elle y a vraiment travaillé, la page du
      projet ne doit pas mentir.
    */
    defineField({
      name: 'inLaboConstellation',
      title: 'Dans la constellation du Labo',
      type: 'boolean',
      initialValue: true,
      description:
        'Activé, l’étoile paraît dans la grande constellation de la page Labo. Désactivé, elle en sort — mais reste affichée sur les projets qui la citent.',
    }),
  ],
  orderings: [
    {
      name: 'nameAsc',
      title: 'Nom (A → Z)',
      by: [{ field: 'name', direction: 'asc' }],
    },
    {
      name: 'createdAsc',
      title: 'Ordre d’encodage (premier → dernier)',
      by: [{ field: '_createdAt', direction: 'asc' }],
    },
  ],
  preview: {
    select: { name: 'name', role: 'role', language: 'language', lit: 'inLaboConstellation' },
    prepare: ({ name, role, language, lit }) => ({
      /* Un repère lu d'un coup d'œil : ⊘ = retirée de la constellation du Labo. */
      title: lit === false ? `⊘ ${name}` : name,
      subtitle: [language?.toUpperCase(), role, lit === false ? 'Hors du Labo' : null]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});

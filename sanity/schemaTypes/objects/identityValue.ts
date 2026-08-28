import { defineField, defineType } from 'sanity';
import { IDENTITY_FIELDS } from '../../../src/lib/organizationIdentity';

/**
 * Référence à une information de la fiche d'entreprise, insérée DANS un texte.
 *
 * Les pages légales citent toutes les mêmes informations — siège, numéro
 * d'entreprise, adresse de contact. Plutôt que de les recopier dans chaque
 * page, où elles se mettraient à diverger au premier déménagement, on insère
 * ici un renvoi : « Le studio, dont le siège est établi [Adresse du siège], … ».
 * La valeur est lue au rendu dans Réglages du site → Identité.
 *
 * ── Pourquoi un objet et non un code à taper ────────────────────────────────
 * L'alternative évidente serait un jeton textuel, `{{address}}`, repéré par une
 * expression régulière au rendu. Elle a l'air plus simple et coûte plus cher :
 * un jeton mal orthographié ne prévient personne, il s'affiche tel quel en
 * ligne. Ici l'éditrice choisit dans une liste, ne peut donc pas se tromper de
 * nom, et voit dans son texte un bloc nommé plutôt qu'une accolade.
 *
 * La liste vient de `src/lib/organizationIdentity.ts`, partagée avec le rendu :
 * impossible de proposer ici un champ que le site ne saurait pas afficher.
 */
export const identityValue = defineType({
  name: 'identityValue',
  title: 'Information du studio',
  type: 'object',
  fields: [
    defineField({
      name: 'field',
      title: 'Information à insérer',
      type: 'string',
      options: {
        list: IDENTITY_FIELDS.map(({ value, title }) => ({ value, title })),
      },
      description:
        'La valeur est reprise de Réglages du site → Identité et réseaux sociaux. Tant qu’elle n’y est pas renseignée, la page affiche « [À COMPLÉTER] » à cet endroit.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { field: 'field' },
    prepare: ({ field }: { field?: string }) => ({
      /*
        Le titre affiché est le LIBELLÉ, pas la clé : dans le fil du texte,
        l'éditrice doit lire « Numéro de TVA » et non « vatId ».
      */
      title:
        IDENTITY_FIELDS.find((entry) => entry.value === field)?.title ??
        'Information non choisie',
    }),
  },
});

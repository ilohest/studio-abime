import { defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';

/**
 * Catégorie de projet (ex. Identité, Direction artistique, Édition…).
 *
 * `title` est traduit (un document par langue) tandis que `key` reste identique
 * d'une langue à l'autre : c'est cette clé stable qui sert d'identifiant de
 * filtre côté client et dans les URLs de filtrage éventuelles.
 */
export const category = defineType({
  name: 'category',
  title: 'Catégorie',
  type: 'document',
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Nom',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'key',
      title: 'Clé',
      type: 'slug',
      description:
        'Identifiant technique, IDENTIQUE dans toutes les langues (ex. « identite »). Ne pas modifier après publication.',
      options: { source: 'title', maxLength: 48 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: { title: 'title', key: 'key.current', language: 'language' },
    prepare: ({ title, key, language }) => ({
      title,
      subtitle: [language?.toUpperCase(), key].filter(Boolean).join(' · '),
    }),
  },
});

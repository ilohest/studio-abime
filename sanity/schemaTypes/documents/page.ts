import { defineField, defineType } from 'sanity';
import { languageField } from '../../lib/i18n';
import { definePageBuilder } from '../objects/sections';
import { getReservedSegments } from '../../../src/i18n/routes';
import { defaultLocale, isLocale } from '../../../src/i18n/config';

/**
 * Page institutionnelle (agence, services, contact, mentions légales…).
 *
 * Le contenu est entièrement modulaire : aucune structure figée, l'éditeur
 * compose la page à partir des blocs du page builder.
 *
 * Un document = une langue. La page d'accueil n'est pas un slug magique :
 * elle est désignée explicitement dans « Réglages localisés ».
 */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    languageField,
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description:
        "Identifiant dans l'URL. Peut être imbriqué : « agence/equipe » donne /agence/equipe.",
      options: {
        source: 'title',
        maxLength: 96,
        // Les « / » sont préservés pour autoriser les pages imbriquées.
        slugify: (input) =>
          input
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9/\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/\/+/g, '/')
            .slice(0, 96),
      },
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const slug = value?.current;
          if (!slug) return true;

          // Un slug de page ne doit jamais entrer en collision avec un segment
          // de section réservé (ex. « projets »), sinon la route est ambiguë.
          const language = (context.document as { language?: string } | undefined)?.language;
          const locale = isLocale(language) ? language : defaultLocale;
          const reserved = getReservedSegments(locale);
          const first = slug.split('/')[0];

          if (first && reserved.includes(first)) {
            return `« ${first} » est un segment réservé (section du site). Choisissez un autre slug.`;
          }
          return true;
        }),
    }),
    definePageBuilder({ group: 'content' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current', language: 'language' },
    prepare: ({ title, slug, language }) => ({
      title,
      subtitle: [language?.toUpperCase(), slug ? `/${slug}` : null].filter(Boolean).join(' · '),
    }),
  },
});

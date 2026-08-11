import { defineField, defineType } from 'sanity';
import type { SlugifierFn, SlugIsUniqueValidator } from '@sanity/types';
import { languageField } from '../../lib/i18n';

const API_VERSION = '2025-02-19';
const MAX_SLUG_LENGTH = 48;

type CategoryParent = {
  _id?: string;
  language?: string;
};

function normalizeSlug(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\u2019']/g, '-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_SLUG_LENGTH)
      .replace(/-+$/g, '') || 'categorie'
  );
}

function documentIds(id?: string) {
  const publishedId = id?.replace(/^drafts\./, '');
  return {
    publishedId: publishedId ?? '',
    draftId: publishedId ? `drafts.${publishedId}` : '',
  };
}

/**
 * Propose automatiquement un suffixe lorsque le même nom existe déjà dans la
 * même langue : `identite`, puis `identite-2`, `identite-3`, etc.
 */
const createUniqueCategorySlug: SlugifierFn = async (source, _schemaType, context) => {
  const base = normalizeSlug(source);
  const parent = context.parent as CategoryParent;
  const language = parent.language ?? 'fr';
  const { publishedId, draftId } = documentIds(parent._id);
  const client = context.getClient({ apiVersion: API_VERSION });
  const usedSlugs = await client.fetch<string[]>(
    /* groq */ `*[
      _type == "category" &&
      language == $language &&
      !(_id in [$publishedId, $draftId]) &&
      defined(coalesce(slug.current, key.current))
    ]{"value": coalesce(slug.current, key.current)}.value`,
    { language, publishedId, draftId },
  );

  const used = new Set(usedSlugs);
  if (!used.has(base)) return base;

  for (let index = 2; ; index += 1) {
    const suffix = `-${index}`;
    const stem = base.slice(0, MAX_SLUG_LENGTH - suffix.length).replace(/-+$/g, '');
    const candidate = `${stem}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
};

/** Empêche aussi une collision si un slug est modifié manuellement. */
const isCategorySlugUnique: SlugIsUniqueValidator = async (slug, context) => {
  const document = context.document;
  const language = typeof document?.language === 'string' ? document.language : 'fr';
  const { publishedId, draftId } = documentIds(document?._id);
  const client = context.getClient({ apiVersion: API_VERSION });
  const duplicateId = await client.fetch<string | null>(
    /* groq */ `*[
      _type == "category" &&
      language == $language &&
      !(_id in [$publishedId, $draftId]) &&
      coalesce(slug.current, key.current) == $slug
    ][0]._id`,
    { slug, language, publishedId, draftId },
  );

  return !duplicateId;
};

/**
 * Catégorie de projet (ex. Identité, Direction artistique, Édition…).
 *
 * Un document existe par langue. Le slug sert d'identifiant stable pour les
 * filtres ; son unicité est contrôlée au sein de chaque langue.
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
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'Généré depuis le nom. Si ce nom existe déjà, un suffixe est ajouté automatiquement (ex. « identite-2 »).',
      options: {
        source: 'title',
        maxLength: MAX_SLUG_LENGTH,
        slugify: createUniqueCategorySlug,
        isUnique: isCategorySlugUnique,
      },
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
    select: { title: 'title', slug: 'slug.current', language: 'language' },
    prepare: ({ title, slug, language }) => ({
      title,
      subtitle: [language?.toUpperCase(), slug].filter(Boolean).join(' · '),
    }),
  },
});

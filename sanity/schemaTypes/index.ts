import type { SchemaTypeDefinition } from 'sanity';

// Documents
import { page } from './documents/page';
import { project } from './documents/project';
import { category } from './documents/category';

// Singletons
import { siteSettings } from './singletons/siteSettings';
import { localizedSettings } from './singletons/localizedSettings';

// Objets réutilisables
import { link } from './objects/link';
import { seo } from './objects/seo';
import { richText, inlineImage } from './objects/richText';
import { projectTemplateOptions } from './objects/projectTemplateOptions';
import { sectionTypes } from './objects/sections';

/**
 * Registre unique des schémas.
 * Toute nouvelle définition doit être ajoutée ici pour être connue du Studio.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
  // Documents
  page,
  project,
  category,

  // Singletons
  siteSettings,
  localizedSettings,

  // Objets
  link,
  seo,
  richText,
  inlineImage,
  projectTemplateOptions,

  // Sections du page builder
  ...sectionTypes,
];

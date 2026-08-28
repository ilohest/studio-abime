import type { SchemaTypeDefinition } from 'sanity';

// Documents
import { page } from './documents/page';
import { project } from './documents/project';
import { client } from './documents/client';
import { post } from './documents/post';

// Singletons
import { siteSettings } from './singletons/siteSettings';
import { localizedSettings } from './singletons/localizedSettings';
import { projectsPage } from './singletons/projectsPage';
import { laboPage } from './singletons/laboPage';
import { journalPage } from './singletons/journalPage';
import { shopPage } from './singletons/shopPage';
import { maintenance } from './singletons/maintenance';

// Objets réutilisables
import { link } from './objects/link';
import { seo } from './objects/seo';
import { richText, inlineImage } from './objects/richText';
import { projectTemplateOptions } from './objects/projectTemplateOptions';
import { sectionTypes } from './objects/sections';
import { journalBlockTypes } from './objects/journalBlocks';

/**
 * Registre unique des schémas.
 * Toute nouvelle définition doit être ajoutée ici pour être connue du Studio.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
  // Documents
  page,
  project,
  client,
  post,

  // Singletons
  siteSettings,
  localizedSettings,
  projectsPage,
  laboPage,
  journalPage,
  shopPage,
  maintenance,

  // Objets
  link,
  seo,
  richText,
  inlineImage,
  projectTemplateOptions,

  // Sections du page builder
  ...sectionTypes,

  // Blocs de composition d'un article du Journal
  ...journalBlockTypes,
];

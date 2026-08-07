/**
 * Helpers i18n partagés par tous les schémas.
 *
 * Stratégie retenue : internationalisation au niveau DOCUMENT
 * (plugin @sanity/document-internationalization).
 *
 * Pourquoi ce choix plutôt que des champs traduits (`{fr: …, en: …}`) :
 *  - chaque langue a son propre slug → URLs réellement localisées et indexables ;
 *  - les workflows éditoriaux sont indépendants (publier EN sans toucher FR) ;
 *  - le Presentation Tool ouvre le bon document pour la langue affichée ;
 *  - les schémas restent plats : aucune imbrication par langue à traverser en GROQ.
 *
 * Conséquence : AUCUN schéma ne doit contenir de champ « par langue ».
 * Ajouter une langue = l'ajouter dans `src/i18n/config.ts`, rien d'autre.
 */
import { defineField } from 'sanity';
import type { ReferenceFilterResolver } from '@sanity/types';
import { defaultLocale, locales, localeMeta } from '../../src/i18n/config';

/** Types de documents soumis à la traduction. */
export const TRANSLATED_DOCUMENT_TYPES = ['page', 'project', 'category', 'localizedSettings'] as const;

/** Configuration attendue par le plugin document-internationalization. */
export const supportedLanguages = locales.map((id) => ({
  id,
  title: localeMeta[id]?.label ?? id,
}));

export const baseLanguage = defaultLocale;

/**
 * Champ `language`, déclaré explicitement (et non laissé au plugin) pour :
 *  - garantir sa présence dans les projections GROQ et les types générés ;
 *  - le rendre visible mais non modifiable à la main.
 */
export const languageField = defineField({
  name: 'language',
  title: 'Langue',
  type: 'string',
  readOnly: true,
  // Masqué quand le site est monolingue : aucun bruit inutile pour l'éditeur.
  hidden: locales.length === 1,
  initialValue: defaultLocale,
  options: {
    list: supportedLanguages.map(({ id, title }) => ({ value: id, title })),
  },
});

/**
 * Filtre de référence : n'autorise que des documents de la MÊME langue.
 * Évite qu'un projet français référence une catégorie anglaise.
 */
export const sameLanguageFilter: ReferenceFilterResolver = ({ document }) => ({
  filter: 'language == $language',
  params: { language: (document?.language as string | undefined) ?? defaultLocale },
});

/**
 * Source de vérité UNIQUE des langues du site.
 *
 * Ce fichier est importé à la fois par Astro (astro.config.ts, routing, layouts)
 * et par Sanity (sanity.config.ts, schémas, structure du back-office).
 * Il ne doit donc dépendre d'AUCUN runtime spécifique (pas d'import Astro/Sanity ici).
 *
 * ➜ AJOUTER UNE LANGUE = ajouter son code dans `locales` ci-dessous.
 *   Tout le reste (routes, schémas, back-office, sitemap, hreflang) suit automatiquement.
 */

/** Langues actives sur le site. Ajouter 'en' ici suffit à activer l'anglais partout. */
export const locales = ['fr'] as const;

export type Locale = (typeof locales)[number];

/** Langue par défaut : sert de fallback de contenu et de langue racine du site. */
export const defaultLocale: Locale = 'fr';

/**
 * `false` → la langue par défaut n'est pas préfixée : `/a-propos`, `/en/about`.
 * `true`  → toutes les langues sont préfixées : `/fr/a-propos`, `/en/about`.
 */
export const prefixDefaultLocale = false;

/**
 * Métadonnées par langue. On pré-remplit des langues non encore actives :
 * elles restent inertes tant qu'elles ne sont pas listées dans `locales`.
 */
export const localeMeta: Record<string, { label: string; htmlLang: string; dir: 'ltr' | 'rtl' }> = {
  fr: { label: 'Français', htmlLang: 'fr-FR', dir: 'ltr' },
  en: { label: 'English', htmlLang: 'en-GB', dir: 'ltr' },
  nl: { label: 'Nederlands', htmlLang: 'nl-BE', dir: 'ltr' },
  de: { label: 'Deutsch', htmlLang: 'de-DE', dir: 'ltr' },
};

/** `true` tant que le site n'a qu'une langue : permet de masquer le sélecteur de langue. */
export const isMonolingual = locales.length === 1;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function getLocaleMeta(locale: Locale) {
  return localeMeta[locale] ?? localeMeta[defaultLocale]!;
}

/** Liste des langues pour le plugin @sanity/document-internationalization. */
export const sanitySupportedLanguages = locales.map((id) => ({
  id,
  title: localeMeta[id]?.label ?? id,
}));

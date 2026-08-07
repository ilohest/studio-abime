/**
 * Requêtes GROQ.
 *
 * Convention i18n : le multilingue est géré au niveau DOCUMENT
 * (@sanity/document-internationalization). Chaque document porte un champ
 * `language` ; toute requête de contenu filtre donc sur `language == $locale`.
 * `$locale` et `$defaultLocale` sont injectés automatiquement par `loadQuery()`.
 *
 * Les fragments sont factorisés pour éviter la dérive entre les projections.
 */

/* -------------------------------------------------------------------------- */
/* Fragments                                                                   */
/* -------------------------------------------------------------------------- */

const IMAGE = /* groq */ `{
  _type,
  alt,
  hotspot,
  crop,
  asset->{
    _id,
    url,
    metadata { lqip, dimensions }
  }
}`;

const LINK = /* groq */ `{
  label,
  kind,
  externalUrl,
  openInNewTab,
  internal->{
    _type,
    title,
    "slug": slug.current,
    language
  }
}`;

const CATEGORY = /* groq */ `{
  _id,
  title,
  "key": key.current
}`;

const PROJECT_CARD = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
  language,
  client,
  year,
  excerpt,
  thumbnail ${IMAGE},
  coverImage ${IMAGE},
  "categories": coalesce(categories[]->${CATEGORY}, [])
}`;

const PORTABLE_TEXT = /* groq */ `[]{
  ...,
  markDefs[]{
    ...,
    _type == "linkMark" => ${LINK}
  },
  _type == "inlineImage" => { ..., ...${IMAGE} }
}`;

const SEO = /* groq */ `{
  title,
  description,
  image ${IMAGE},
  noIndex
}`;

/**
 * Page builder. Chaque variante `_type ==> {}` n'enrichit que ce qui a besoin
 * d'être déréférencé ; le `...` initial conserve les champs scalaires.
 */
const SECTIONS = /* groq */ `sections[]{
  _key,
  _type,
  ...,
  _type == "heroSection" => {
    media ${IMAGE},
    cta ${LINK}
  },
  _type == "richTextSection" => {
    body ${PORTABLE_TEXT}
  },
  _type == "mediaSection" => {
    items[]{
      _key,
      caption,
      image ${IMAGE}
    }
  },
  _type == "ctaSection" => {
    cta ${LINK}
  },
  _type == "projectListSection" => {
    "manualProjects": projects[]->${PROJECT_CARD},
    "latestProjects": *[_type == "project" && language == $locale && defined(slug.current)]
      | order(coalesce(year, 0) desc, _createdAt desc)[0...24] ${PROJECT_CARD},
    "categories": *[_type == "category" && language == $locale] | order(title asc) ${CATEGORY}
  }
}`;

/* -------------------------------------------------------------------------- */
/* Réglages                                                                    */
/* -------------------------------------------------------------------------- */

/** Réglages globaux, communs à toutes les langues (document singleton). */
export const siteSettingsQuery = /* groq */ `
*[_type == "siteSettings"][0]{
  logo ${IMAGE},
  "socialLinks": coalesce(socialLinks[]{ _key, platform, url }, [])
}`;

/** Réglages propres à une langue (navigation, titres, accueil). */
export const localizedSettingsQuery = /* groq */ `
*[_type == "localizedSettings" && language == $locale][0]{
  language,
  siteTitle,
  siteDescription,
  defaultSeoImage ${IMAGE},
  "headerNav": coalesce(headerNav[]{ _key, ...${LINK} }, []),
  "footerNav": coalesce(footerNav[]{ _key, ...${LINK} }, []),
  footerText ${PORTABLE_TEXT},
  "homePageSlug": homePage->slug.current,
  projectsIntro
}`;

/* -------------------------------------------------------------------------- */
/* Routage                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Manifeste de toutes les routes du site, toutes langues confondues.
 * Alimente `getStaticPaths()` — c'est la SEULE requête non filtrée par langue.
 */
export const routeManifestQuery = /* groq */ `{
  "documents": *[_type in ["page", "project"] && defined(slug.current)]{
    _type,
    "slug": slug.current,
    language
  },
  "homePages": *[_type == "localizedSettings" && defined(homePage)]{
    language,
    "slug": homePage->slug.current
  }
}`;

/* -------------------------------------------------------------------------- */
/* Documents                                                                   */
/* -------------------------------------------------------------------------- */

const PAGE_BODY = /* groq */ `{
  _id,
  _type,
  language,
  title,
  "slug": slug.current,
  "sections": coalesce(${SECTIONS}, []),
  seo ${SEO}
}`;

export const pageBySlugQuery = /* groq */ `
*[_type == "page" && language == $locale && slug.current == $slug][0] ${PAGE_BODY}`;

/** Page d'accueil : désignée dans les réglages localisés, pas par un slug magique. */
export const homePageQuery = /* groq */ `
*[_type == "localizedSettings" && language == $locale][0].homePage-> ${PAGE_BODY}`;

export const projectBySlugQuery = /* groq */ `
*[_type == "project" && language == $locale && slug.current == $slug][0]{
  _id,
  _type,
  language,
  title,
  "slug": slug.current,
  "template": coalesce(template, "standard"),
  templateOptions,
  client,
  year,
  excerpt,
  services,
  coverImage ${IMAGE},
  thumbnail ${IMAGE},
  "categories": coalesce(categories[]->${CATEGORY}, []),
  "sections": coalesce(${SECTIONS}, []),
  seo ${SEO},
  "next": *[_type == "project" && language == $locale && defined(slug.current) && _id != ^._id]
    | order(coalesce(year, 0) desc, _createdAt desc)[0] ${PROJECT_CARD}
}`;

/** Index portfolio : tous les projets + toutes les catégories de la langue. */
export const projectsIndexQuery = /* groq */ `{
  "projects": *[_type == "project" && language == $locale && defined(slug.current)]
    | order(coalesce(year, 0) desc, _createdAt desc) ${PROJECT_CARD},
  "categories": *[_type == "category" && language == $locale] | order(title asc) ${CATEGORY}
}`;

/** Traductions disponibles d'un document — alimente les balises `hreflang`. */
export const translationsQuery = /* groq */ `
*[_type == "translation.metadata" && references($id)][0]
  .translations[].value->{
    _type,
    language,
    "slug": slug.current
  }`;

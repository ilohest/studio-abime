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
  "slug": coalesce(slug.current, key.current)
}`;

/**
 * Un projet masqué (`visible: false`) n'existe plus nulle part sur le site :
 * ni liste, ni sélection, ni page. Le champ étant récent, `coalesce` traite les
 * documents antérieurs comme visibles.
 */
const VISIBLE_PROJECT = /* groq */ `_type == "project" && language == $locale && defined(slug.current) && coalesce(visible, true) == true`;

/**
 * Projets marqués « favori ». Une seule case à cocher, dans la fiche projet,
 * décide de la table des éléments, de la sélection de l'accueil et de l'archive
 * du Labo. Sans aucun favori, chaque section retombe sur les plus récents.
 */
const FEATURED_PROJECT = /* groq */ `${VISIBLE_PROJECT} && featured == true`;

/** Ordre éditorial de référence : du plus récent au plus ancien. */
const PROJECT_ORDER = /* groq */ `order(coalesce(year, 0) desc, _createdAt desc)`;

const PROJECT_CARD = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
  language,
  "number": count(*[
    _type == "project" &&
    language == ^.language &&
    defined(slug.current) &&
    coalesce(visible, true) == true &&
    (
      coalesce(year, 0) > coalesce(^.year, 0) ||
      (coalesce(year, 0) == coalesce(^.year, 0) && _createdAt > ^._createdAt)
    )
  ]) + 1,
  client,
  sector,
  "featured": featured == true,
  year,
  excerpt,
  listingFacts[]{ _key, label, value },
  thumbnail ${IMAGE},
  "categories": coalesce(categories[]->${CATEGORY}, [])
}`;

/** Carte d'article du Journal. */
const POST_CARD = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
  language,
  "number": count(*[
    _type == "post" &&
    language == ^.language &&
    defined(slug.current) &&
    coalesce(publishedAt, _createdAt) > coalesce(^.publishedAt, ^._createdAt)
  ]) + 1,
  "category": coalesce(category, "cahier-de-recherche"),
  "publishedAt": coalesce(publishedAt, _createdAt),
  excerpt,
  listingFacts[]{ _key, label, value },
  "coverImage": coverImage ${IMAGE}
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
  "noIndex": false
}`;

/**
 * Page builder. Chaque variante `_type ==> {}` n'enrichit que ce qui a besoin
 * d'être déréférencé ; le `...` initial conserve les champs scalaires.
 */
const SECTIONS = /* groq */ `sections[]{
  _key,
  _type,
  ...,
  _type == "servicesMenu" => {
    image ${IMAGE}
  },
  _type == "studioStatement" => {
    cta ${LINK},
    figures[]{
      _key,
      number,
      caption,
      span,
      bleed,
      pushRight,
      image ${IMAGE}
    }
  },
  _type == "plateSpread" => {
    background ${IMAGE},
    figures[]{
      _key,
      number,
      caption,
      image ${IMAGE}
    }
  },
  _type == "projectShowcase" => {
    "projects": select(
      count(*[${FEATURED_PROJECT}]) > 0 => *[${FEATURED_PROJECT}] | ${PROJECT_ORDER}[0...5] ${PROJECT_CARD},
      *[${VISIBLE_PROJECT}] | ${PROJECT_ORDER}[0...5] ${PROJECT_CARD}
    ),
    placeholderItems[0...5]{
      _key,
      title,
      href,
      image ${IMAGE}
    }
  },
  _type == "fullBleedImage" => {
    image ${IMAGE}
  },
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
    "latestProjects": *[${VISIBLE_PROJECT}] | ${PROJECT_ORDER}[0...24] ${PROJECT_CARD},
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
  "homePageSlug": homePage->slug.current
}`;

/* -------------------------------------------------------------------------- */
/* Routage                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Manifeste de toutes les routes du site, toutes langues confondues.
 * Alimente `getStaticPaths()` — c'est la SEULE requête non filtrée par langue.
 */
export const routeManifestQuery = /* groq */ `{
  "documents": *[
    _type in ["page", "project", "post"] &&
    defined(slug.current) &&
    (_type != "project" || coalesce(visible, true) == true)
  ]{
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

/**
 * Existence des pages légales portées par Sanity.
 *
 * Le pied de page ne doit lister que des liens qui mènent quelque part : tant
 * que la page « Cookies » n'a pas été créée dans le Studio, son lien n'apparaît
 * pas. On ne récupère que les slugs — le contenu est chargé par la route.
 */
export const legalPagesQuery = /* groq */ `
*[_type == "page" && language == $locale && slug.current in $slugs].slug.current`;

/** Page d'accueil : désignée dans les réglages localisés, pas par un slug magique. */
export const homePageQuery = /* groq */ `
*[_type == "localizedSettings" && language == $locale][0].homePage-> ${PAGE_BODY}`;

/**
 * Page projet. Deux rangs y sont calculés pour que la page puisse reconstituer
 * la case que le visiteur vient de quitter : sa position dans le catalogue, et
 * sa position parmi les favoris — celle-ci désigne la case réservée qu'il
 * occupe dans la table des éléments.
 */
export const projectBySlugQuery = /* groq */ `
*[_type == "project" && language == $locale && slug.current == $slug][0]{
  _id,
  _type,
  language,
  title,
  "slug": slug.current,
  "template": coalesce(template, "standard"),
  templateOptions,
  "coverVideoUrl": coalesce(coverVideoUrl, templateOptions.coverVideoUrl),
  client,
  sector,
  "featured": featured == true,
  "number": count(*[
    _type == "project" &&
    language == ^.language &&
    defined(slug.current) &&
    coalesce(visible, true) == true &&
    (
      coalesce(year, 0) > coalesce(^.year, 0) ||
      (coalesce(year, 0) == coalesce(^.year, 0) && _createdAt > ^._createdAt)
    )
  ]) + 1,
  "featuredRank": count(*[
    _type == "project" &&
    language == ^.language &&
    defined(slug.current) &&
    coalesce(visible, true) == true &&
    featured == true &&
    (
      coalesce(year, 0) > coalesce(^.year, 0) ||
      (coalesce(year, 0) == coalesce(^.year, 0) && _createdAt > ^._createdAt)
    )
  ]),
  year,
  headline,
  excerpt,
  services,
  "channels": coalesce(channels[]{ _key, label, url }, []),
  listingFacts[]{ _key, label, value },
  "gallery": coalesce(gallery[]{ _key, span, spanWide, caption, image ${IMAGE} }, []),
  thumbnail ${IMAGE},
  "categories": coalesce(categories[]->${CATEGORY}, []),
  "sections": coalesce(${SECTIONS}, []),
  "seo": {
    "title": seo.title,
    "description": seo.description,
    "image": thumbnail ${IMAGE},
    "noIndex": false
  },
  "next": *[${VISIBLE_PROJECT} && _id != ^._id] | ${PROJECT_ORDER}[0] ${PROJECT_CARD}
}`;

/** Index portfolio : tous les projets + toutes les catégories de la langue. */
export const projectsIndexQuery = /* groq */ `{
  "projects": *[${VISIBLE_PROJECT}] | ${PROJECT_ORDER} ${PROJECT_CARD},
  "categories": *[_type == "category" && language == $locale] | order(title asc) ${CATEGORY}
}`;

/**
 * Projets publiés utilisés par l'archive du Labo.
 * Cette requête reste indépendante du singleton éditorial : les vrais
 * projets continuent ainsi d'être affichés lorsque celui-ci n'est pas encore
 * publié et que le contenu de repli de la page est utilisé.
 */
export const laboArchiveProjectsQuery = /* groq */ `
select(
  count(*[${FEATURED_PROJECT} && defined(thumbnail.asset)]) > 0 =>
    *[${FEATURED_PROJECT} && defined(thumbnail.asset)] | ${PROJECT_ORDER}[0...6] ${PROJECT_CARD},
  *[${VISIBLE_PROJECT} && defined(thumbnail.asset)] | ${PROJECT_ORDER}[0...6] ${PROJECT_CARD}
)
`;

/** Contenu éditorial de la page Expériences, singleton propre à chaque langue. */
export const projectsPageQuery = /* groq */ `
*[_type == "projectsPage" && language == $locale][0]{
  _id,
  _type,
  language,
  title,
  intro,
  "editorialCards": coalesce(editorialCards[]{ _key, kind, text, position }, []),
  seo ${SEO}
}`;

/**
 * Clients sans page projet, dans leur ORDRE D'ENCODAGE : c'est lui qui décide
 * quelle case de la table des éléments revient à qui, une fois les projets
 * favoris placés.
 */
export const clientsQuery = /* groq */ `
*[_type == "client" && language == $locale && defined(name)]
  | order(_createdAt asc, _id asc){ _id, name, sector }`;

/** Page Labo : le contenu reste éditable, la mise en scène demeure intentionnelle. */
export const laboPageQuery = /* groq */ `
*[_type == "laboPage" && language == $locale][0]{
  _id,
  _type,
  language,
  title,
  eyebrow,
  "philosophy": coalesce(philosophy, []),
  whyTitle,
  whyLead,
  "principles": coalesce(principles, []),
  whyClosing,
  servicesTitle,
  "services": coalesce(services[]{ _key, title, description }, []),
  note,
  "closingLines": coalesce(closingLines, []),
  cta ${LINK},
  archiveTitle,
  "archiveProjects": select(
    count(*[${FEATURED_PROJECT} && defined(thumbnail.asset)]) > 0 =>
      *[${FEATURED_PROJECT} && defined(thumbnail.asset)] | ${PROJECT_ORDER}[0...6] ${PROJECT_CARD},
    *[${VISIBLE_PROJECT} && defined(thumbnail.asset)] | ${PROJECT_ORDER}[0...6] ${PROJECT_CARD}
  ),
  seo ${SEO}
}`;

/** Traductions disponibles d'un document — alimente les balises `hreflang`. */
export const translationsQuery = /* groq */ `
*[_type == "translation.metadata" && references($id)][0]
  .translations[].value->{
    _type,
    language,
    "slug": slug.current
  }`;

/* -------------------------------------------------------------------------- */
/* Journal                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Index du Journal : tous les articles de la langue, du plus récent au plus
 * ancien. Le filtrage par rubrique se fait côté client — l'ordre chronologique
 * reste donc la vue par défaut, y compris sans JavaScript.
 */
export const journalIndexQuery = /* groq */ `
*[_type == "post" && language == $locale && defined(slug.current)]
  | order(coalesce(publishedAt, _createdAt) desc, _createdAt desc) ${POST_CARD}`;

/** Contenu éditorial de la page Shop, singleton propre à chaque langue. */
export const shopPageQuery = /* groq */ `
*[_type == "shopPage" && language == $locale][0]{
  _id,
  _type,
  language,
  title,
  intro,
  seo ${SEO}
}`;

/** Contenu éditorial de la page Journal, singleton propre à chaque langue. */
export const journalPageQuery = /* groq */ `
*[_type == "journalPage" && language == $locale][0]{
  _id,
  _type,
  language,
  title,
  intro,
  seo ${SEO}
}`;

/**
 * Article complet.
 *
 * `blocks` porte la composition. Quand elle est vide, l'ancien corps de texte
 * y est replié dans un unique bloc « Texte » : le rendu n'a donc qu'une seule
 * forme à connaître, et aucun article écrit avant les blocs n'est amputé.
 */
export const postBySlugQuery = /* groq */ `
*[_type == "post" && language == $locale && slug.current == $slug][0]{
  _id,
  _type,
  language,
  title,
  "slug": slug.current,
  "category": coalesce(category, "cahier-de-recherche"),
  "publishedAt": coalesce(publishedAt, _createdAt),
  standfirst,
  excerpt,
  listingFacts[]{ _key, label, value },
  "coverImage": coverImage ${IMAGE},
  "template": coalesce(template, "revue"),
  "blocks": select(
    count(blocks) > 0 => blocks[]{
      _key,
      _type,
      _type == "journalProse" => { "body": body ${PORTABLE_TEXT} },
      _type == "journalFigure" => {
        caption,
        "placement": coalesce(placement, "texte"),
        "scale": coalesce(scale, "colonne"),
        "images": images[] ${IMAGE}
      },
      _type == "journalNote" => { text }
    },
    count(body) > 0 => [{
      "_key": "legacy-body",
      "_type": "journalProse",
      "body": body ${PORTABLE_TEXT}
    }],
    []
  ),
  "seo": {
    "title": seo.title,
    "description": coalesce(seo.description, excerpt),
    "image": coalesce(seo.image ${IMAGE}, coverImage ${IMAGE}),
    "noIndex": false
  },
  "next": *[
    _type == "post" && language == $locale && defined(slug.current) && _id != ^._id &&
    coalesce(publishedAt, _createdAt) < coalesce(^.publishedAt, ^._createdAt)
  ] | order(coalesce(publishedAt, _createdAt) desc)[0] ${POST_CARD}
}`;

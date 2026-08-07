/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;
  readonly PUBLIC_SANITY_API_VERSION: string;
  readonly PUBLIC_SANITY_STUDIO_URL: string;
  readonly PUBLIC_SANITY_VISUAL_EDITING_ENABLED: string;
  readonly PUBLIC_SITE_URL: string;
  /** Token serveur uniquement — indisponible côté client. */
  readonly SANITY_API_READ_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

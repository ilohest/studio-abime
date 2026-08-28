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
  /**
   * Mode maintenance résolu au build (« true » / « false »), injecté par
   * `astro.config.ts` d'après l'interrupteur du back-office.
   */
  readonly MAINTENANCE_ENABLED: string;
  /** Mot de passe levant le rideau. Serveur uniquement — voir `src/lib/maintenance.ts`. */
  readonly MAINTENANCE_PASSWORD: string;
}

declare namespace App {
  interface Locals {
    /** Posé par `src/middleware.ts` quand le rideau est tiré. */
    maintenance?: {
      /** Adresse demandée, vers laquelle renvoyer une fois le mot de passe accepté. */
      next: string;
      /** Un mot de passe vient d'être refusé. */
      refused: boolean;
    };
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

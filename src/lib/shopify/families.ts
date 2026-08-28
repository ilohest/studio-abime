/**
 * Les trois familles du catalogue.
 *
 * Une famille, c'est ce que l'admin Shopify appelle le « Type de produit » :
 * la seule saisie qui range un produit dans sa collection, décide du libellé de
 * son bouton et de la fiche technique qui l'accompagne. Tout le reste en
 * découle, ici et nulle part ailleurs.
 *
 * Ce fichier existe parce que l'admin Shopify ne sait pas cloisonner les
 * metafields par type de produit : ses conditions de définition ne portent que
 * sur la catégorie de taxonomie, et nos trois familles rassemblent des
 * catégories trop différentes pour s'y prêter (un tirage, un livre et des
 * cartes postales sont trois catégories, une seule famille). Les neuf champs
 * apparaissent donc sur toutes les fiches du back-office, et c'est le site qui
 * fait le tri : une famille n'affiche que les champs qu'elle déclare, un champ
 * rempli hors de sa famille reste invisible.
 */
import type { TranslationKey } from '~/i18n/ui';

export type ProductFamily = 'transmission' | 'contemplation' | 'outil';

/** Un champ de fiche : où le lire chez Shopify, sous quelle étiquette l'annoncer. */
export interface FamilyFact {
  namespace: string;
  key: string;
  label: TranslationKey;
  /*
    Emplacement d'origine, lu seulement quand le nouveau champ est vide. Il
    couvre la reprise de saisie : les fiches déjà remplies sous `custom` ne
    perdent rien tant qu'elles n'ont pas été reprises. À retirer une fois le
    catalogue à jour — avec les deux définitions `custom` correspondantes.
  */
  legacy?: { namespace: string; key: string };
}

interface FamilyDefinition {
  /** Valeur attendue dans « Type de produit ». La casse est tolérée à la lecture. */
  productType: string;
  /** Libellé du bouton d'achat. */
  cta: TranslationKey;
  /** Champs propres à la famille, dans l'ordre d'affichage. */
  facts: FamilyFact[];
  /** Étiquette de la jauge : des places pour une formation, un tirage pour une édition. */
  editionLabel: TranslationKey;
  /**
   * Décompte du restant, accord compris — « places restantes » contre
   * « exemplaires restants ». Le nombre est préfixé au moment du rendu.
   */
  remainingLabel: TranslationKey;
}

/** Emplacements de la jauge, communs aux trois familles. */
export const EDITION_MAX = { namespace: 'studio', key: 'quantite_max' } as const;
export const EDITION_SHOW = { namespace: 'studio', key: 'afficher_jauge' } as const;

/** Champs affichés partout, quelle que soit la famille — présentés en dernier. */
export const COMMON_FACTS: FamilyFact[] = [
  { namespace: 'studio', key: 'origine_production', label: 'shop.origin' },
];

export const FAMILIES: Record<ProductFamily, FamilyDefinition> = {
  transmission: {
    productType: 'Transmission',
    cta: 'shop.ctaTransmission',
    editionLabel: 'shop.seats',
    remainingLabel: 'shop.seatsRemaining',
    facts: [
      {
        namespace: 'transmission',
        key: 'date',
        label: 'shop.when',
        legacy: { namespace: 'custom', key: 'quand' },
      },
      {
        namespace: 'transmission',
        key: 'lieu',
        label: 'shop.where',
        legacy: { namespace: 'custom', key: 'ou' },
      },
      { namespace: 'transmission', key: 'prerequis', label: 'shop.prerequisites' },
      { namespace: 'transmission', key: 'competences', label: 'shop.skills' },
      { namespace: 'transmission', key: 'apres', label: 'shop.after' },
      { namespace: 'transmission', key: 'collaborateurs', label: 'shop.collaborators' },
    ],
  },
  contemplation: {
    productType: 'Contemplation',
    cta: 'shop.ctaContemplation',
    editionLabel: 'shop.edition',
    remainingLabel: 'shop.copiesRemaining',
    /* Rien en propre : le tirage maximum est porté par la jauge, commune. */
    facts: [],
  },
  outil: {
    productType: 'Outil',
    cta: 'shop.ctaOutil',
    editionLabel: 'shop.edition',
    remainingLabel: 'shop.copiesRemaining',
    facts: [{ namespace: 'outil', key: 'categorie', label: 'shop.rayon' }],
  },
};

/**
 * Résout le « Type de produit » Shopify en famille.
 *
 * La comparaison ignore la casse et les espaces de bord, là où la condition
 * d'une collection automatisée, elle, est littérale. Un `outil` saisi en
 * minuscules sortirait donc de sa collection tout en gardant son bouton : la
 * tolérance est ici pour que la fiche reste juste, pas pour dispenser de la
 * saisie exacte.
 */
export function toFamily(productType: string | null): ProductFamily | null {
  const needle = productType?.trim().toLowerCase();
  if (!needle) return null;

  const found = (Object.keys(FAMILIES) as ProductFamily[]).find(
    (family) => FAMILIES[family].productType.toLowerCase() === needle,
  );

  return found ?? null;
}

/** Tous les emplacements à demander au Storefront, sans doublon. */
export function metafieldIdentifiers(): Array<{ namespace: string; key: string }> {
  const seen = new Set<string>();
  const identifiers: Array<{ namespace: string; key: string }> = [];

  const push = ({ namespace, key }: { namespace: string; key: string }) => {
    const token = `${namespace}.${key}`;
    if (seen.has(token)) return;
    seen.add(token);
    identifiers.push({ namespace, key });
  };

  push(EDITION_MAX);
  push(EDITION_SHOW);

  for (const family of Object.values(FAMILIES)) {
    for (const fact of family.facts) {
      push(fact);
      if (fact.legacy) push(fact.legacy);
    }
  }

  for (const fact of COMMON_FACTS) push(fact);

  return identifiers;
}

/**
 * La même liste, écrite en littéral GraphQL.
 *
 * La requête est composée à partir d'ici plutôt que recopiée : ajouter un champ
 * à une famille suffit à le faire remonter du Storefront, sans toucher au
 * fichier de requêtes.
 */
export function metafieldIdentifiersLiteral(): string {
  return metafieldIdentifiers()
    .map(({ namespace, key }) => `{ namespace: "${namespace}", key: "${key}" }`)
    .join(', ');
}

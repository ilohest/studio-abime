import { useEffect, useId, useMemo, useState } from 'react';
import {
  Autocomplete,
  Badge,
  Card,
  Flex,
  Switch,
  Text,
  TextInput,
  type BaseAutocompleteOption,
  type BadgeTone,
} from '@sanity/ui';
import { PatchEvent, set, type ObjectInputProps, useFormValue, useWorkspace } from 'sanity';

interface SanityTarget {
  _id: string;
  _type: 'page' | 'project' | 'post' | 'projectsPage' | 'journalPage';
  title?: string;
}

interface ShopifyTarget {
  handle: string;
  title: string;
  availableForSale?: boolean;
  variants?: {
    nodes?: Array<{ availableForSale?: boolean; currentlyNotInStock?: boolean }>;
  };
}

interface IndexLinkValue {
  _type?: 'indexLink';
  internal?: { _type: 'reference'; _ref: string };
  shopifyType?: 'shop' | 'collection' | 'product';
  shopifyHandle?: string;
  shopifyTitle?: string;
  externalUrl?: string;
  openInNewTab?: boolean;
}

interface DestinationOption extends BaseAutocompleteOption {
  title: string;
  typeLabel: string;
  tone: BadgeTone;
}

const SANITY_LABELS: Record<SanityTarget['_type'], string> = {
  page: 'Page',
  project: 'Projet',
  post: 'Journal',
  projectsPage: 'Expériences',
  journalPage: 'Journal',
};

const SANITY_TONES: Record<SanityTarget['_type'], BadgeTone> = {
  page: 'default',
  project: 'positive',
  post: 'caution',
  projectsPage: 'positive',
  journalPage: 'caution',
};

const SHOPIFY_QUERY = `
  query IndexDestinations {
    products(first: 250, sortKey: TITLE) {
      nodes {
        handle
        title
        availableForSale
        variants(first: 50) {
          nodes {
            availableForSale
            currentlyNotInStock
          }
        }
      }
    }
    collections(first: 250, sortKey: TITLE) { nodes { handle title } }
  }
`;

function currentValue(value: IndexLinkValue | undefined): string {
  if (value?.internal?._ref) return `sanity:${value.internal._ref}`;
  if (value?.shopifyType === 'shop') return 'shopify:shop';
  if (value?.shopifyType && value.shopifyHandle) {
    return `shopify:${value.shopifyType}:${value.shopifyHandle}`;
  }
  if (value && 'externalUrl' in value) return 'custom';
  return '';
}

export function IndexLinkInput(props: ObjectInputProps) {
  const autocompleteId = useId();
  const value = props.value as IndexLinkValue | undefined;
  const language = (useFormValue(['language']) as string | undefined) ?? 'fr';
  const workspace = useWorkspace();
  const client = useMemo(() => workspace.getClient({ apiVersion: '2025-02-19' }), [workspace]);
  const [sanityTargets, setSanityTargets] = useState<SanityTarget[]>([]);
  const [products, setProducts] = useState<ShopifyTarget[]>([]);
  const [collections, setCollections] = useState<ShopifyTarget[]>([]);
  const [shopifyError, setShopifyError] = useState(false);

  useEffect(() => {
    let active = true;

    client
      .fetch<SanityTarget[]>(
        `*[
          _type in ["page", "project", "post", "projectsPage", "journalPage"] &&
          coalesce(language, $language) == $language
        ] | order(_type asc, title asc) { _id, _type, title }`,
        { language },
      )
      .then((targets) => {
        if (active) setSanityTargets(targets);
      })
      .catch(() => {
        if (active) setSanityTargets([]);
      });

    return () => {
      active = false;
    };
  }, [client, language]);

  useEffect(() => {
    let active = true;
    const domain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN
      ?.replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    const token = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
    const version = import.meta.env.PUBLIC_SHOPIFY_API_VERSION || '2026-07';

    if (!domain || !token) {
      setShopifyError(true);
      return;
    }

    fetch(`https://${domain}/api/${version}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: SHOPIFY_QUERY }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Shopify a répondu ${response.status}`);
        return response.json() as Promise<{
          data?: {
            products?: { nodes?: ShopifyTarget[] };
            collections?: { nodes?: ShopifyTarget[] };
          };
          errors?: unknown[];
        }>;
      })
      .then((payload) => {
        if (!active || payload.errors) throw new Error('Catalogue Shopify illisible');
        setProducts(
          (payload.data?.products?.nodes ?? []).filter(
            (product) =>
              product.availableForSale &&
              (product.variants?.nodes ?? []).some(
                (variant) =>
                  variant.availableForSale &&
                  !variant.currentlyNotInStock,
              ),
          ),
        );
        setCollections(payload.data?.collections?.nodes ?? []);
        setShopifyError(false);
      })
      .catch(() => {
        if (active) setShopifyError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const selected = currentValue(value);
  const selectedStillExists = useMemo(
    () =>
      !selected ||
      selected === 'custom' ||
      selected === 'shopify:shop' ||
      sanityTargets.some((target) => selected === `sanity:${target._id}`) ||
      products.some((product) => selected === `shopify:product:${product.handle}`) ||
      collections.some(
        (collection) => selected === `shopify:collection:${collection.handle}`,
      ),
    [collections, products, sanityTargets, selected],
  );

  const options = useMemo<DestinationOption[]>(() => {
    const destinations: DestinationOption[] = [
      ...sanityTargets.map((target) => ({
        value: `sanity:${target._id}`,
        title: target.title || SANITY_LABELS[target._type],
        typeLabel: SANITY_LABELS[target._type],
        tone: SANITY_TONES[target._type],
      })),
      {
        value: 'shopify:shop',
        title: 'Shop',
        typeLabel: 'Boutique',
        tone: 'primary',
      },
      {
        value: 'custom',
        title: 'URL ou chemin',
        typeLabel: 'Libre',
        tone: 'default',
      },
      ...collections.map((collection) => ({
        value: `shopify:collection:${collection.handle}`,
        title: collection.title,
        typeLabel: 'Collection',
        tone: 'primary' as const,
      })),
      ...products.map((product) => ({
        value: `shopify:product:${product.handle}`,
        title: product.title,
        typeLabel: 'Produit',
        tone: 'primary' as const,
      })),
    ];

    if (!selectedStillExists && selected) {
      destinations.unshift({
        value: selected,
        title: value?.shopifyTitle || 'Destination actuelle',
        typeLabel: 'Indisponible',
        tone: 'critical',
      });
    }

    return destinations;
  }, [collections, products, sanityTargets, selected, selectedStillExists, value?.shopifyTitle]);

  const commit = (next: IndexLinkValue) =>
    props.onChange(PatchEvent.from(set({ _type: 'indexLink', ...next })));

  const selectDestination = (destination: string) => {
    const common = { openInNewTab: value?.openInNewTab ?? false };

    if (destination.startsWith('sanity:')) {
      commit({
        ...common,
        internal: { _type: 'reference', _ref: destination.slice('sanity:'.length) },
      });
      return;
    }

    if (destination === 'shopify:shop') {
      commit({ ...common, shopifyType: 'shop', shopifyTitle: 'Shop' });
      return;
    }

    if (destination === 'custom') {
      commit({ ...common, externalUrl: value?.externalUrl ?? '' });
      return;
    }

    const [, shopifyType, ...handleParts] = destination.split(':');
    const handle = handleParts.join(':');
    const candidates = shopifyType === 'product' ? products : collections;
    const target = candidates.find((candidate) => candidate.handle === handle);
    if (!target || (shopifyType !== 'product' && shopifyType !== 'collection')) return;

    commit({
      ...common,
      shopifyType,
      shopifyHandle: target.handle,
      shopifyTitle: target.title,
    });
  };

  return (
    <Flex direction="column" gap={3}>
      <Autocomplete<DestinationOption>
        id={autocompleteId}
        value={selected}
        options={options}
        openButton
        openOnFocus
        placeholder="Choisir une destination…"
        filterOption={(query, option) =>
          `${option.title} ${option.typeLabel}`.toLocaleLowerCase('fr').includes(
            query.toLocaleLowerCase('fr'),
          )
        }
        onSelect={selectDestination}
        renderValue={(_selectedValue, option) => option?.title ?? ''}
        renderOption={(option) => (
          <Card padding={3} radius={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <Text size={1} weight="medium">
                {option.title}
              </Text>
              <Badge fontSize={0} tone={option.tone} radius={5}>
                {option.typeLabel}
              </Badge>
            </Flex>
          </Card>
        )}
      />

      {selected === 'custom' && (
        <Flex direction="column" gap={2}>
          <Text size={1} weight="medium">
            URL ou chemin depuis la racine
          </Text>
          <TextInput
            aria-label="URL ou chemin depuis la racine"
            value={value?.externalUrl ?? ''}
            placeholder="/collections/ce-qui-se-contemple ou https://…"
            onChange={(event) =>
              commit({
                externalUrl: event.currentTarget.value,
                openInNewTab: value?.openInNewTab ?? false,
              })
            }
          />
          <Text muted size={1}>
            Commencer par / pour créer un lien relatif au domaine du site.
          </Text>
        </Flex>
      )}

      {shopifyError && (
        <Card padding={3} radius={2} tone="caution">
          <Text size={1}>
            Le catalogue Shopify est momentanément indisponible. Les pages Sanity restent
            sélectionnables.
          </Text>
        </Card>
      )}

      <Flex align="center" gap={3}>
        <Switch
          checked={value?.openInNewTab ?? false}
          onChange={(event) =>
            commit({ ...value, openInNewTab: event.currentTarget.checked })
          }
        />
        <Text size={1}>Ouvrir dans un nouvel onglet</Text>
      </Flex>
    </Flex>
  );
}

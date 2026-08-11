import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2025-02-19' });
const MAX_SLUG_LENGTH = 48;

type CategoryDocument = {
  _id: string;
  _createdAt: string;
  title?: string;
  language?: string;
  key?: { current?: string };
  slug?: { current?: string };
};

function normalizeSlug(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[\u2019']/g, '-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_SLUG_LENGTH)
      .replace(/-+$/g, '') || 'categorie'
  );
}

function canonicalId(id: string) {
  return id.replace(/^drafts\./, '');
}

async function main() {
  const documents = await client.fetch<CategoryDocument[]>(
    /* groq */ `*[_type == "category"] | order(_createdAt asc){
      _id,
      _createdAt,
      title,
      language,
      key,
      slug
    }`,
  );

  const usedByLanguage = new Map<string, Set<string>>();
  const slugByDocument = new Map<string, string>();

  // Un brouillon et sa version publiée représentent le même document et
  // doivent donc recevoir exactement le même slug.
  for (const document of documents) {
    const id = canonicalId(document._id);
    const existing = slugByDocument.get(id);
    if (existing) continue;

    const language = document.language ?? 'fr';
    const used = usedByLanguage.get(language) ?? new Set<string>();
    usedByLanguage.set(language, used);

    const base = normalizeSlug(document.slug?.current ?? document.key?.current ?? document.title ?? 'categorie');
    let candidate = base;
    let index = 2;
    while (used.has(candidate)) {
      const suffix = `-${index}`;
      const stem = base.slice(0, MAX_SLUG_LENGTH - suffix.length).replace(/-+$/g, '');
      candidate = `${stem}${suffix}`;
      index += 1;
    }

    used.add(candidate);
    slugByDocument.set(id, candidate);
  }

  if (documents.length === 0) {
    console.log(JSON.stringify({ status: 'no-categories' }, null, 2));
    return;
  }

  const transaction = client.transaction();
  for (const document of documents) {
    const slug = slugByDocument.get(canonicalId(document._id));
    if (!slug) continue;
    transaction.patch(document._id, (patch) =>
      patch.set({ slug: { _type: 'slug', current: slug } }).unset(['key']),
    );
  }

  await transaction.commit();
  console.log(
    JSON.stringify(
      {
        status: 'migrated',
        documents: documents.length,
        categories: slugByDocument.size,
        slugs: Object.fromEntries(slugByDocument),
      },
      null,
      2,
    ),
  );
}

await main();

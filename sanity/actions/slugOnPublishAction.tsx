import { useEffect, useState } from 'react';
import {
  useDocumentOperation,
  type DocumentActionComponent,
  type DuplicateDocumentActionComponent,
} from 'sanity';

type SluggedDocument = {
  title?: string;
  slug?: { current?: string };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Génère l'URL technique à la première publication, sans champ à gérer dans le
 * Studio. Partagé par les projets et les articles du Journal : dans les deux
 * cas, l'éditeur saisit un titre, jamais un slug.
 */
export const SlugOnPublishAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isPublishing, setIsPublishing] = useState(false);
  const document = (props.draft ?? props.published) as SluggedDocument | null;
  const existingSlug = document?.slug?.current;
  const generatedSlug = document?.title ? slugify(document.title) : '';

  useEffect(() => {
    if (isPublishing && !props.draft) setIsPublishing(false);
  }, [isPublishing, props.draft]);

  return {
    disabled: Boolean(publish.disabled) || (!existingSlug && !generatedSlug),
    label: isPublishing ? 'Publication…' : 'Publier',
    onHandle: () => {
      setIsPublishing(true);

      if (!existingSlug) {
        patch.execute([{ set: { slug: { _type: 'slug', current: generatedSlug } } }]);
      }

      publish.execute();
    },
  };
};

SlugOnPublishAction.action = 'publish';

/** Une copie doit recevoir sa propre URL lors de sa première publication. */
export function createSlugAwareDuplicateAction(
  originalAction: DuplicateDocumentActionComponent,
  { label, fallbackTitle }: { label: string; fallbackTitle: string },
): DuplicateDocumentActionComponent {
  return function SlugAwareDuplicateAction(props) {
    const action = originalAction({
      ...props,
      mapDocument: ({ slug: _slug, title, ...document }) => ({
        ...document,
        title: title ? `${title} — copie` : `${fallbackTitle} — copie`,
      }),
    });

    return action ? { ...action, label } : null;
  };
}

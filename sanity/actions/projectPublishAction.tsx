import { useEffect, useState } from 'react';
import {
  useDocumentOperation,
  type DocumentActionComponent,
  type DuplicateDocumentActionComponent,
} from 'sanity';

type ProjectDocument = {
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

/** Génère l'URL technique à la première publication, sans champ à gérer dans le Studio. */
export const ProjectPublishAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isPublishing, setIsPublishing] = useState(false);
  const project = (props.draft ?? props.published) as ProjectDocument | null;
  const existingSlug = project?.slug?.current;
  const generatedSlug = project?.title ? slugify(project.title) : '';

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

ProjectPublishAction.action = 'publish';

/** Une copie doit recevoir sa propre URL lors de sa première publication. */
export function createProjectDuplicateAction(
  originalAction: DuplicateDocumentActionComponent,
): DuplicateDocumentActionComponent {
  return function ProjectDuplicateAction(props) {
    const action = originalAction({
      ...props,
      mapDocument: ({ slug: _slug, title, ...document }) => ({
        ...document,
        title: title ? `${title} — copie` : 'Projet sans titre — copie',
      }),
    });

    return action ? { ...action, label: 'Dupliquer le projet' } : null;
  };
}

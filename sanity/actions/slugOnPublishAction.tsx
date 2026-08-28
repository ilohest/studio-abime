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
 * Tient l'URL technique alignée sur le titre, à chaque publication, sans champ
 * à gérer dans le Studio. Partagé par les projets et les articles du Journal :
 * dans les deux cas, l'éditeur saisit un titre, jamais un slug.
 *
 * ── Pourquoi à CHAQUE publication, et non à la première ─────────────────────
 * La règle précédente ne posait le slug que s'il n'y en avait pas. Un document
 * publié une fois sous un titre provisoire gardait donc cette URL pour
 * toujours : c'est ainsi que « Jacqueline Atelier. » se retrouvait servi à
 * l'adresse `/experiences/projet-3`, sans que rien dans le back-office ne le
 * laisse voir — le champ y est masqué.
 *
 * ⚠️ UNE URL PUBLIÉE CHANGE DONC AVEC SON TITRE. Tant que le site n'est pas
 *    indexé, c'est exactement ce qu'on veut. Une fois en ligne, retoucher un
 *    titre — même pour une coquille — déplace la page : l'ancienne adresse ne
 *    répond plus, et les liens déjà partagés tombent. Le jour où cela devient
 *    un risque réel, la parade est de conserver les slugs précédents et de les
 *    rediriger, plutôt que de revenir à un slug figé qui ment sur son titre.
 *
 * Un titre vide ne touche à rien : mieux vaut garder l'ancienne URL que la
 * remplacer par une vide, qui dépublierait la page.
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

      if (generatedSlug && generatedSlug !== existingSlug) {
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

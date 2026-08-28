import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Card, Code, Flex, Stack, Text } from '@sanity/ui';
import {
  useDocumentOperation,
  type DocumentActionComponent,
  type DuplicateDocumentActionComponent,
} from 'sanity';

type SluggedDocument = {
  title?: string;
  slug?: { current?: string };
  previousSlugs?: string[];
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
 * ═══════════════════════════════════════════════════════════════════════════
 * PUBLIER, ET NE CASSER AUCUN LIEN AU PASSAGE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagé par les projets et les articles du Journal. Deux comportements, selon
 * qu'il s'agit d'une première publication ou d'un changement d'adresse.
 *
 * ── 1. Première publication : l'adresse est tirée du titre ──────────────────
 * Un document sans adresse en reçoit une, dérivée de son titre. L'éditrice n'a
 * jamais à en saisir une : elle écrit un titre, l'adresse suit.
 *
 * Ensuite, l'adresse ne bouge plus toute seule. Renommer une page ne la déplace
 * pas — un titre se retouche pour une coquille, une adresse publiée est une
 * promesse faite à qui l'a copiée (voir `sanity/lib/slugFields.ts`).
 *
 * ── 2. Changement délibéré : on propose la redirection ──────────────────────
 * Corriger l'adresse à la main reste possible, et c'est même nécessaire — une
 * page publiée sous un titre provisoire garderait sinon son adresse provisoire
 * pour toujours. Mais ce geste déplace une page déjà en ligne.
 *
 * Le Studio pose donc la question au moment où le changement devient public,
 * c'est-à-dire à la publication, et non pendant la saisie : tant qu'on est en
 * brouillon, rien n'a bougé et la question n'a pas lieu d'être.
 *
 * Répondre « rediriger » verse l'ancienne adresse dans `previousSlugs`, d'où le
 * build tire une redirection permanente (voir `astro.config.ts`). Répondre
 * « déplacer sans rediriger » est un choix légitime — une page jamais partagée,
 * une adresse saisie de travers deux minutes plus tôt — mais c'en est un, pris
 * en connaissance de cause plutôt que par défaut.
 */
export const SlugOnPublishAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isPublishing, setIsPublishing] = useState(false);
  const [askRedirect, setAskRedirect] = useState(false);

  const draft = props.draft as SluggedDocument | null;
  const published = props.published as SluggedDocument | null;
  const document = draft ?? published;

  const currentSlug = document?.slug?.current;
  const publishedSlug = published?.slug?.current;
  const generatedSlug = document?.title ? slugify(document.title) : '';

  /*
    L'adresse change-t-elle une page DÉJÀ EN LIGNE ? Un brouillon jamais publié
    n'a pas d'adresse à préserver : on ne lui pose pas la question.
  */
  const movesPublishedPage = Boolean(
    publishedSlug && currentSlug && publishedSlug !== currentSlug,
  );

  useEffect(() => {
    if (isPublishing && !props.draft) setIsPublishing(false);
  }, [isPublishing, props.draft]);

  /** Publie, en versant éventuellement l'ancienne adresse aux redirections. */
  const run = useCallback(
    (keepRedirect: boolean) => {
      setIsPublishing(true);
      setAskRedirect(false);

      const patches: Record<string, unknown>[] = [];

      if (!currentSlug && generatedSlug) {
        patches.push({ set: { slug: { _type: 'slug', current: generatedSlug } } });
      }

      if (keepRedirect && movesPublishedPage && publishedSlug) {
        /*
          `setIfMissing` puis `insert` : la liste peut ne pas exister encore, et
          on n'écrase jamais les adresses déjà mémorisées. Une adresse n'est
          gardée qu'une fois — corriger deux fois de suite en revenant au point
          de départ ne doit pas créer de doublon ni de redirection circulaire.
        */
        const already = document?.previousSlugs ?? [];
        if (!already.includes(publishedSlug)) {
          patches.push({ setIfMissing: { previousSlugs: [] } });
          patches.push({ insert: { after: 'previousSlugs[-1]', items: [publishedSlug] } });
        }
      }

      if (patches.length > 0) patch.execute(patches);
      publish.execute();
    },
    [currentSlug, generatedSlug, movesPublishedPage, publishedSlug, document, patch, publish],
  );

  return {
    disabled: Boolean(publish.disabled) || (!currentSlug && !generatedSlug),
    label: isPublishing ? 'Publication…' : 'Publier',
    onHandle: () => {
      if (movesPublishedPage) {
        setAskRedirect(true);
        return;
      }
      run(false);
    },
    dialog: askRedirect && {
      type: 'dialog',
      header: 'L’adresse de cette page change',
      onClose: () => setAskRedirect(false),
      content: (
        <Stack gap={4}>
          <Text size={1}>
            La page ne répondra plus à son ancienne adresse. Tous les liens déjà
            partagés — signets, e-mails, publications — mènent à celle-ci :
          </Text>

          <Card padding={3} radius={2} tone="caution">
            <Stack gap={3}>
              <Code size={1}>{publishedSlug}</Code>
              <Text size={1} muted>
                devient
              </Text>
              <Code size={1}>{currentSlug}</Code>
            </Stack>
          </Card>

          <Text size={1} muted>
            Une redirection fait suivre l’ancienne adresse vers la nouvelle. Elle
            ne coûte rien et reste en place définitivement.
          </Text>

          <Flex gap={2} justify="flex-end" wrap="wrap">
            <Box>
              <Button
                mode="bleed"
                text="Déplacer sans rediriger"
                onClick={() => run(false)}
              />
            </Box>
            <Box>
              <Button
                tone="primary"
                text="Rediriger l’ancienne adresse"
                onClick={() => run(true)}
              />
            </Box>
          </Flex>
        </Stack>
      ),
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
      /*
        La copie repart sans adresse ET sans redirections : celles de l'original
        appartiennent à l'original. Les faire suivre enverrait deux pages à se
        disputer les mêmes anciennes adresses.
      */
      mapDocument: ({ slug: _slug, previousSlugs: _previousSlugs, title, ...document }) => ({
        ...document,
        title: title ? `${title} — copie` : `${fallbackTitle} — copie`,
      }),
    });

    return action ? { ...action, label } : null;
  };
}

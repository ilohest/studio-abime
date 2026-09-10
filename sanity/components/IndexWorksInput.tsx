import { useEffect, useId, useMemo, useState } from 'react';
import {
  Autocomplete,
  Badge,
  Button,
  Card,
  Flex,
  Text,
  type BaseAutocompleteOption,
  type BadgeTone,
} from '@sanity/ui';
import {
  PatchEvent,
  set,
  unset,
  type ArrayOfObjectsInputProps,
  useFormValue,
  useWorkspace,
} from 'sanity';

interface WorkTarget {
  _id: string;
  _type: 'project' | 'post';
  title: string;
}

interface WorkValue {
  _key: string;
  _type: 'indexWork';
  reference?: { _type: 'reference'; _ref: string };
  /* Anciennes valeurs conservées dans les données, mais plus affichées. */
  label?: string;
  year?: string;
}

interface WorkOption extends BaseAutocompleteOption {
  title: string;
  typeLabel: string;
  tone: BadgeTone;
}

function workType(target: WorkTarget): Pick<WorkOption, 'typeLabel' | 'tone'> {
  return target._type === 'project'
    ? { typeLabel: 'Projet', tone: 'positive' }
    : { typeLabel: 'Journal', tone: 'caution' };
}

function itemKey(): string {
  return (
    globalThis.crypto?.randomUUID().replaceAll('-', '').slice(0, 12) ??
    Math.random().toString(36).slice(2, 14)
  );
}

export function IndexWorksInput(props: ArrayOfObjectsInputProps) {
  const autocompleteId = useId();
  const language = (useFormValue(['language']) as string | undefined) ?? 'fr';
  const workspace = useWorkspace();
  const client = useMemo(() => workspace.getClient({ apiVersion: '2025-02-19' }), [workspace]);
  const value = (props.value ?? []) as WorkValue[];
  const [targets, setTargets] = useState<WorkTarget[]>([]);

  useEffect(() => {
    let active = true;

    client
      .fetch<WorkTarget[]>(
        `*[
          _type in ["project", "post"] &&
          language == $language &&
          defined(title) &&
          defined(slug.current)
        ] | order(title asc) { _id, _type, title }`,
        { language },
      )
      .then((documents) => {
        if (active) setTargets(documents);
      })
      .catch(() => {
        if (active) setTargets([]);
      });

    return () => {
      active = false;
    };
  }, [client, language]);

  const selectedIds = useMemo(
    () => new Set(value.map((item) => item.reference?._ref).filter(Boolean)),
    [value],
  );
  const available = targets.filter((target) => !selectedIds.has(target._id));
  const options = useMemo<WorkOption[]>(
    () =>
      available.map((target) => ({
        value: target._id,
        title: target.title,
        ...workType(target),
      })),
    [available],
  );

  const commit = (next: WorkValue[]) =>
    props.onChange(PatchEvent.from(next.length > 0 ? set(next) : unset()));

  const add = (referenceId: string) => {
    if (!referenceId || selectedIds.has(referenceId)) return;
    commit([
      ...value,
      {
        _key: itemKey(),
        _type: 'indexWork',
        reference: { _type: 'reference', _ref: referenceId },
      },
    ]);
  };

  return (
    <Flex direction="column" gap={3}>
      <Autocomplete<WorkOption>
        id={autocompleteId}
        value=""
        options={options}
        openButton
        openOnFocus
        placeholder="Ajouter une œuvre…"
        filterOption={(query, option) =>
          `${option.title} ${option.typeLabel}`.toLocaleLowerCase('fr').includes(
            query.toLocaleLowerCase('fr'),
          )
        }
        onSelect={add}
        renderValue={() => ''}
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

      {value.map((item) => {
        const target = targets.find((candidate) => candidate._id === item.reference?._ref);
        return (
          <Card key={item._key} border padding={3} radius={2}>
            <Flex align="center" justify="space-between" gap={3}>
              <Flex direction="column" gap={2}>
                <Text size={1} weight="semibold">
                  {target?.title || 'Document indisponible'}
                </Text>
                {target && (
                  <Badge
                    fontSize={0}
                    tone={workType(target).tone}
                    radius={5}
                  >
                    {workType(target).typeLabel}
                  </Badge>
                )}
              </Flex>
              <Button
                fontSize={1}
                mode="bleed"
                padding={2}
                text="Retirer"
                tone="critical"
                onClick={() => commit(value.filter((candidate) => candidate._key !== item._key))}
              />
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}

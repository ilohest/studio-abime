import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2025-02-19' });

type LegacyNote = { _key?: string; text?: string; position?: number };
type Settings = {
  _id: string;
  projectsIntro?: string;
  projectsNotes?: LegacyNote[];
};
type ProjectsPage = {
  _id: string;
  title?: string;
  intro?: string;
  editorialCards?: unknown[];
};

async function main() {
  const language = 'fr';
  const documentId = `projectsPage-${language}`;
  const [settings, current] = await Promise.all([
    client.fetch<Settings | null>(
      '*[_type == "localizedSettings" && language == $language][0]{_id, projectsIntro, projectsNotes}',
      { language },
    ),
    client.getDocument<ProjectsPage>(documentId),
  ]);

  if (!settings) throw new Error('Réglages français introuvables : migration interrompue.');

  const migratedTextCards = (settings.projectsNotes ?? [])
    .filter((note) => note.text?.trim())
    .map((note, index) => ({
      _key: note._key || `legacy-text-${index + 1}`,
      _type: 'projectsEditorialCard',
      kind: 'text',
      text: note.text?.trim(),
      ...(note.position ? { position: note.position } : {}),
    }));

  const initialCards = [
    {
      _key: 'empty-card-2',
      _type: 'projectsEditorialCard',
      kind: 'empty',
      position: 2,
    },
    ...migratedTextCards,
  ];

  const transaction = client.transaction();

  if (!current) {
    transaction.createIfNotExists({
      _id: documentId,
      _type: 'projectsPage',
      language,
      title: 'Projets',
      ...(settings.projectsIntro?.trim() ? { intro: settings.projectsIntro.trim() } : {}),
      editorialCards: initialCards,
    });
  } else {
    const missing: Record<string, unknown> = {};
    if (!current.title) missing.title = 'Projets';
    if (!current.intro && settings.projectsIntro?.trim()) missing.intro = settings.projectsIntro.trim();
    if (!current.editorialCards?.length) missing.editorialCards = initialCards;
    if (Object.keys(missing).length > 0) transaction.patch(documentId, (patch) => patch.set(missing));
  }

  transaction.patch(settings._id, (patch) => patch.unset(['projectsIntro', 'projectsNotes']));
  await transaction.commit();

  console.log(
    JSON.stringify(
      {
        status: current ? 'merged' : 'created',
        documentId,
        legacySettingsCleaned: settings._id,
        migratedTextCards: migratedTextCards.length,
      },
      null,
      2,
    ),
  );
}

await main();

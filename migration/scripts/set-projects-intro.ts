import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2025-02-19' });
const fallbackIntro =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

async function main() {
  const settings = await client.fetch<{ _id: string; projectsIntro?: string } | null>(
    '*[_type == "localizedSettings" && language == "fr"][0]{_id, projectsIntro}',
  );

  if (!settings) throw new Error('Réglages français introuvables.');

  if (settings.projectsIntro?.trim()) {
    console.log(JSON.stringify({ status: 'already-set', id: settings._id }, null, 2));
    return;
  }

  await client.patch(settings._id).set({ projectsIntro: fallbackIntro }).commit();
  console.log(JSON.stringify({ status: 'updated', id: settings._id }, null, 2));
}

await main();

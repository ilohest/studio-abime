import type { APIRoute } from 'astro';

export const prerender = false;

const MAX_BODY_SIZE = 20_000;
const allowedPhases = new Set(['idee', 'germe', 'evoluer', 'muter']);

const asText = (form: FormData, key: string, limit: number) =>
  String(form.get(key) ?? '').trim().slice(0, limit);

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: 'Origine non autorisée.' }, 403);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_SIZE) return json({ error: 'Message trop volumineux.' }, 413);

  const form = await request.formData();
  if (asText(form, 'company', 200)) return json({ ok: true });

  const submission = {
    fullName: asText(form, 'fullName', 120),
    contact: asText(form, 'contact', 180),
    project: asText(form, 'project', 280),
    phase: asText(form, 'phase', 40),
    unsaid: asText(form, 'unsaid', 2400),
    resources: asText(form, 'resources', 1600),
    start: asText(form, 'start', 180),
    availability: asText(form, 'availability', 1000),
  };

  if (Object.values(submission).some((value) => !value) || !allowedPhases.has(submission.phase)) {
    return json({ error: 'Certains champs sont manquants ou invalides.' }, 400);
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  const from = import.meta.env.CONTACT_FROM_EMAIL;
  const to = import.meta.env.CONTACT_TO_EMAIL || 'elodie@studioabime.com';

  if (!apiKey || !from) {
    console.error('[contact] RESEND_API_KEY ou CONTACT_FROM_EMAIL manquant.');
    return json({ error: 'Service d’envoi non configuré.' }, 503);
  }

  const phaseLabels: Record<string, string> = {
    idee: 'L’idée',
    germe: 'Germe',
    evoluer: 'Il existe mais doit évoluer',
    muter: 'Il existe mais doit muter',
  };

  const entries = [
    ['Nom & prénom', submission.fullName],
    ['Contact', submission.contact],
    ['Projet', submission.project],
    ['Phase', phaseLabels[submission.phase] ?? submission.phase],
    ['Ce qui ne se dit pas encore', submission.unsaid],
    ['Ressources', submission.resources],
    ['Début souhaité', submission.start],
    ['Temps disponible', submission.availability],
  ];

  const text = entries.map(([label, value]) => `${label}\n${value}`).join('\n\n');
  const html = entries
    .map(
      ([label, value]) =>
        `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value).replaceAll('\n', '<br>')}</p>`,
    )
    .join('');

  const replyTo = submission.contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Nouvelle enquête — ${submission.fullName}`,
      text,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    console.error('[contact] Échec de l’envoi Resend :', response.status);
    return json({ error: 'Le message n’a pas pu être envoyé.' }, 502);
  }

  return json({ ok: true });
};

import type { APIRoute } from 'astro';
import {
  contactConfirmationEmail,
  contactNotificationEmail,
  type ContactEmail,
  type ContactSubmission,
} from '~/lib/email/contactEmails';

export const prerender = false;

const MAX_BODY_SIZE = 20_000;
const allowedPhases = new Set(['idee', 'germe', 'evoluer', 'muter']);

const asText = (form: FormData, key: string, limit: number) =>
  String(form.get(key) ?? '').trim().slice(0, limit);

/**
 * Numéro de fiche : « 260908-GL » — la date d'ouverture, puis les INITIALES du
 * nom déclaré. Il est composé par le navigateur pendant que le visiteur écrit
 * son nom, pour qu'il le voie se former.
 *
 * Le serveur ne lui fait pas confiance pour autant — c'est une valeur de
 * formulaire comme une autre : il vérifie la forme et en attribue une lui-même
 * si elle ne tient pas, ou si la page a été remplie sans JavaScript. Il la
 * reconstruit alors À PARTIR DU NOM REÇU, et non au hasard : la cote doit dire
 * la même chose quel que soit le chemin par lequel la fiche est arrivée.
 */
const REFERENCE_PATTERN = /^\d{6}-[A-Z]{1,4}$/;

const initialsFrom = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word[0]!.toUpperCase())
    .join('');

const issueReference = (fullName: string) => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

  /*
    Un nom sans une seule lettre latine — écriture non latine, saisie
    fantaisiste — ne donne pas d'initiales : deux lettres tirées au sort
    valent mieux qu'une cote tronquée à sa date.
  */
  const initials = initialsFrom(fullName);
  if (initials) return `${day}-${initials}`;

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const draw = crypto.getRandomValues(new Uint8Array(2));
  return `${day}-${Array.from(draw, (value) => alphabet[value % alphabet.length]).join('')}`;
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

interface ResendPayload extends ContactEmail {
  from: string;
  to: string[];
  reply_to?: string;
}

const sendEmail = (apiKey: string, payload: ResendPayload) =>
  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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

  const claimedReference = asText(form, 'reference', 11);
  const fullName = asText(form, 'fullName', 120);

  const submission: ContactSubmission = {
    reference: REFERENCE_PATTERN.test(claimedReference)
      ? claimedReference
      : issueReference(fullName),
    fullName,
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
  const replyToStudio = import.meta.env.CONTACT_REPLY_TO_EMAIL || to;

  if (!apiKey || !from) {
    console.error('[contact] RESEND_API_KEY ou CONTACT_FROM_EMAIL manquant.');
    return json({ error: 'Service d’envoi non configuré.' }, 503);
  }

  const clientEmail = submission.contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const notification = contactNotificationEmail(submission);
  const notificationResponse = await sendEmail(apiKey, {
    from,
    to: [to],
    ...notification,
    ...(clientEmail ? { reply_to: clientEmail } : {}),
  });

  if (!notificationResponse.ok) {
    console.error('[contact] Échec de la notification à Élodie :', notificationResponse.status);
    return json({ error: 'Le message n’a pas pu être envoyé.' }, 502);
  }

  let confirmationSent = false;
  if (clientEmail) {
    const confirmation = contactConfirmationEmail(submission);
    const confirmationResponse = await sendEmail(apiKey, {
      from,
      to: [clientEmail],
      reply_to: replyToStudio,
      ...confirmation,
    });

    confirmationSent = confirmationResponse.ok;
    if (!confirmationResponse.ok) {
      console.error('[contact] Échec de la confirmation client :', confirmationResponse.status);
    }
  }

  return json({ ok: true, confirmationSent });
};

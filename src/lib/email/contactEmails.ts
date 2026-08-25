export interface ContactSubmission {
  fullName: string;
  contact: string;
  project: string;
  phase: string;
  unsaid: string;
  resources: string;
  start: string;
  availability: string;
}

export interface ContactEmail {
  subject: string;
  text: string;
  html: string;
}

const phaseLabels: Record<string, string> = {
  idee: 'L’idée',
  germe: 'Germe',
  evoluer: 'Il existe mais doit évoluer',
  muter: 'Il existe mais doit muter',
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const withLineBreaks = (value: string) => escapeHtml(value).replaceAll('\n', '<br>');

const emailShell = (preheader: string, content: string) => `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Studio Abîme</title>
  </head>
  <body style="margin:0;background:#efebe2;color:#2d2a29;font-family:Georgia,'Times New Roman',serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#efebe2;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;">
            <tr>
              <td style="padding:0 0 30px;font-family:'Courier New',monospace;font-size:20px;letter-spacing:.04em;text-transform:uppercase;">
                Studio Abîme
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #bdb9b1;padding:30px 0;font-size:17px;line-height:1.55;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #bdb9b1;padding:22px 0 0;color:#66615d;font-family:'Courier New',monospace;font-size:12px;line-height:1.5;">
                studio-abime.com · elodie@studioabime.com
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const submissionEntries = (submission: ContactSubmission) => [
  ['Nom & prénom', submission.fullName],
  ['Contact', submission.contact],
  ['Projet, en une phrase', submission.project],
  ['Phase', phaseLabels[submission.phase] ?? submission.phase],
  ['Ce qui ne se dit pas encore', submission.unsaid],
  ['Ressources', submission.resources],
  ['Début souhaité', submission.start],
  ['Temps disponible', submission.availability],
] as const;

export const contactNotificationEmail = (submission: ContactSubmission): ContactEmail => {
  const entries = submissionEntries(submission);
  const text = [
    `Nouvelle enquête de ${submission.fullName}`,
    ...entries.map(([label, value]) => `${label}\n${value}`),
  ].join('\n\n');

  const rows = entries
    .map(
      ([label, value]) => `
        <tr>
          <td style="width:34%;padding:14px 16px 14px 0;border-top:1px solid #d8d4cb;vertical-align:top;font-family:'Courier New',monospace;font-size:12px;line-height:1.4;text-transform:uppercase;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:14px 0;border-top:1px solid #d8d4cb;vertical-align:top;">
            ${withLineBreaks(value)}
          </td>
        </tr>`,
    )
    .join('');

  return {
    subject: `Nouvelle enquête — ${submission.fullName}`,
    text,
    html: emailShell(
      `Nouvelle enquête de ${submission.fullName}`,
      `<p style="margin:0 0 26px;font-family:'Courier New',monospace;font-size:22px;line-height:1.25;">Nouvelle enquête</p>
       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows}</table>`,
    ),
  };
};

export const contactConfirmationEmail = (submission: ContactSubmission): ContactEmail => {
  const text = `Bonjour ${submission.fullName},

Nous avons bien reçu votre message, merci.

Parfois quelques jours, parfois un peu plus quand un projet en cours demande toute notre attention. Si vous êtes sans nouvelles au bout de deux semaines, votre message s’est perdu quelque part : réécrivez-nous sans hésiter.

Studio Abîme
elodie@studioabime.com`;

  return {
    subject: 'Nous avons bien reçu votre message — Studio Abîme',
    text,
    html: emailShell(
      'Votre message est bien arrivé au Studio.',
      `<p style="margin:0 0 24px;">Bonjour ${escapeHtml(submission.fullName)},</p>
       <p style="margin:0 0 24px;font-family:'Courier New',monospace;font-size:21px;line-height:1.35;">Nous avons bien reçu votre message, merci.</p>
       <p style="margin:0;">Parfois quelques jours, parfois un peu plus quand un projet en cours demande toute notre attention. Si vous êtes sans nouvelles au bout de deux semaines, votre message s’est perdu quelque part&nbsp;: réécrivez-nous sans hésiter.</p>`,
    ),
  };
};

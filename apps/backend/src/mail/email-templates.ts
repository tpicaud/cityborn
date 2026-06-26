import { resolve } from 'node:path';
import type { SendMailOptions } from './providers/mail.provider';

const logoContentId = 'cityborn-logo';
const logoPath = resolve(
  __dirname,
  '../../../frontend/assets/logo-transparent.png',
);

type EmailTemplateHeaderParams = {
  preheader: string;
  title: string;
};

const buildEmailTemplateHeader = ({
  preheader,
  title,
}: EmailTemplateHeaderParams): string => `
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="x-apple-disable-message-reformatting">
          <title>${escapeHtml(title)}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f1f8f8; color:#243b3b; font-family:Avenir, 'Avenir Next', Arial, sans-serif;">
          <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
            ${escapeHtml(preheader)}
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; background-color:#f1f8f8;">
            <tr>
              <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 12px 32px rgba(0, 87, 87, 0.12);">
                  <tr>
                    <td align="center" style="padding:30px 32px 28px; background-color:#008988; background-image:linear-gradient(135deg, #008988 0%, #00bcbc 100%);">
                      <img src="cid:${logoContentId}" width="82" height="82" alt="Logo Cityborn" style="display:block; width:82px; height:82px; border:0; border-radius:18px;">
                      <div style="padding-top:12px; color:#ffffff; font-size:24px; line-height:30px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase;">
                        Cityborn
                      </div>
                      <div style="padding-top:5px; color:#d9fffb; font-size:13px; line-height:20px; letter-spacing:0.3px;">
                        Trouve leur origine !
                      </div>
                    </td>
                  </tr>
`;

const emailTemplateFooter = `
                  <tr>
                    <td align="center" style="padding:24px 32px; background-color:#006f6e;">
                      <p style="margin:0; color:#ffffff; font-size:13px; line-height:20px; font-weight:700;">
                        L'équipe Cityborn
                      </p>
                      <p style="margin:4px 0 0; color:#bff8f3; font-size:12px; line-height:18px;">
                        Explorez, devinez, mémorisez.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
`;

type VerificationEmailParams = {
  email: string;
  frontendUrl: string;
  verificationToken: string;
  username: string;
};

type MailTemplateParams = {
  'verification-email': VerificationEmailParams;
};

type BuildMailOptionsArgs = {
  [TemplateName in keyof MailTemplateParams]: [
    templateName: TemplateName,
    templateParams: MailTemplateParams[TemplateName],
  ];
}[keyof MailTemplateParams];

export function buildMailOptions(
  ...args: BuildMailOptionsArgs
): SendMailOptions {
  switch (args[0]) {
    case 'verification-email':
      return buildVerificationEmail(args[1]);
  }
}

function buildVerificationEmail({
  email,
  frontendUrl,
  verificationToken,
  username,
}: VerificationEmailParams): SendMailOptions {
  const verificationUrl = new URL('/verify-email', frontendUrl);
  verificationUrl.searchParams.set('verification_token', verificationToken);
  const escapedUsername = escapeHtml(username);
  const verificationHref = escapeHtml(verificationUrl.toString());

  return {
    to: email,
    subject: 'Vérifiez votre adresse e-mail Cityborn',
    text: [
      `Bonjour ${username},`,
      '',
      'Bienvenue sur Cityborn !',
      'Confirmez votre adresse e-mail pour finaliser la création de votre compte :',
      verificationUrl.toString(),
      '',
      'Ce lien est valable pendant 24 heures.',
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
      '',
      "L'équipe Cityborn",
    ].join('\n'),
    html: `
      ${buildEmailTemplateHeader({
        preheader: "Plus qu'une étape pour commencer votre aventure Cityborn.",
        title: 'Vérifiez votre adresse e-mail Cityborn',
      })}
                  <tr>
                    <td style="padding:42px 44px 20px;">
                      <h1 style="margin:0 0 20px; color:#008988; font-size:28px; line-height:36px; font-weight:800;">
                        Bienvenue, ${escapedUsername} !
                      </h1>
                      <p style="margin:0 0 16px; color:#3f5555; font-size:16px; line-height:26px;">
                        Votre compte est presque prêt. Confirmez votre adresse e-mail pour finaliser votre inscription et commencer à explorer le monde avec Cityborn.
                      </p>
                      <p style="margin:0 0 28px; color:#3f5555; font-size:16px; line-height:26px;">
                        Il vous suffit de cliquer sur le bouton ci-dessous :
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                        <tr>
                          <td align="center" bgcolor="#ff7600" style="border-radius:12px; mso-padding-alt:15px 28px;">
                            <a href="${verificationHref}" style="display:inline-block; padding:15px 28px; color:#ffffff; font-size:16px; line-height:20px; font-weight:800; text-decoration:none; border-radius:12px;">
                              Vérifier mon adresse e-mail
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; margin-top:30px;">
                        <tr>
                          <td style="padding:16px 18px; background-color:#ecfffc; border-left:4px solid #7efaed; border-radius:8px;">
                            <p style="margin:0; color:#486262; font-size:14px; line-height:22px;">
                              Ce lien est valable pendant <strong style="color:#008988;">24 heures</strong>.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:28px 0 0; color:#6d7f7f; font-size:13px; line-height:21px;">
                        Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :
                      </p>
                      <p style="margin:6px 0 0; font-size:12px; line-height:19px; word-break:break-all;">
                        <a href="${verificationHref}" style="color:#008988; text-decoration:underline;">${verificationHref}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 44px 32px;">
                      <div style="height:1px; background-color:#dceaea; font-size:0; line-height:0;">&nbsp;</div>
                      <p style="margin:22px 0 0; color:#7b8c8c; font-size:13px; line-height:21px; text-align:center;">
                        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
                      </p>
                    </td>
                  </tr>
                  ${emailTemplateFooter}
    `,
    attachments: [
      {
        filename: 'logo-transparent.png',
        path: logoPath,
        cid: logoContentId,
        contentDisposition: 'inline',
      },
    ],
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

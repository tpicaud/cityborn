import { resolve } from 'node:path';
import type {
  MailAttachment,
  SendMailOptions,
} from './providers/mail.provider';

const logoFilename: string = 'logo-transparent.png';
const logoContentId: string = logoFilename;
const logoPath: string = resolve(
  __dirname,
  '../../frontend/assets/logo-transparent.png',
);

function buildLogoAttachment(): MailAttachment {
  return {
    filename: logoFilename,
    path: logoPath,
    cid: logoContentId,
    contentDisposition: 'inline',
  };
}

type EmailTemplateHeaderParams = {
  preheader: string;
  title: string;
};

type ActionEmailParams = {
  email: string;
  subject: string;
  text: string;
  preheader: string;
  title: string;
  introduction: string;
  actionUrl: URL;
  actionLabel: string;
  validityDuration: string;
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

const buildEmailTemplateFooter = (): string => `
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
  'password-reset': {
    email: string;
    username: string;
    token: string;
    frontendUrl: string;
  };
  'password-changed': { email: string; username: string };
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
    case 'password-reset':
      return buildPasswordResetEmail(args[1]);
    case 'password-changed':
      return buildPasswordChangedEmail(args[1]);
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
  const verificationUrl: URL = new URL('/verify-email', frontendUrl);
  verificationUrl.searchParams.set('verification_token', verificationToken);

  return buildActionEmail({
    email,
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
    preheader: "Plus qu'une étape pour commencer votre aventure Cityborn.",
    title: `Bienvenue, ${username} !`,
    introduction:
      'Votre compte est presque prêt. Confirmez votre adresse e-mail pour finaliser votre inscription et commencer à explorer le monde avec Cityborn.',
    actionUrl: verificationUrl,
    actionLabel: 'Vérifier mon adresse e-mail',
    validityDuration: '24 heures',
  });
}

function buildActionEmail(params: ActionEmailParams): SendMailOptions {
  const actionHref: string = escapeHtml(params.actionUrl.toString());

  return {
    to: params.email,
    subject: params.subject,
    text: params.text,
    html: `
      ${buildEmailTemplateHeader({
        preheader: params.preheader,
        title: params.subject,
      })}
                  <tr>
                    <td style="padding:42px 44px 20px;">
                      <h1 style="margin:0 0 20px; color:#008988; font-size:28px; line-height:36px; font-weight:800;">
                        ${escapeHtml(params.title)}
                      </h1>
                      <p style="margin:0 0 16px; color:#3f5555; font-size:16px; line-height:26px;">
                        ${escapeHtml(params.introduction)}
                      </p>
                      <p style="margin:0 0 28px; color:#3f5555; font-size:16px; line-height:26px;">
                        Il vous suffit de cliquer sur le bouton ci-dessous :
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                        <tr>
                          <td align="center" bgcolor="#ff7600" style="border-radius:12px; mso-padding-alt:15px 28px;">
                            <a href="${actionHref}" style="display:inline-block; padding:15px 28px; color:#ffffff; font-size:16px; line-height:20px; font-weight:800; text-decoration:none; border-radius:12px;">
                              ${escapeHtml(params.actionLabel)}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; margin-top:30px;">
                        <tr>
                          <td style="padding:16px 18px; background-color:#ecfffc; border-left:4px solid #7efaed; border-radius:8px;">
                            <p style="margin:0; color:#486262; font-size:14px; line-height:22px;">
                              Ce lien est valable pendant <strong style="color:#008988;">${escapeHtml(params.validityDuration)}</strong>.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:28px 0 0; color:#6d7f7f; font-size:13px; line-height:21px;">
                        Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :
                      </p>
                      <p style="margin:6px 0 0; font-size:12px; line-height:19px; word-break:break-all;">
                        <a href="${actionHref}" style="color:#008988; text-decoration:underline;">${actionHref}</a>
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
                  ${buildEmailTemplateFooter()}
    `,
    attachments: [buildLogoAttachment()],
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

function buildPasswordResetEmail(
  params: MailTemplateParams['password-reset'],
): SendMailOptions {
  const url: URL = new URL('/reset-password', params.frontendUrl);
  url.hash = new URLSearchParams({ token: params.token }).toString();
  const subject: string = 'Réinitialisez votre mot de passe Cityborn';
  return buildActionEmail({
    email: params.email,
    subject,
    text: `Bonjour ${params.username},\nRéinitialisez votre mot de passe : ${url.toString()}\nCe lien expire dans 30 minutes. Si vous n’avez pas demandé ce changement, ignorez cet e-mail.`,
    preheader: 'Choisissez un nouveau mot de passe pour votre compte Cityborn.',
    title: `Bonjour ${params.username},`,
    introduction:
      'Vous avez demandé la réinitialisation de votre mot de passe Cityborn. Choisissez un nouveau mot de passe pour retrouver l’accès à votre compte.',
    actionUrl: url,
    actionLabel: 'Réinitialiser mon mot de passe',
    validityDuration: '30 minutes',
  });
}

function buildPasswordChangedEmail(
  params: MailTemplateParams['password-changed'],
): SendMailOptions {
  const subject: string = 'Votre mot de passe Cityborn a été modifié';
  const message: string =
    'Votre mot de passe a bien été modifié. Toutes vos anciennes sessions ont été déconnectées. Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe depuis la connexion Cityborn.';
  return {
    to: params.email,
    subject,
    text: `Bonjour ${params.username},\n\n${message}\n\nL’équipe Cityborn`,
    html: `
      ${buildEmailTemplateHeader({
        preheader: 'Votre nouveau mot de passe est prêt à être utilisé.',
        title: subject,
      })}
                  <tr>
                    <td style="padding:42px 44px 32px;">
                      <h1 style="margin:0 0 20px; color:#008988; font-size:28px; line-height:36px; font-weight:800;">
                        Votre mot de passe a été modifié
                      </h1>
                      <p style="margin:0 0 16px; color:#3f5555; font-size:16px; line-height:26px;">
                        Bonjour ${escapeHtml(params.username)},
                      </p>
                      <p style="margin:0 0 16px; color:#3f5555; font-size:16px; line-height:26px;">
                        Votre mot de passe a bien été modifié. Toutes vos anciennes sessions ont été déconnectées.
                      </p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; margin-top:30px;">
                        <tr>
                          <td style="padding:16px 18px; background-color:#ecfffc; border-left:4px solid #7efaed; border-radius:8px;">
                            <p style="margin:0; color:#486262; font-size:14px; line-height:22px;">
                              Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe depuis la connexion Cityborn.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
      ${buildEmailTemplateFooter()}
    `,
    attachments: [buildLogoAttachment()],
  };
}

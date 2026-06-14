import type { SendMailOptions } from '../mail.types';

type VerificationEmailParams = {
  email: string;
  frontendUrl: string;
  verificationToken: string;
  username: string;
};

export function buildVerificationEmail({
  email,
  frontendUrl,
  verificationToken,
  username,
}: VerificationEmailParams): SendMailOptions {
  const verificationUrl = new URL('/verify-email', frontendUrl);
  verificationUrl.searchParams.set('verification_token', verificationToken);

  return {
    to: email,
    subject: 'Verification de votre email CityBorn',
    text: [
      `Bonjour ${username},`,
      '',
      'Bienvenue sur CityBorn.',
      'Cliquez sur le lien suivant pour verifier votre adresse email :',
      verificationUrl.toString(),
      '',
      'Ce lien est valable 24 heures.',
    ].join('\n'),
    html: `
      <p>Bonjour ${escapeHtml(username)},</p>
      <p>Bienvenue sur CityBorn.</p>
      <p>Cliquez sur le lien ci-dessous pour verifier votre adresse email :</p>
      <p><a href="${verificationUrl.toString()}">Verifier mon email</a></p>
      <p>Ce lien est valable 24 heures.</p>
    `,
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

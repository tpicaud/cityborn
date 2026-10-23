import { buildMailOptions } from './email-templates';
import type { SendMailOptions } from './providers/mail.provider';

describe('buildMailOptions', () => {
  it('links the verification email to the verification page with its token', () => {
    const mailOptions: SendMailOptions = buildMailOptions(
      'verification-email',
      {
        email: 'alice@cityborn.test',
        frontendUrl: 'https://cityborn.test',
        verificationToken: 'verification-token',
        username: 'alice',
      },
    );

    expect(mailOptions.to).toBe('alice@cityborn.test');
    expect(mailOptions.text).toContain(
      'https://cityborn.test/verify-email?verification_token=verification-token',
    );
  });

  it('links the password reset email to the reset page with its token and validity', () => {
    const mailOptions: SendMailOptions = buildMailOptions(
      'password-reset-email',
      {
        email: 'alice@cityborn.test',
        frontendUrl: 'https://cityborn.test',
        passwordResetToken: 'reset-token',
        username: 'alice',
        validityMinutes: 60,
      },
    );

    expect(mailOptions.text).toContain(
      'https://cityborn.test/reset-password?token=reset-token',
    );
    expect(mailOptions.text).toContain('valable pendant 60 minutes');
  });

  it('gives the existing account email the sign-in and password reset links', () => {
    const mailOptions: SendMailOptions = buildMailOptions(
      'existing-account-email',
      {
        email: 'alice@cityborn.test',
        frontendUrl: 'https://cityborn.test',
        username: 'alice',
      },
    );

    expect(mailOptions.text).toContain('Me connecter : https://cityborn.test/');
    expect(mailOptions.text).toContain(
      'Réinitialiser mon mot de passe : https://cityborn.test/forgot-password',
    );
  });

  it('escapes the username in the HTML body', () => {
    const mailOptions: SendMailOptions = buildMailOptions(
      'verification-email',
      {
        email: 'alice@cityborn.test',
        frontendUrl: 'https://cityborn.test',
        verificationToken: 'verification-token',
        username: '<alice>',
      },
    );

    expect(mailOptions.html).toContain('&lt;alice&gt;');
    expect(mailOptions.html).not.toContain('<alice>');
  });
});

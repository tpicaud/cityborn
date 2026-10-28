import { existsSync } from 'node:fs';
import { buildMailOptions } from './email-templates';
import type { SendMailOptions } from './providers/mail.provider';

describe('buildMailOptions', () => {
  it('links an existing account email to sign in and password reset', () => {
    const mail: SendMailOptions = buildMailOptions('existing-account-email', {
      email: 'alice@cityborn.test',
      frontendUrl: 'https://cityborn.test',
      username: '<alice>',
    });

    expect(mail.to).toBe('alice@cityborn.test');
    expect(mail.text).toContain('Me connecter : https://cityborn.test/');
    expect(mail.text).toContain(
      'Réinitialiser mon mot de passe : https://cityborn.test/forgot-password',
    );
    expect(mail.html).toContain('&lt;alice&gt;');
    expect(mail.html).not.toContain('<alice>');
  });

  it('keeps the reset token in the link fragment and escapes user text in HTML', () => {
    const mail: SendMailOptions = buildMailOptions('password-reset', {
      email: 'user@cityborn.test',
      username: '<img src=x>',
      token: 'secret',
      frontendUrl: 'https://cityborn.test',
      validityDurationMinutes: 30,
    });
    const link: string = mail.text?.match(/https?:\/\/[^\s]+/)?.[0] ?? '';

    expect(new URL(link).pathname).toBe('/reset-password');
    expect(new URL(link).search).toBe('');
    expect(new URL(link).hash).toBe('#token=secret');
    expect(mail.html).toContain('&lt;img src=x&gt;');
    expect(mail.html).not.toContain('<img src=x>');
    expect(mail.html).toContain('30 minutes');
  });

  it('attaches the readable logo when running from sources', () => {
    const mail: SendMailOptions = buildMailOptions('password-changed', {
      email: 'user@cityborn.test',
      username: 'Player',
    });

    expect(mail.attachments).toHaveLength(1);
    expect(
      mail.attachments?.every((attachment) => existsSync(attachment.path)),
    ).toBe(true);
  });
});

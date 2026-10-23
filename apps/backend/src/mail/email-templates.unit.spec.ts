import { buildMailOptions } from './email-templates';
import type { SendMailOptions } from './providers/mail.provider';

describe('buildMailOptions', () => {
  it('links the existing account email to the sign-in screen', () => {
    const mailOptions: SendMailOptions = buildMailOptions(
      'existing-account-email',
      {
        email: 'alice@cityborn.test',
        frontendUrl: 'https://cityborn.test',
        username: 'alice',
      },
    );

    expect(mailOptions.to).toBe('alice@cityborn.test');
    expect(mailOptions.text?.split('\n')).toContain('https://cityborn.test/');
    expect(mailOptions.html).toContain('href="https://cityborn.test/"');
  });

  it('escapes the username in the existing account email', () => {
    const mailOptions: SendMailOptions = buildMailOptions(
      'existing-account-email',
      {
        email: 'alice@cityborn.test',
        frontendUrl: 'https://cityborn.test',
        username: '<alice>',
      },
    );

    expect(mailOptions.html).toContain('&lt;alice&gt;');
    expect(mailOptions.html).not.toContain('<alice>');
  });
});

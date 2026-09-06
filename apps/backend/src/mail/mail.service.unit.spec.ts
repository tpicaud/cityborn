import { createMock } from '../../test/support/createMock';
import { MailService } from './mail.service';
import type { MailProvider } from './providers/mail.provider';

describe('MailService.sendMail', () => {
  it('delegates the message to the configured provider', async () => {
    const mailProvider = createMock<MailProvider>();
    const mailService = new MailService(mailProvider);
    const options = {
      to: 'user@cityborn.test',
      subject: 'Welcome',
      html: '<p>Welcome</p>',
    };
    mailProvider.sendMail.mockResolvedValue(undefined);

    await mailService.sendMail(options);

    expect(mailProvider.sendMail).toHaveBeenCalledWith(options);
  });
});

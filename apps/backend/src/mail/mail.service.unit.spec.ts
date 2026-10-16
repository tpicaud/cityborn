import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { normalizeException } from '../common/errors/exception-to-api-error';
import { MailService } from './mail.service';
import {
  MailDeliveryError,
  type MailProvider,
  type SendMailOptions,
} from './providers/mail.provider';

describe('MailService.sendMail', () => {
  it('delegates the message to the configured provider', async () => {
    const mailProvider: DeepMocked<MailProvider> = createMock<MailProvider>();
    const mailService: MailService = new MailService(mailProvider);
    const options: SendMailOptions = {
      to: 'user@cityborn.test',
      subject: 'Welcome',
      html: '<p>Welcome</p>',
    };
    mailProvider.sendMail.mockResolvedValue(undefined);

    await mailService.sendMail(options);

    expect(mailProvider.sendMail).toHaveBeenCalledWith(options);
  });

  it('preserves the provider status and safe diagnostic', async () => {
    const mailProvider: DeepMocked<MailProvider> = createMock<MailProvider>();
    const mailService: MailService = new MailService(mailProvider);
    const options: SendMailOptions = {
      to: 'user@cityborn.test',
      subject: 'Reset',
      text: 'secret-token',
    };
    const error: MailDeliveryError = new MailDeliveryError({
      category: 'http',
      provider: 'brevo',
      statusCode: 429,
    });
    mailProvider.sendMail.mockRejectedValue(error);

    await expect(mailService.sendMail(options)).rejects.toBe(error);
  });

  it('retains a technical cause without forwarding arbitrary provider contents', async () => {
    const mailProvider: DeepMocked<MailProvider> = createMock<MailProvider>();
    const mailService: MailService = new MailService(mailProvider);
    const options: SendMailOptions = {
      to: 'user@cityborn.test',
      subject: 'Reset',
      text: 'secret-token',
    };
    mailProvider.sendMail.mockRejectedValue(
      new Error('provider echoed secret-token', {
        cause: Object.assign(new Error('request included secret-api-key'), {
          code: 'ETIMEDOUT',
        }),
      }),
    );

    const error: unknown = await mailService
      .sendMail(options)
      .catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(MailDeliveryError);
    expect(normalizeException(error).diagnostic.causes).toEqual([
      expect.objectContaining({
        message: 'Mail delivery cause (code=ETIMEDOUT)',
      }),
    ]);
    const serializedDiagnostic: string = JSON.stringify(
      normalizeException(error).diagnostic,
    );
    expect(serializedDiagnostic).not.toContain('secret-token');
    expect(serializedDiagnostic).not.toContain('secret-api-key');
  });
});

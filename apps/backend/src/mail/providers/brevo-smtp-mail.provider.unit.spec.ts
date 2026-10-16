import { normalizeException } from '../../common/errors/exception-to-api-error';
import type { MailConfig } from '../../config/config.module';
import { BrevoSmtpMailProvider } from './brevo-smtp-mail.provider';
import { MailDeliveryError, type SendMailOptions } from './mail.provider';

describe('BrevoSmtpMailProvider', () => {
  describe('sendMail', () => {
    const mailConfig: MailConfig = {
      apiKey: 'secret-api-key',
      senderEmail: 'mail@cityborn.test',
      senderName: 'Cityborn',
    };
    const mailOptions: SendMailOptions = {
      to: 'user@cityborn.test',
      subject: 'Reset',
      text: 'secret-reset-token',
    };

    it('keeps the HTTP status without recording the response body or credentials', async () => {
      const brevoSmtpMailProvider: BrevoSmtpMailProvider =
        new BrevoSmtpMailProvider(mailConfig);
      const response: Response = new Response(
        'secret-reset-token secret-api-key',
        { status: 503 },
      );
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(response);
      const readBody: jest.SpyInstance = jest.spyOn(response, 'text');

      const error: unknown = await brevoSmtpMailProvider
        .sendMail(mailOptions)
        .catch((failure: unknown) => failure);

      expect(error).toBeInstanceOf(MailDeliveryError);
      expect(normalizeException(error).diagnostic.message).toBe(
        'Mail delivery failed (category=http; provider=brevo; status=503)',
      );
      expect(readBody).not.toHaveBeenCalled();
      const serializedDiagnostic: string = JSON.stringify(
        normalizeException(error).diagnostic,
      );
      expect(serializedDiagnostic).not.toContain('secret-reset-token');
      expect(serializedDiagnostic).not.toContain('secret-api-key');
    });

    it('keeps a safe network cause without the fetch error contents', async () => {
      const brevoSmtpMailProvider: BrevoSmtpMailProvider =
        new BrevoSmtpMailProvider(mailConfig);
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(
        new TypeError('fetch failed secret-api-key', {
          cause: Object.assign(new Error('secret-reset-token'), {
            code: 'ECONNREFUSED',
          }),
        }),
      );

      const error: unknown = await brevoSmtpMailProvider
        .sendMail(mailOptions)
        .catch((failure: unknown) => failure);

      expect(normalizeException(error).diagnostic).toMatchObject({
        message:
          'Mail delivery failed (category=network; provider=brevo; status=unknown)',
        causes: [{ message: 'Mail delivery cause (code=ECONNREFUSED)' }],
      });
      const serializedDiagnostic: string = JSON.stringify(
        normalizeException(error).diagnostic,
      );
      expect(serializedDiagnostic).not.toContain('secret-reset-token');
      expect(serializedDiagnostic).not.toContain('secret-api-key');
    });
  });
});

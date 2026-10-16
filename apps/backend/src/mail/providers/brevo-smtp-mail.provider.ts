import { readFile } from 'node:fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { MAIL_CONFIG, type MailConfig } from '../../config/config.module';
import {
  MailDeliveryError,
  type MailProvider,
  type SendMailOptions,
} from './mail.provider';

const BREVO_API_URL: string = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class BrevoSmtpMailProvider implements MailProvider {
  constructor(@Inject(MAIL_CONFIG) private readonly mailConfig: MailConfig) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    const to: string[] = Array.isArray(options.to) ? options.to : [options.to];

    const payload: Record<string, unknown> = {
      sender: {
        name: this.mailConfig.senderName,
        email: this.mailConfig.senderEmail,
      },
      to: to.map((email) => ({ email })),
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
    };

    if (options.replyTo) {
      payload.replyTo = { email: options.replyTo };
    }

    if (options.attachments?.length) {
      try {
        payload.attachment = await Promise.all(
          options.attachments.map(async (attachment) => ({
            name: attachment.filename,
            content: (await readFile(attachment.path)).toString('base64'),
          })),
        );
      } catch (error: unknown) {
        throw new MailDeliveryError({
          category: 'attachment',
          provider: 'brevo',
          cause: error,
        });
      }
    }

    let response: Response;
    try {
      response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': this.mailConfig.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error: unknown) {
      throw new MailDeliveryError({
        category: 'network',
        provider: 'brevo',
        cause: error,
      });
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new MailDeliveryError({
        category: 'http',
        provider: 'brevo',
        statusCode: response.status,
      });
    }
  }
}

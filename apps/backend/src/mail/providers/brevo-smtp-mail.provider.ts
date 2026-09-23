import { readFile } from 'node:fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { MAIL_CONFIG, type MailConfig } from '../../config/config.module';
import type { MailProvider, SendMailOptions } from './mail.provider';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class BrevoSmtpMailProvider implements MailProvider {
  constructor(@Inject(MAIL_CONFIG) private readonly mailConfig: MailConfig) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    const to = Array.isArray(options.to) ? options.to : [options.to];

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
      payload.attachment = await Promise.all(
        options.attachments.map(async (attachment) => ({
          name: attachment.filename,
          content: (await readFile(attachment.path)).toString('base64'),
        })),
      );
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': this.mailConfig.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Brevo API request failed (${response.status}): ${errorBody}`,
      );
    }
  }
}

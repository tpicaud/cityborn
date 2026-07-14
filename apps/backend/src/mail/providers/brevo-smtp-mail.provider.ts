import { readFile } from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MailProvider, SendMailOptions } from './mail.provider';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class BrevoSmtpMailProvider implements MailProvider {
  constructor(private readonly configService: ConfigService) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    const apiKey = this.getRequiredConfig('BREVO_API_KEY');
    const fromEmail = this.getRequiredConfig('BREVO_SENDER_EMAIL');
    const fromName =
      this.configService.get<string>('BREVO_SENDER_NAME') ?? 'Cityborn';

    const to = Array.isArray(options.to) ? options.to : [options.to];

    const payload: Record<string, unknown> = {
      sender: { name: fromName, email: fromEmail },
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
        'api-key': apiKey,
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

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing Brevo mail configuration: ${key}`);
    }
    return value;
  }
}

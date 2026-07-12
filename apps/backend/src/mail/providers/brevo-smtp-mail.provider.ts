import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { MailProvider, SendMailOptions } from './mail.provider';

@Injectable()
export class BrevoSmtpMailProvider implements MailProvider {
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    const transporter = this.getTransporter();
    const fromEmail = this.getRequiredConfig('BREVO_SENDER_EMAIL');
    const fromName =
      this.configService.get<string>('BREVO_SENDER_NAME') ?? 'Cityborn';

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    const host =
      this.configService.get<string>('BREVO_SMTP_HOST') ??
      'smtp-relay.brevo.com';
    const port = Number(
      this.configService.get<string>('BREVO_SMTP_PORT') ?? 587,
    );
    const user = this.getRequiredConfig('BREVO_SMTP_USER');
    const pass = this.getRequiredConfig('BREVO_SMTP_KEY');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing Brevo mail configuration: ${key}`);
    }
    return value;
  }
}

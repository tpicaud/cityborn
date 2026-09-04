import { Inject, Injectable } from '@nestjs/common';
import { MAIL_PROVIDER } from './mail.constants';
import type { MailProvider, SendMailOptions } from './providers/mail.provider';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
  ) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.mailProvider.sendMail(options);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { MAIL_PROVIDER } from './mail.constants';
import {
  MailDeliveryError,
  type MailProvider,
  type SendMailOptions,
} from './providers/mail.provider';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
  ) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      await this.mailProvider.sendMail(options);
    } catch (error: unknown) {
      if (error instanceof MailDeliveryError) throw error;
      throw new MailDeliveryError({ category: 'provider', cause: error });
    }
  }
}

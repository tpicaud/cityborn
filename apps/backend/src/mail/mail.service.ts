import { ErrorCode } from '@cityborn/api';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { MAIL_PROVIDER } from './mail.constants';
import type { MailProvider, SendMailOptions } from './providers/mail.provider';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
  ) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      await this.mailProvider.sendMail(options);
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        code: ErrorCode.EMAIL_SEND_FAILED,
        message: `Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
}

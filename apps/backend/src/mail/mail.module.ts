import { Module } from '@nestjs/common';
import { MAIL_PROVIDER } from './mail.constants';
import { MailService } from './mail.service';
import { BrevoSmtpMailProvider } from './providers/brevo-smtp-mail.provider';

@Module({
  providers: [
    MailService,
    BrevoSmtpMailProvider,
    {
      provide: MAIL_PROVIDER,
      useExisting: BrevoSmtpMailProvider,
    },
  ],
  exports: [MailService],
})
export class MailModule {}

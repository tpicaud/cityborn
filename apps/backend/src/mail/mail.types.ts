export type SendMailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

export interface MailProvider {
  sendMail(options: SendMailOptions): Promise<void>;
}

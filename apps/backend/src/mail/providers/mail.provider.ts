export type MailAttachment = {
  filename: string;
  path: string;
  cid: string;
  contentDisposition?: 'inline' | 'attachment';
};

export type SendMailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

export interface MailProvider {
  sendMail(options: SendMailOptions): Promise<void>;
}

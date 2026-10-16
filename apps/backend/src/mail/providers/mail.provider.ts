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

export class MailDeliveryError extends Error {
  constructor({
    category,
    provider,
    statusCode,
    cause,
  }: {
    category: 'http' | 'network' | 'attachment' | 'provider';
    provider?: 'brevo';
    statusCode?: number;
    cause?: unknown;
  }) {
    super(
      `Mail delivery failed (category=${category}; provider=${provider ?? 'unknown'}; status=${statusCode ?? 'unknown'})`,
      { cause: safeDeliveryCause({ error: cause, remainingDepth: 3 }) },
    );
    this.name = 'MailDeliveryError';
  }
}

function safeDeliveryCause({
  error,
  remainingDepth,
}: {
  error: unknown;
  remainingDepth: number;
}): Error | undefined {
  if (typeof error !== 'object' || error === null || remainingDepth === 0) {
    return undefined;
  }
  const code: unknown = 'code' in error ? error.code : undefined;
  const allowedCodes: string[] = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_SOCKET',
    'ENOENT',
    'EACCES',
  ];
  if (typeof code === 'string' && allowedCodes.includes(code)) {
    return new Error(`Mail delivery cause (code=${code})`);
  }
  return safeDeliveryCause({
    error: 'cause' in error ? error.cause : undefined,
    remainingDepth: remainingDepth - 1,
  });
}

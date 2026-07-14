import type { ConfigService } from '@nestjs/config';
import { BrevoSmtpMailProvider } from './brevo-smtp-mail.provider';

describe('BrevoSmtpMailProvider', () => {
  const config: Record<string, string> = {
    BREVO_API_KEY: 'test-api-key',
    BREVO_SENDER_EMAIL: 'noreply@cityborn.fr',
    BREVO_SENDER_NAME: 'Cityborn',
  };

  const configService = {
    get: jest.fn((key: string) => config[key]),
  } as unknown as ConfigService;

  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 201 }));
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('sends a simple mail with a single recipient', async () => {
    const provider = new BrevoSmtpMailProvider(configService);

    await provider.sendMail({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'api-key': 'test-api-key',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      sender: { name: 'Cityborn', email: 'noreply@cityborn.fr' },
      to: [{ email: 'user@example.com' }],
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
    });
  });

  it('sends to multiple recipients', async () => {
    const provider = new BrevoSmtpMailProvider(configService);

    await provider.sendMail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Hello',
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.to).toEqual([{ email: 'a@example.com' }, { email: 'b@example.com' }]);
  });

  it('includes replyTo when provided', async () => {
    const provider = new BrevoSmtpMailProvider(configService);

    await provider.sendMail({
      to: 'user@example.com',
      subject: 'Hello',
      replyTo: 'reply@example.com',
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.replyTo).toEqual({ email: 'reply@example.com' });
  });

  it('base64-encodes inline attachments using the filename as name (Brevo requires a valid file extension)', async () => {
    const provider = new BrevoSmtpMailProvider(configService);
    const logoPath = require.resolve('./brevo-smtp-mail.provider.spec.ts');

    await provider.sendMail({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<img src="cid:logo-transparent.png">',
      attachments: [
        {
          filename: 'logo-transparent.png',
          path: logoPath,
          cid: 'logo-transparent.png',
          contentDisposition: 'inline',
        },
      ],
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init?.body as string);
    expect(body.attachment).toHaveLength(1);
    expect(body.attachment[0].name).toBe('logo-transparent.png');
    expect(typeof body.attachment[0].content).toBe('string');
    expect(Buffer.from(body.attachment[0].content, 'base64').length).toBeGreaterThan(0);
  });

  it('throws with the response status and body when the request fails', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"invalid api key"}', { status: 401 }),
    );
    const provider = new BrevoSmtpMailProvider(configService);

    await expect(
      provider.sendMail({ to: 'user@example.com', subject: 'Hello' }),
    ).rejects.toThrow(/401/);
  });

  it('throws a clear error when BREVO_API_KEY is missing', async () => {
    const incompleteConfig = {
      get: jest.fn((key: string) =>
        key === 'BREVO_API_KEY' ? undefined : config[key],
      ),
    } as unknown as ConfigService;
    const provider = new BrevoSmtpMailProvider(incompleteConfig);

    await expect(
      provider.sendMail({ to: 'user@example.com', subject: 'Hello' }),
    ).rejects.toThrow('Missing Brevo mail configuration: BREVO_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

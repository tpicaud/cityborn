import { buildLoggerTransport } from './logger.params';

describe('buildLoggerTransport', () => {
  it('writes straight to stdout in production when Axiom is not configured', () => {
    const transport = buildLoggerTransport({
      isProduction: true,
      axiomToken: undefined,
      axiomDataset: undefined,
    });

    expect(transport).toBeUndefined();
  });

  it('pretty-prints outside production when Axiom is not configured', () => {
    const transport = buildLoggerTransport({
      isProduction: false,
      axiomToken: undefined,
      axiomDataset: undefined,
    });

    expect(transport).toEqual({
      targets: [{ target: 'pino-pretty', options: { singleLine: true } }],
    });
  });

  it('keeps stdout alongside Axiom in production', () => {
    const transport = buildLoggerTransport({
      isProduction: true,
      axiomToken: 'token',
      axiomDataset: 'cityborn-backend-prod',
    });

    expect(transport).toEqual({
      targets: [
        { target: 'pino/file', options: { destination: 1 } },
        {
          target: '@axiomhq/pino',
          options: {
            token: 'token',
            dataset: 'cityborn-backend-prod',
            url: 'https://api.eu.axiom.co',
          },
        },
      ],
    });
  });

  it('omits Axiom when only the token is configured', () => {
    const transport = buildLoggerTransport({
      isProduction: true,
      axiomToken: 'token',
      axiomDataset: undefined,
    });

    expect(transport).toBeUndefined();
  });

  it('omits Axiom when only the dataset is configured', () => {
    const transport = buildLoggerTransport({
      isProduction: true,
      axiomToken: undefined,
      axiomDataset: 'cityborn-backend-prod',
    });

    expect(transport).toBeUndefined();
  });
});

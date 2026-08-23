import type { NextFunction, Request, Response } from 'express';

jest.mock('@cityborn/api', () => ({
  API_MIN_SUPPORTED_VERSION_HEADER_NAME: 'X-Api-Min-Supported-Version',
  getApiVersionInfo: jest.fn().mockReturnValue({ minSupportedVersion: 4 }),
}));

function createResponse(): Response {
  return { setHeader: jest.fn() } as unknown as Response;
}

describe('apiVersionHeaderMiddleware', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('sets the X-Api-Min-Supported-Version header from getApiVersionInfo', () => {
    const {
      apiVersionHeaderMiddleware,
    } = require('./api-version-header.middleware');
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    apiVersionHeaderMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Api-Min-Supported-Version',
      '4',
    );
  });

  it('calls next() so the request continues', () => {
    const {
      apiVersionHeaderMiddleware,
    } = require('./api-version-header.middleware');
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    apiVersionHeaderMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('computes the min supported version only once across several requests', () => {
    const {
      apiVersionHeaderMiddleware,
    } = require('./api-version-header.middleware');
    const { getApiVersionInfo } = require('@cityborn/api');
    const req = {} as Request;
    const next = jest.fn() as NextFunction;

    apiVersionHeaderMiddleware(req, createResponse(), next);
    apiVersionHeaderMiddleware(req, createResponse(), next);
    apiVersionHeaderMiddleware(req, createResponse(), next);

    expect(getApiVersionInfo).toHaveBeenCalledTimes(1);
  });
});

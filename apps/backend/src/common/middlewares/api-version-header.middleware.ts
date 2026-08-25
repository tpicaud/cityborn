import {
  API_CURRENT_VERSION_HEADER_NAME,
  API_MIN_SUPPORTED_VERSION_HEADER_NAME,
  type ApiVersionInfo,
  getApiVersionInfo,
} from '@cityborn/api';
import type { NextFunction, Request, Response } from 'express';

let cachedApiVersionInfo: ApiVersionInfo | undefined;

export function apiVersionHeaderMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (cachedApiVersionInfo === undefined) {
    cachedApiVersionInfo = getApiVersionInfo();
  }

  res.setHeader(
    API_MIN_SUPPORTED_VERSION_HEADER_NAME,
    String(cachedApiVersionInfo.minSupportedVersion),
  );
  res.setHeader(
    API_CURRENT_VERSION_HEADER_NAME,
    String(cachedApiVersionInfo.currentVersion),
  );
  next();
}

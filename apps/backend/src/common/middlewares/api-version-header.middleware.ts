import {
  API_MIN_SUPPORTED_VERSION_HEADER_NAME,
  getApiVersionInfo,
} from '@cityborn/api';
import type { NextFunction, Request, Response } from 'express';

let cachedMinSupportedVersion: number | undefined;

export function apiVersionHeaderMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (cachedMinSupportedVersion === undefined) {
    cachedMinSupportedVersion = getApiVersionInfo().minSupportedVersion;
  }

  res.setHeader(
    API_MIN_SUPPORTED_VERSION_HEADER_NAME,
    String(cachedMinSupportedVersion),
  );
  next();
}

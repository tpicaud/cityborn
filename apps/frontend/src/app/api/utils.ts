import { ApiError, ErrorCode, ErrorPayload } from '@cityborn/errors';
import { NextResponse } from 'next/server';

export function getBaseUrl(): string {
  const base_url = process.env.REST_BACKEND_URL;
  if (!base_url) throw new Error('Base url is undefined');
  return base_url;
}

export function throwApiError(error: any) {
  const apiError: ErrorPayload = {
    code: error.code ?? ErrorCode.UNKNOWN_ERROR,
    message: error.message ?? 'Internal server error',
    statusCode: error.statusCode ?? 500,
  };

  return NextResponse.json(apiError, {
    status: error.statusCode,
  });
}

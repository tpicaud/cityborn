import { NextRequest, NextResponse } from 'next/server';
import { storeTokensInCookies } from '../utils';
import { apiFetch } from '../../apiFetch';
import { ErrorCode } from '@cityborn/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await apiFetch(`/auth/sign-in`, {
      requestOptions: {
        method: 'POST',
        headers: req.headers ?? {},
        body: JSON.stringify(body),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    await storeTokensInCookies(data.access_token, data.refresh_token);

    return NextResponse.json(
      { message: 'Signed in successfully' },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error.message || 'Internal Server Error',
        statusCode: 500,
      },
      { status: 500 },
    );
  }
}

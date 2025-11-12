import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '../../apiFetch';
import { ErrorCode } from '@cityborn/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await apiFetch(`/event/track`, {
      requestOptions: {
        method: 'POST',
        headers: req.headers ?? {},
        body: JSON.stringify(body),
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(
      { message: 'Event successfully sent' },
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

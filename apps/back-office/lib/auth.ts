import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { getBackOfficeServerConfig } from '@/config/server';
import type { User } from '@/types';

function getKey(): Uint8Array {
  return new TextEncoder().encode(getBackOfficeServerConfig().authSecret);
}

export async function encrypt(
  payload: Record<string, unknown>,
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getKey());
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, getKey(), {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  try {
    const decrypted = await decrypt(session);
    return decrypted as unknown as User;
  } catch {
    return null;
  }
}

export async function setSession(user: User): Promise<void> {
  const backOfficeServerConfig = getBackOfficeServerConfig();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ ...user, expires: expires.getTime() });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: backOfficeServerConfig.nodeEnvironment === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession(): Promise<void> {
  const backOfficeServerConfig = getBackOfficeServerConfig();
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: backOfficeServerConfig.nodeEnvironment === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse | undefined> {
  const backOfficeServerConfig = getBackOfficeServerConfig();
  const session = request.cookies.get('session')?.value;
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    parsed.expires = newExpires.getTime();

    const res = NextResponse.next();
    res.cookies.set({
      name: 'session',
      value: await encrypt(parsed),
      httpOnly: true,
      expires: newExpires,
      secure: backOfficeServerConfig.nodeEnvironment === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch {
    return;
  }
}

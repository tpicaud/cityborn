'use server';

import { cookies } from 'next/headers';

export async function storeTokensInCookies(
  access_token: string,
  refresh_token: string,
) {
  const cookieStore = await cookies();

  // Store access token
  cookieStore.set({
    name: 'access_token',
    value: access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 6, // 4h
    path: '/',
    domain: `.${process.env.DOMAIN_NAME}`,
  });

  // Store refresh token
  cookieStore.set({
    name: 'refresh_token',
    value: refresh_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7d
    path: '/',
  });

  return;
}

export async function expireTokensInCookies() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: 'access_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    domain: `.${process.env.DOMAIN_NAME}`,
  });

  cookieStore.set({
    name: 'refresh_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  });
}

export async function getAccessToken() {
  return (await cookies()).get('access_token')?.value;
}

export async function getRefreshToken() {
  return (await cookies()).get('refresh_token')?.value;
}

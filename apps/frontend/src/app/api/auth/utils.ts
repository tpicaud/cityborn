'use server';

import { cookies } from "next/headers";

export async function getTokensCookiesHeaders(access_token: string, refresh_token: string) {
    const secure = process.env.NODE_ENV === 'production';

    const accessCookie = [
        `access_token=${access_token}`,
        `HttpOnly`,
        `Path=/`,
        `Max-Age=${60 * 15}`, // 15 minutes
        `SameSite=Strict`,
        secure ? 'Secure' : '',
    ].filter(Boolean).join('; ');

    const refreshCookie = [
        `refresh_token=${refresh_token}`,
        `HttpOnly`,
        `Path=/`,
        `Max-Age=${60 * 60 * 24 * 7}`, // 7 jours
        `SameSite=Strict`,
        secure ? 'Secure' : '',
    ].filter(Boolean).join('; ');

    return [accessCookie, refreshCookie];
}


export async function storeTokensInCookies(access_token: string, refresh_token: string) {
    const cookieStore = await cookies();

    // Store access token
    cookieStore.set({
        name: 'access_token',
        value: access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 15, // 15m
        path: '/',
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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 0
    });

    cookieStore.set({
        name: 'refresh_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0
    });
}

export async function getAccessToken() {
    return (await cookies()).get('access_token')?.value;
}

export async function getRefreshToken() {
    return (await cookies()).get('refresh_token')?.value;
}
'use server';

import { apiFetch } from "@/app/api/apiFetch";
import { getAccessToken, getRefreshToken } from "@/app/api/auth/utils";
import { ApiError } from "@cityborn/errors";
import { PublicUser } from "@cityborn/types";
import { cookies } from "next/headers";

//////////////////
// Auth service //
//////////////////

export async function hasToken(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token') ?? cookieStore.get('refresh_token');
    return !!token;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
    try {
        const access_token = await getAccessToken();
        const refresh_token = await getRefreshToken();

        if (!access_token && !refresh_token) return null;

        const response = await apiFetch(`/auth/me`, {
            requestOptions: {
                method: 'GET',
                cache: 'no-store'
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return null;
        }

        return data.user;
    } catch (error) {
        return null;
    }

    //////////////////
    // const access_token = await getAccessToken();
    // const refresh_token = await getRefreshToken();

    // if (!access_token && !refresh_token) return null;

    // const response = await fetch(`/api/auth/me`, {
    //     method: 'GET',
    //     headers: {
    //         Cookie: `access_token=${access_token}; refresh_token=${refresh_token}`,
    //     },
    //     cache: 'no-store'
    // });

    // const data = await response.json();

    // if (!response.ok) {
    //     throw new ApiError(data.code, data.message, data.statusCode);
    // }

    // if (!data.user) return null;
    // return data.user as PublicUser;
}

export async function signUp(username: string, email: string, password: string): Promise<void> {
    const response = await fetch(`/auth/sign-up`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json().catch(() => null);
    if (!data) throw new Error("Invalid server response");

    if (!response.ok) {
        throw new Error(data.message || "Failed to sign up");
    }

    if (!data.access_token) throw new Error('No Access token returned from sign-up');

    const cookieStore = await cookies();
    cookieStore.set({
        name: 'access_token',
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 15,
        path: '/',
    });
}

export async function signIn(identifier: string, password: string): Promise<void> {
    const response = await fetch(`/auth/sign-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json().catch(() => null);
    if (!data) throw new Error("Invalid server response");

    if (!response.ok) {
        throw new Error(data.message || "Failed to sign in");
    }

    if (!data.access_token) throw new Error('No Access token returned from sign-in');

    const cookieStore = await cookies();
    cookieStore.set({
        name: 'access_token',
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 15,
        path: '/',
    });
}

export async function signOut(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set({
        name: 'access_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
    })
}
'use server';

import { authFetch } from "@/app/api/authFetch";
import { GameMode, PublicUser } from "@cityborn/types";
import { Game } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import { GuessObject } from "@cityborn/types";
import { Session } from "@cityborn/types";
import { cookies } from "next/headers";
import { STATUS_CODES } from "node:http";

const REST_BACKEND_URL = process.env.REST_BACKEND_URL;
if (!REST_BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_REST_BACKEND_URL is not defined in environment variables");
}

//////////////////
// Auth service //
//////////////////

export async function hasToken(): Promise<boolean> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');
    return !!accessToken;
}

export async function getCurrentUser(): Promise<PublicUser | null> {
    const response = await authFetch(`${REST_BACKEND_URL}/auth/me`, {
        requestOptions: {
            method: 'GET'
        }
    });

    const data = await response.json().catch(() => null);
    if (!data) throw new Error("Invalid server response");

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch current user");
    }

    if (!data.user) return null;
    return data.user as PublicUser;
}

export async function signUp(username: string, email: string, password: string): Promise<void> {
    const response = await fetch(`${REST_BACKEND_URL}/auth/sign-up`, {
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
    const response = await fetch(`${REST_BACKEND_URL}/auth/sign-in`, {
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
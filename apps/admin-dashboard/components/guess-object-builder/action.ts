"use server";

import { GuessObjectCandidate, WorldLocation } from "@cityborn/types";

export async function searchGuessObjectByName(query: string): Promise<GuessObjectCandidate[]> {
    const response = await fetch(`${process.env.BACKEND_URL}/guess-objects/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search guess objects');
    }

    return data.candidates as GuessObjectCandidate[] ?? [];
}

export async function searchGuessObjectById(id: string): Promise<GuessObjectCandidate> {

    const response = await fetch(`${process.env.BACKEND_URL}/guess-objects/search?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search guess objects');
    }

    return data as GuessObjectCandidate ?? {};
}

export async function searchWorldLocationByName(query: string): Promise<WorldLocation[]> {
    const response = await fetch(`${process.env.BACKEND_URL}/guess-objects/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search guess objects');
    }

    return data.candidates as WorldLocation[] ?? [];
}
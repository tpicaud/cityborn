"use server";

import { GuessObjectCandidate } from "@cityborn/types";

export async function search(query: string): Promise<GuessObjectCandidate[]> {

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
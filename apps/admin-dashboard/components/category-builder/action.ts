'use server';

import { GuessObject } from "@cityborn/types";

export async function getGuessObject(id: string, includes?: string[]) {
    const query = includes && includes.length > 0
        ? `?include=${includes.join(',')}`
        : '';

    console.log(`GET BY ID ${id} - ${includes}`)
    const response = await fetch(`${process.env.BACKEND_URL}/guess-objects/${id}${query}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response.status === 404) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to get guess object');
    }

    return data as GuessObject
}
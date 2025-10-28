"use server";

import { CreateGuessObject, GuessObject, GuessObjectCandidate, WorldLocation } from "@cityborn/types";

export async function searchGuessObjectByName(query: string): Promise<GuessObjectCandidate[]> {
    console.error(`Searching by name: ${query}`)
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
    const response = await fetch(`${process.env.BACKEND_URL}/world-location/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search world locations');
    }

    return data.candidates as WorldLocation[] ?? [];
}

export async function searchWorldLocationById(id: string): Promise<WorldLocation> {

    const response = await fetch(`${process.env.BACKEND_URL}/world-location/search?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search world location');
    }

    return data as WorldLocation ?? {};
}

export async function saveGuessObject(createGuessObject: CreateGuessObject): Promise<string> {
    const response = await fetch(`${process.env.BACKEND_URL}/guess-objects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(createGuessObject)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to save guess object');
    }

    return data.id
}

export async function patchGuessObject(id: string, updatedFields: Partial<GuessObject>): Promise<string> {
    const response = await fetch(`${process.env.BACKEND_URL}/guess-objects/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete guess object');
    }

    return data.id
}

export async function deleteGuessObject(id: string): Promise<void> {
    const response = await fetch(`${process.env.BACKEND_URL}/guess-objects/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });


    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete guess object');
    }
}
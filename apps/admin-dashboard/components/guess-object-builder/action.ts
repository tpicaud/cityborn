"use server";

import { apiFetch } from "@/lib/apiFetch";
import { GuessObjectCandidate, WorldLocation } from "@cityborn/types";

export async function searchGuessObjectByName(query: string): Promise<GuessObjectCandidate[]> {
    const response = await apiFetch(`${process.env.BACKEND_URL}/admin/guess-objects/search?q=${encodeURIComponent(query)}`, {
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

    const response = await apiFetch(`${process.env.BACKEND_URL}/admin/guess-objects/search?id=${id}`, {
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
    const response = await apiFetch(`${process.env.BACKEND_URL}/admin/world-location/search?q=${encodeURIComponent(query)}`, {
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

export async function searchWorldLocationById(id: string, osm_type: string): Promise<WorldLocation> {

    const response = await apiFetch(`${process.env.BACKEND_URL}/admin/world-location/search?id=${id}&osm_type=${osm_type}`, {
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

export async function deleteGuessObject(id: string): Promise<void> {
    const response = await apiFetch(`${process.env.BACKEND_URL}/admin/guess-objects/${id}`, {
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
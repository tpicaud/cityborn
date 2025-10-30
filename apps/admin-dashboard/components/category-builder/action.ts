'use server';

import { GuessObject, UpdateCategory } from "@cityborn/types";

export async function getGuessObject(id: string, includes?: string[]) {
    const query = includes && includes.length > 0
        ? `?include=${includes.join(',')}`
        : '';

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

export async function saveCategory(id: string, updatedCategory: UpdateCategory) {

    const response = await fetch(`${process.env.BACKEND_URL}/category/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCategory)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to save category');
    }

    return data as GuessObject
}

export async function deleteCategory(id: string) {

    const response = await fetch(`${process.env.BACKEND_URL}/category/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });


    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete category');
    }
}
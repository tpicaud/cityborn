"use server";

import { Category } from "@cityborn/types";

export async function getCategory(id: string): Promise<Category> {
    const response = await fetch(`${process.env.BACKEND_URL}/category/${id}?include=guessObjects`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search guess objects');
    }
    return data as Category;
}
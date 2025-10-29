"use server";

import { Category, CreateCategory } from "@cityborn/types";

export async function getAllCategories(): Promise<Category[]> {
    const response = await fetch(`${process.env.BACKEND_URL}/category?include=guessObjects`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search guess objects');
    }

    return data.categories as Category[] ?? [];
}

export async function createCategory(createCategory: CreateCategory): Promise<Category> {
    const response = await fetch(`${process.env.BACKEND_URL}/category`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(createCategory)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to search guess objects');
    }

    return data as Category;
}
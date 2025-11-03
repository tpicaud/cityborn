"use server";

import { apiFetch } from "@/lib/apiFetch";
import { Category, CreateCategory } from "@cityborn/types";

export async function getAllCategories(): Promise<Category[]> {
    const response = await apiFetch(`${process.env.BACKEND_URL}/admin/category?include=guessObjects`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to get all categories');
    }

    return data.categories as Category[] ?? [];
}

export async function createCategory(createCategory: CreateCategory): Promise<Category> {
    const response = await apiFetch(`${process.env.BACKEND_URL}/admin/category`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(createCategory)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create category');
    }

    return data as Category;
}
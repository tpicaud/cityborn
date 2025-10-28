"use client";

import { Category } from "@cityborn/types";
import { useEffect, useState } from "react"
import { CategoriesList } from "./categories-list";
import { getAllCategories } from "./action";

export function CategoriesEditor() {
    const [categories, setCategories] = useState<Category[]>()
    const [searchValue, setSearchValue] = useState<string>('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categories = await getAllCategories();
                setCategories(categories);
            } catch (error) {
                alert('Erreur lors de la récupération des catégories');
                console.error(error);
            }
        }
        fetchCategories();
    }, [])

    async function onCategorySelect(category: Category) {

    }

    return (
        <div className="h-full w-full flex flex-col gap-8">
            <div className="flex flex-col w-full">
                <h2 className="text-xl font-bold mb-2">Catégories</h2>
                <span className="h-[2px] w-full bg-foreground"></span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
                <h2 className="text-xl font-bold">Rechercher</h2>
                <input
                    placeholder="e.g. Sport"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-[60%] pl-2 h-10 rounded-xl border border-gray-300"
                />
            </div>
            {
                (!categories || categories.length === 0)
                    ? <p className="text-center text-gray-300">Aucunes catégories</p>
                    : <CategoriesList categories={categories} onCategorySelect={onCategorySelect} />
            }
        </div>
    )
}
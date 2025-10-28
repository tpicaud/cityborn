"use client";

import { Category, CreateCategory } from "@cityborn/types";
import { useEffect, useState } from "react"
import { CategoriesList } from "./categories-list";
import { createCategory, getAllCategories } from "./action";
import { Button } from "../ui/Button";
import Loader from "../ui/Loader";
import { Plus, RefreshCcw } from "lucide-react";

export function CategoriesEditor() {
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([])
    const [searchValue, setSearchValue] = useState<string>('');

    useEffect(() => {
        handleFetchCategories();
    }, []);

    async function handleFetchCategories() {
        try {
            setIsLoading(true)
            const categories = await getAllCategories();
            setCategories(categories);
        } catch (error) {
            alert('Erreur lors de la récupération des catégories');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateCategory() {
        try {
            setIsLoading(true);
            const newCategory: CreateCategory = {
                name: "Ma catégorie"
            };

            const category = await createCategory(newCategory);
            categories.push(category)
        } catch (error) {
            alert('Erreur lors de la création de la catégorie');
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function onCategorySelect(category: Category) {

    }

    return (
        <div className="h-full w-full flex flex-col gap-6">
            <div className="flex flex-col w-full">
                <div className="flex flex-row gap-2 mb-2 items-center">
                    <h2 className="text-xl font-bold">Catégories</h2>
                    <Button
                        variant="outline"
                        onClick={handleFetchCategories}
                        className="px-2 py-0 h-auto"
                    >
                        ↻
                    </Button>
                </div>

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
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex flex-row gap-2 mb-1">
                    <Button variant="primary" onClick={handleCreateCategory}><Plus /></Button>
                    <Button variant="outline" onClick={handleFetchCategories}><RefreshCcw /></Button>
                </div>
                {
                    !isLoading
                        ? (
                            (!categories || categories.length === 0)
                                ? <p className="text-center text-gray-300">Aucunes catégories</p>
                                : <CategoriesList categories={categories} onCategorySelect={onCategorySelect} />
                        )
                        : <div className="flex items-center justify-center"><Loader /></div>
                }
            </div>
        </div>
    )
}
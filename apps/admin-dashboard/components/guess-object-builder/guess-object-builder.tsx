"use client";

import { SearchInput } from "./search-input";

export function GuessObjectBuilder() {
    return (
        <div className="w-full h-full border border-red-600">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold">Constructeur d'objets</h2>
                <SearchInput label="Rechercher un objet" />
            </div>
        </div>
    )
}
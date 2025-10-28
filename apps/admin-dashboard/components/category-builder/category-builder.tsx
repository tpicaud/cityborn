'use client';

import { CreateCategory, GuessObject } from "@cityborn/types";
import { GuessObjectBuilder } from "../guess-object-builder/guess-object-builder";
import { useState } from "react";
import { Button } from "../ui/Button";
import { getGuessObject } from "./action";
import { GuessObjectsList } from "./guess-objects-list";

interface CategoryBuilderProps {
    category?: CreateCategory
}

export function CategoryBuilder({
    category
}: CategoryBuilderProps) {
    const [createCategory, setCreateCategory] = useState<CreateCategory>({
        name: category?.name ?? "",
        description: category?.description ?? "",
        guessObjects: category?.guessObjects ?? [{
            id: 'c2d3d323-10ab-4a78-8e88-89127867111b',
            name: 'test',
            world_location_id: '7444',
            world_location: {
                id: '7444',
                name: 'Paris',
                display_name: 'Paris, Ile-de-France',
                type: 'area'
            }
        }]
    })

    const [selectedGuessObject, setSelectedGuessObject] = useState<GuessObject>();

    const updateCreateCategory = (update: Partial<CreateCategory>) => {
        setCreateCategory((prev) =>
            prev ? { ...prev, ...update } : (update as CreateCategory)
        );
    };

    async function addOrUpdateGuessObject(id: string) {
        try {
            const object = await getGuessObject(id);
            if (!object) return;
            
            setCreateCategory(prev => {
                const index = prev.guessObjects.findIndex(obj => obj.id === object.id);
                let updatedGuessObjects;

                if (index === -1) {
                    // ajout
                    updatedGuessObjects = [...prev.guessObjects, object];
                } else {
                    // mise à jour
                    updatedGuessObjects = prev.guessObjects.map(obj =>
                        obj.id === object.id ? object : obj
                    );
                }

                return { ...prev, guessObjects: updatedGuessObjects };
            });
        } catch (error) {
            alert("Erreur lors de l'ajout de l'objet")
            console.error(error)
        }
    }

    function handleCreateGuessObject() {
        setSelectedGuessObject({
            name: "",
            id: "",
            world_location_id: ""
        })
    }

    function handleSelectGuessObject(guessObject: GuessObject) {
        if (selectedGuessObject?.name === guessObject.name) {
            setSelectedGuessObject(undefined);
        } else {
            setSelectedGuessObject(guessObject);
        }
    }

    async function handleSaveCategory() {

    }

    return (
        <div className="h-full w-full grid grid-cols-2 grid-rows-1 gap-12">
            <div className="h-full flex flex-col gap-8 w-full">
                <div className="flex flex-col w-full">
                    <h2 className="text-xl font-bold mb-2">Editeur de catégories</h2>
                    <span className="h-[2px] w-full bg-foreground"></span>
                </div>
                <div className="flex flex-col h-full gap-8">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name">Nom</label>
                        <input
                            type="text"
                            id="name"
                            name={createCategory.name}
                            placeholder="e.g. Rolland Garros 2024"
                            value={createCategory.description}
                            onChange={(e) =>
                                updateCreateCategory({ name: e.target.value })
                            }
                            className="bg-white text-gray-800 rounded-md p-2 w-full max-w-96"
                        />

                        <label htmlFor="description" className="mt-4">Description</label>
                        <input
                            type="text"
                            id="Description"
                            name={createCategory.name}
                            placeholder="e.g. Rolland Garros 2024"
                            value={createCategory.description}
                            onChange={(e) =>
                                updateCreateCategory({ name: e.target.value })
                            }
                            className="bg-white text-gray-800 rounded-md p-2 w-full max-w-96"
                        />
                    </div>
                    <div className="flex flex-col h-full gap-2">
                        <div className="flex flex-row gap-2 items-baseline">
                            <h2 className="flex flex-row gap-1 items-baseline">Objets<span className="font-bold text-gray-300">{'(' + createCategory.guessObjects.length + ')'}</span></h2>
                            <Button
                                variant="primary"
                                onClick={handleCreateGuessObject}
                                className="h-6 font-bold p-auto">+</Button>
                        </div>
                        <div className="h-full rounded-xl border border-gray-300 p-3 overflow-y-auto">
                            <GuessObjectsList
                                guessObjects={createCategory.guessObjects}
                                selectedGuessObject={selectedGuessObject}
                                handleSelectGuessObject={handleSelectGuessObject}
                            />
                        </div>

                    </div>
                </div>
            </div>
            <div className="h-full flex flex-col gap-8">
                <div className="flex flex-col w-full">
                    <h2 className="text-xl font-bold mb-2">Editeur d'objet</h2>
                    <span className="h-[2px] w-full bg-foreground"></span>
                </div>
                <GuessObjectBuilder guessObject={selectedGuessObject} addOrUpdateGuessObject={addOrUpdateGuessObject} />
            </div>
        </div >
    )
}
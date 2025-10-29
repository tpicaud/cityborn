'use client';

import { Category, GuessObject, UpdateCategory } from "@cityborn/types";
import { GuessObjectBuilder } from "../guess-object-builder/guess-object-builder";
import { useState } from "react";
import { Button } from "../ui/Button";
import { deleteCategory, getGuessObject, saveCategory } from "./action";
import { GuessObjectsList } from "./guess-objects-list";
import { deleteGuessObject } from "../guess-object-builder/action";
import Loader from "../ui/Loader";
import { ArrowDownToLine } from "lucide-react";
import { DeleteCategoryPopup } from "./delete-category-popup";
import { useRouter } from "next/navigation";

interface CategoryBuilderProps {
    fetchedCategory: Category
}

export function CategoryBuilder({
    fetchedCategory
}: CategoryBuilderProps) {
    const router = useRouter();
    const [category, setCategory] = useState<Category>(fetchedCategory);
    const [selectedGuessObject, setSelectedGuessObject] = useState<GuessObject>();
    const [isSaveLoading, setIsSaveLoading] = useState(false);

    const updateCategory = (update: Partial<Category>) => {
        setCategory((prev) =>
            prev ? { ...prev, ...update } : (update as Category)
        );
    };

    async function addOrUpdateGuessObject(id: string) {
        try {
            const object = await getGuessObject(id);
            if (!object) return;

            // Update remotely
            const updatedCategory: UpdateCategory = {
                ...category,
                connectIds: [id]
            }
            await saveCategory(category.id, updatedCategory);

            // Update locally
            setCategory(prev => {
                if (!prev.guessObjects) prev.guessObjects = [];

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

    async function handleDeleteGuessObject(guessObject: GuessObject) {
        try {
            await deleteGuessObject(guessObject.id);

            setCategory(prev => {
                if (!prev.guessObjects) return prev;

                const index = prev.guessObjects.findIndex(obj => obj.id === guessObject.id);
                let updatedGuessObjects;

                if (index === -1) {
                    return prev;
                } else {
                    updatedGuessObjects = prev.guessObjects.filter(obj => obj.id !== guessObject.id);
                }

                return { ...prev, guessObjects: updatedGuessObjects };
            });
            setSelectedGuessObject(undefined);
        } catch (error) {
            alert("Erreur lors de la suppression de l'objet");
            console.error(error);
        }
    }

    async function handleSaveCategory() {
        try {
            setIsSaveLoading(true);
            const updatedCategory: UpdateCategory = {
                ...category,
                guessObjects: undefined,
                guessObjectsIds: undefined
            }
            await saveCategory(category.id, updatedCategory);
        } catch (error) {
            alert("Erreur lors de l'enregistrement de la catégorie");
            console.error(error)
        } finally {
            setIsSaveLoading(false);
        }
    }

    async function handleDeleteCategory() {
        try {
            setIsSaveLoading(true);
            await deleteCategory(category.id);
            router.push('/dashboard');
        } catch (error) {
            alert("Erreur lors de la suppression de la catégorie");
            console.error(error)
        } finally {
            setIsSaveLoading(false);
        }
    }

    return (
        <div className="h-full w-full grid grid-cols-2 grid-rows-1 gap-12">
            <div className="h-full flex flex-col gap-8 w-full">
                <div className="flex flex-col w-full">
                    <div className="flex flex-row gap-4 mb-2 items-center">
                        <h2 className="text-xl font-bold">Editeur de catégorie</h2>
                        <div className="flex flex-row items-center justify-center gap-2">
                            <Button size='sm' variant="primary" onClick={handleSaveCategory}>
                                {isSaveLoading
                                    ? <Loader />
                                    : <ArrowDownToLine size={20}/>
                                }
                            </Button>
                            <DeleteCategoryPopup handleDeleteCategory={handleDeleteCategory} />
                        </div>
                    </div>
                    <span className="h-[2px] w-full bg-foreground"></span>
                </div>
                <div className="flex flex-col h-full gap-8">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name">Nom</label>
                        <input
                            type="text"
                            id="name"
                            name={category.name}
                            placeholder="e.g. Rolland Garros 2024"
                            value={category.name}
                            onChange={(e) =>
                                updateCategory({ name: e.target.value })
                            }
                            className="bg-white text-gray-800 rounded-md p-2 w-full max-w-96"
                        />

                        <label htmlFor="description" className="mt-4">Description</label>
                        <input
                            type="text"
                            id="Description"
                            name={category.name}
                            placeholder="e.g. Rolland Garros 2024"
                            value={category.description}
                            onChange={(e) =>
                                updateCategory({ description: e.target.value })
                            }
                            className="bg-white text-gray-800 rounded-md p-2 w-full max-w-96"
                        />
                    </div>
                    <div className="flex flex-col h-full gap-2">
                        <div className="flex flex-row gap-2 items-baseline">
                            <h2 className="flex flex-row gap-1 items-baseline">
                                Objets
                                <span className="font-bold text-gray-300">
                                    {'(' + (category.guessObjects ? category.guessObjects.length : 0) + ')'}
                                </span>
                            </h2>
                            <Button
                                variant="primary"
                                onClick={handleCreateGuessObject}
                                className="h-6 font-bold p-auto">+</Button>
                        </div>
                        <div className="h-full rounded-xl border border-gray-300 p-3 overflow-y-auto">
                            <GuessObjectsList
                                guessObjects={category.guessObjects}
                                selectedGuessObject={selectedGuessObject}
                                handleSelectGuessObject={handleSelectGuessObject}
                                handleDeleteGuessObject={handleDeleteGuessObject}
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
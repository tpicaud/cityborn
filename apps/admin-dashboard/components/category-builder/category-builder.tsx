'use client';

import { Category, GuessObject, GuessObjectCandidate, UpdateCategory } from "@cityborn/types";
import { GuessObjectBuilder } from "../guess-object-builder/guess-object-builder";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { deleteCategory, getGuessObject, patchGuessObject, saveCategory, saveGuessObject } from "./action";
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
    const [guessObjectCandidate, setGuessObjectCandidate] = useState<GuessObjectCandidate>();
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [searchObjectValue, setSearchObjectValue] = useState('');

    const filteredGuessObjects = useMemo(() => {
        if (category && category.guessObjects) {
            return category.guessObjects.filter((category) =>
                category.name.toLowerCase().includes(searchObjectValue.toLowerCase())
            );
        } else {
            return [];
        }
    }, [category, searchObjectValue]);

    const updateCategory = (update: Partial<Category>) => {
        setCategory((prev) =>
            prev ? { ...prev, ...update } : (update as Category)
        );
    };

    async function addOrUpdateGuessObject(id: string) {
        try {
            const object = await getGuessObject(id, ['world_location_preview']);
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
        setGuessObjectCandidate({
            name: "",
            id: "",
            world_location_id: ""
        })
    }

    function handleSelectGuessObject(guessObject: GuessObject) {
        if (guessObjectCandidate?.name === guessObject.name) {
            setGuessObjectCandidate(undefined);
        } else {
            setGuessObjectCandidate(guessObject);
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
            setGuessObjectCandidate(undefined);
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
            console.error(error);
            setIsSaveLoading(false);
        }
    }

    async function handleSaveGuessObjectCandidate(): Promise<void> {
        try {

            if (!guessObjectCandidate) {
                alert("Objet non valide");
                return;
            }

            if (!guessObjectCandidate.world_location_id) {
                alert("Localisation non valide, veuillez resélectionner");
                return;
            }

            // If id, then update, else post
            let id: string;
            if (guessObjectCandidate.id) {
                id = await patchGuessObject(guessObjectCandidate.id, guessObjectCandidate);
            } else {
                id = await saveGuessObject({
                    world_location_id: guessObjectCandidate.world_location_id.toString(),
                    ...guessObjectCandidate
                });
            }

            if (!id) throw new Error('Error saving or updating object');

            await addOrUpdateGuessObject(id);
        } catch (error) {
            console.log(error);
            alert("Erreur lors de l'enregistrement de l'objet");
        }
    }

    return (
        <div className="flex-1 w-full flex flex-row gap-12">
            <div className="flex-1 flex flex-col gap-8 w-full">
                <div className="flex flex-col w-full">
                    <div className="flex flex-row gap-4 mb-2 items-center h-8 ">
                        <h2 className="text-xl font-bold">Editeur de catégorie</h2>
                        <div className="flex flex-row items-center justify-center gap-2">
                            <Button size='sm' variant="primary" onClick={handleSaveCategory}>
                                {isSaveLoading
                                    ? <Loader />
                                    : <ArrowDownToLine size={20} />
                                }
                            </Button>
                            <DeleteCategoryPopup handleDeleteCategory={handleDeleteCategory} />
                        </div>
                    </div>
                    <span className="h-[2px] w-full bg-foreground"></span>
                </div>
                <div className="flex-1 flex flex-col gap-8 min-h-0">
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-full">
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
                                    className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full max-w-96"
                                />
                            </div>
                            <div className="h-full">
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
                                    className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full max-w-96"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col h-full gap-2 ">
                        <div className="flex flex-row gap-2 items-center h-7">
                            <h2 className="flex flex-row gap-1 items-baseline">
                                Objets
                                <span className="font-bold text-gray-300">
                                    {'(' + (category.guessObjects ? category.guessObjects.length : 0) + ')'}
                                </span>
                            </h2>
                            <input
                                placeholder="Rechercher"
                                value={searchObjectValue}
                                onChange={(e) => setSearchObjectValue(e.target.value)}
                                className="w-48 p-2 h-full rounded-md border border-gray-300"
                            />
                            <Button
                                variant="primary"
                                onClick={handleCreateGuessObject}
                                className="h-full font-bold p-auto">
                                +
                            </Button>
                        </div>

                        <div className="relative flex-1 min-h-0 rounded-xl border border-gray-300 overflow-hidden">
                            {/* Contenu scrollable */}
                            <div className="h-full overflow-y-auto 
                  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                <div className="p-3">
                                    <GuessObjectsList
                                        guessObjects={filteredGuessObjects}
                                        selectedGuessObject={guessObjectCandidate as GuessObject}
                                        handleSelectGuessObject={handleSelectGuessObject}
                                        handleDeleteGuessObject={handleDeleteGuessObject}
                                    />
                                </div>
                            </div>

                            {/* Ombre dégradée fixe en bas */}
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 
                  bg-gradient-to-t from-neutral-800 to-transparent" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col gap-8">
                <div className="flex flex-col w-full">
                    <div className="flex flex-row gap-4 mb-2 items-center h-8">
                        <h2 className="text-xl font-bold">Editeur d'objet</h2>
                        {guessObjectCandidate &&
                            <div className="flex items-center">
                                <Button size='sm' variant="primary" onClick={handleSaveGuessObjectCandidate}>
                                    <p className="font-bold">
                                        {!guessObjectCandidate.id ? (
                                            "Ajouter l'objet"
                                        ) : (
                                            "Mettre à jour l'objet"
                                        )}
                                    </p>
                                </Button>
                            </div>
                        }
                    </div>
                    <span className="h-[2px] w-full bg-foreground"></span>
                </div>
                <GuessObjectBuilder guessObjectCandidate={guessObjectCandidate} setGuessObjectCandidate={setGuessObjectCandidate} />
            </div>
        </div >
    )
}
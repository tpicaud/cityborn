"use client";

import { useEffect, useState } from "react";
import { GuessObjectCandidate, WorldLocation } from "@cityborn/types";
import { GuessObjectSearchInput } from "./guess-object-search-input";
import { patchGuessObject, saveGuessObject, searchGuessObjectById, searchWorldLocationById } from "./action";
import { WorldLocationSearchInput } from "./world-location-search-input";
import { WorldLocationViewer } from "./world-location-viewer";
import GuessObjectCard from "./guess-object-card";
import { Button } from "../ui/Button";
import { getGuessObject } from "../category-builder/action";

export function GuessObjectBuilder({
    guessObject,
    addOrUpdateGuessObject
}: {
    guessObject: GuessObjectCandidate | undefined
    addOrUpdateGuessObject: (id: string) => Promise<void>
}) {
    const [guessObjectCandidate, setGuessObjectCandidate] = useState<GuessObjectCandidate | undefined>(guessObject);

    useEffect(() => {
        const updateGuessObjectCandidate = async () => {
            if (!guessObject?.id) {
                setGuessObjectCandidate(guessObject);
                return;
            }

            try {
                const fullObject = await getGuessObject(guessObject.id, ['world_location']);
                setGuessObjectCandidate(fullObject || guessObject);
            } catch {
                setGuessObjectCandidate(guessObject);
            }
        };

        updateGuessObjectCandidate();
    }, [guessObject]);


    const updateGuessObjectCandidate = (update: Partial<GuessObjectCandidate>) => {
        setGuessObjectCandidate((prev) =>
            prev ? { ...prev, ...update } : (update as GuessObjectCandidate)
        );
    };

    async function handleFetchGuessObjectCandidate(guessObjectCandidate: GuessObjectCandidate | undefined) {
        if (!guessObjectCandidate?.source?.external_id) return;

        const fullCandidate = await searchGuessObjectById(guessObjectCandidate.source?.external_id);

        if (fullCandidate) {
            setGuessObjectCandidate({
                ...fullCandidate
            });
        }
    }

    async function handleFetchWorldLocationCandidate(world_location: WorldLocation | undefined) {
        if (!world_location?.id) return;

        const fullCandidate = await searchWorldLocationById(world_location.id, world_location.osm_type);

        if (fullCandidate) {
            updateGuessObjectCandidate({
                world_location_id: fullCandidate.id,
                world_location: fullCandidate
            });
        }
    }

    async function handleSaveGuessObject(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        try {
            e.preventDefault();

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
                const { world_location, ...rest } = guessObjectCandidate;
                id = await patchGuessObject(guessObjectCandidate.id, rest);
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

    if (!guessObjectCandidate) return <p className="text-base text-center text-gray-300">Veuillez sélectionner ou créer un objet</p>

    return (
        <div className="flex flex-col gap-8 w-full h-full">
            <form onSubmit={handleSaveGuessObject} className="flex flex-col gap-2 z-10">
                <label htmlFor="name">Rechercher un objet</label>
                <GuessObjectSearchInput
                    type="text"
                    id="name"
                    name={guessObjectCandidate?.name}
                    placeholder="e.g. Justin Timberlake"
                    value={guessObjectCandidate ? guessObjectCandidate.name : undefined}
                    onChange={(e) =>
                        updateGuessObjectCandidate({ name: e.target.value })
                    }
                    onSelect={handleFetchGuessObjectCandidate}
                    className="bg-white rounded-md shadow-md text-gray-800 p-2 h-10 w-full max-w-96"
                    popoverClassName="text-gray-800 bg-white rounded-md shadow-md min-w-full"
                />

                <label htmlFor="world_location_id" className="mt-4">
                    Localisation
                </label>
                <WorldLocationSearchInput
                    type="text"
                    id="world_location_id"
                    name={guessObjectCandidate?.world_location_id}
                    placeholder="e.g. Paris"
                    value={
                        guessObjectCandidate?.world_location ? (guessObjectCandidate.world_location.display_name ?? guessObjectCandidate.world_location.name) : ""
                    }
                    onChange={(e) =>
                        updateGuessObjectCandidate({
                            world_location: {
                                id: "",
                                osm_type: "relation",
                                name: e.target.value,
                                type: "point",
                                geometry: {
                                    type: "Point",
                                    coordinates: []
                                }
                            }
                        })
                    }
                    onSelect={handleFetchWorldLocationCandidate}
                    className="bg-white rounded-md shadow-md text-gray-800 p-2 h-10 w-full max-w-96"
                    popoverClassName="text-gray-800 bg-white rounded-md shadow-md min-w-full"
                />

                <label htmlFor="short_description" className="mt-4">
                    Courte description
                </label>
                <input
                    type="text"
                    name="short_description"
                    id="short_description"
                    placeholder="e.g. Tennisman"
                    value={guessObjectCandidate?.short_description ?? ""}
                    onChange={(e) =>
                        updateGuessObjectCandidate({ short_description: e.target.value })
                    }
                    className="bg-white text-gray-800 rounded-md p-2 w-full max-w-96"
                />
                <div className="w-full max-w-96 mt-4">
                    <Button variant="primary" type="submit">
                        Enregistrer
                    </Button>
                </div>
            </form>
            <div className="relative flex-1">
                <div className="flex justify-end absolute m-3 right-0 z-10 pointer-events-none">
                    <GuessObjectCard guessObject={guessObjectCandidate} />
                </div>

                <div className="absolute inset-0 z-0">
                    <WorldLocationViewer
                        world_location={guessObjectCandidate?.world_location}
                        API_KEY={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                    />
                </div>
            </div>
        </div>
    );
}

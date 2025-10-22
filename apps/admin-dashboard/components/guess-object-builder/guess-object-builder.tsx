"use client";

import { useEffect, useState } from "react";
import { GuessObjectCandidate, WorldLocation } from "@cityborn/types";
import { GuessObjectSearchInput } from "./guess-object-search-input";
import { searchGuessObjectById, searchWorldLocationById } from "./action";
import { WorldLocationSearchInput } from "./world-location-search-input";

export function GuessObjectBuilder() {
    const [guessObjectCandidate, setGuessObjectCandidate] = useState<GuessObjectCandidate | null>(null);
    const [worldLocationCandidate, setWorldLocationCandidate] = useState<WorldLocation | null>(null);

    const updateGuessObjectCandidate = (update: Partial<GuessObjectCandidate>) => {
        setGuessObjectCandidate((prev) =>
            prev ? { ...prev, ...update } : (update as GuessObjectCandidate)
        );
    };

    useEffect(() => {
        console.log(guessObjectCandidate);
    }, [guessObjectCandidate])

    useEffect(() => {
        if (worldLocationCandidate) {
            updateGuessObjectCandidate({
                world_location_id: worldLocationCandidate.id,
                world_location: worldLocationCandidate
            });
        }
    }, [worldLocationCandidate]);

        async function handleFetchGuessObjectCandidate(guessObjectCandidate: GuessObjectCandidate | undefined) {
        if (!guessObjectCandidate?.source?.external_id) return;

        const fullCandidate = await searchGuessObjectById(guessObjectCandidate.source?.external_id);
        console.log("Full candidate data:", fullCandidate);

        if (fullCandidate) { 
            setGuessObjectCandidate({
                ...fullCandidate
            });
        }
    }

    async function handleFetchWorldLocationCandidate(world_location: WorldLocation | undefined) {
        if (!world_location?.id) return;

        const fullCandidate = await searchWorldLocationById(world_location.id);
        console.log("Full candidate data:", fullCandidate);

        if (fullCandidate) {
            updateGuessObjectCandidate({
                world_location_id: fullCandidate.id,
                world_location: fullCandidate
            });
        }
    }

    return (
        <div className="w-full h-full">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-1">Constructeur d'objets</h2>
                <span className="h-[2px] w-full bg-foreground mb-5"></span>
                <form>
                    <div className="grid grid-cols-2 grid-rows-1 gap-10">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name">Rechercher un objet</label>
                            <GuessObjectSearchInput
                                type="text"
                                id="name"
                                placeholder="e.g. Justin Timberlake"
                                value={guessObjectCandidate ? guessObjectCandidate.name : undefined}
                                onChange={(e) =>
                                    updateGuessObjectCandidate({ name: e.target.value })
                                }
                                onSelect={handleFetchGuessObjectCandidate}
                                className="bg-white rounded-md shadow-md text-gray-800 p-2 h-10 w-full max-w-52"
                                popoverClassName="text-gray-800 bg-white rounded-md shadow-md min-w-full"
                            />

                            <label htmlFor="localisation" className="mt-4">
                                Localisation
                            </label>
                            <WorldLocationSearchInput
                                type="text"
                                id="localisation"
                                placeholder="e.g. Paris"
                                value={
                                    guessObjectCandidate?.world_location ? (guessObjectCandidate.world_location.display_name ?? guessObjectCandidate.world_location.name) : ""
                                }
                                onChange={(e) =>
                                    updateGuessObjectCandidate({
                                        world_location: {
                                            id: "",
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
                                id="short_description"
                                placeholder="e.g. Tennisman"
                                value={guessObjectCandidate?.short_description ?? ""}
                                onChange={(e) =>
                                    updateGuessObjectCandidate({ short_description: e.target.value })
                                }
                                className="bg-white text-gray-800 rounded-md p-2 w-full max-w-96"
                            />
                        </div>

                        <div className="w-72 h-72 rounded-md border">
                            {guessObjectCandidate?.image ? (
                                <img
                                    src={guessObjectCandidate.image}
                                    alt="image"
                                    className="w-full h-full object-contain"
                                />
                            ) : null}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

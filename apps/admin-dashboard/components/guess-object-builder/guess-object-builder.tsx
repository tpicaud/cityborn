"use client";

import { Dispatch, FormEventHandler, SetStateAction, useEffect, useState } from "react";
import { GuessObjectCandidate, WorldLocation } from "@cityborn/types";
import { GuessObjectSearchInput } from "./guess-object-search-input";
import { searchGuessObjectById, searchWorldLocationById } from "./action";
import { WorldLocationSearchInput } from "./world-location-search-input";
import { WorldLocationViewer } from "./world-location-viewer";
import GuessObjectCard from "./guess-object-card";
import { getGuessObject } from "../category-builder/action";

export function GuessObjectBuilder({
    guessObjectCandidate,
    setGuessObjectCandidate
}: {
    guessObjectCandidate: GuessObjectCandidate | undefined,
    setGuessObjectCandidate: Dispatch<SetStateAction<GuessObjectCandidate | undefined>>
}) {

    useEffect(() => {
        const updateGuessObjectCandidate = async () => {
            if (guessObjectCandidate && guessObjectCandidate.id) {
                try {
                    const fullObject = await getGuessObject(guessObjectCandidate.id, ['world_location']);
                    setGuessObjectCandidate(fullObject || guessObjectCandidate);
                } catch {
                    setGuessObjectCandidate(guessObjectCandidate);
                }
            };
        }

        updateGuessObjectCandidate();
    }, [guessObjectCandidate?.id]);


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

    if (!guessObjectCandidate) return <p className="text-base text-center text-gray-300">Veuillez sélectionner ou créer un objet</p>

    return (
        <div className="flex flex-col gap-8 w-full h-full">
            <form className="flex flex-col z-10 h-full w-full">
                <div className="grid grid-cols-2 gap-4 mb-7">
                    <div className="h-full">
                        <label htmlFor="name">Nom</label>
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
                            className="bg-white rounded-md shadow-md text-gray-800 mt-3 p-2 h-10 w-full max-w-96"
                            popoverClassName="text-gray-800 bg-white rounded-md shadow-md min-w-full"
                        />
                    </div>

                    <div className="w-full">
                        <label htmlFor="short_description" className="mb-2">
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
                            className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full max-w-96"
                        />
                    </div>
                </div>

                <label htmlFor="short_description" className="mb-3">
                    Localisation
                </label>

                <div className="relative h-full">
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
                        className="bg-white rounded-md shadow-lg text-gray-800
                                    p-2 h-10 w-full max-w-[50%]
                                    absolute left-0 m-3 z-40"
                        popoverClassName="text-gray-800 bg-white
                                          rounded-lg shadow-lg min-w-full z-[9999]
                                          max-h-60 overflow-y-auto"
                    />

                    <div className="flex justify-end absolute h-full m-3 right-0 z-70 pointer-events-none">
                        <GuessObjectCard guessObject={guessObjectCandidate} />
                    </div>

                    <div className="absolute inset-0 z-0 h-full w-full">
                        <WorldLocationViewer
                            world_location={guessObjectCandidate?.world_location}
                            API_KEY={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}

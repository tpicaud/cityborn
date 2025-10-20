"use client";

import { useEffect, useState } from "react";
import { SearchInput } from "./search-input";
import { GuessObjectCandidate } from "@cityborn/types";
import { searchById } from "./action";

export function GuessObjectBuilder() {

    const [guessObjectCandidate, setGuessObjectCandidate] = useState<null | GuessObjectCandidate>(null);

    const [shortDescription, setShortDescription] = useState<string>("");
    const [image, setImage] = useState<string>("");
    const [worldLocationId, setWorldLocationId] = useState<string>("");

    useEffect(() => {
        const getFullObject = async () => {
            if (guessObjectCandidate) {
                const full_candidate = await searchById(guessObjectCandidate.external_id);
                console.log("Full candidate data:", full_candidate);

                setShortDescription(full_candidate?.short_description ?? "");
                setImage(full_candidate?.image ?? "");
                setWorldLocationId(full_candidate?.world_location_id ?? "");
            }
        }

        getFullObject();
    }, [guessObjectCandidate]);

    useEffect(() => {
        if (shortDescription || image) {
            setGuessObjectCandidate((prev) =>
                prev
                    ? { ...prev, shortDescription, image, world_location_id: worldLocationId }
                    : ({ short_description: shortDescription, image } as GuessObjectCandidate)
            );
        }
    }, [shortDescription, image, worldLocationId]);

    return (
        <div className="w-full h-full">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-1">Constructeur d'objets</h2>
                <span className="h-[2px] w-full bg-foreground mb-5"></span>
                <form>
                    <div className="grid grid-cols-2 grid-rows-1">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name">Rechercher un objet</label>
                            <SearchInput label="Rechercher un objet" placeholder="e.g. Justin Timberlake" setCandidate={setGuessObjectCandidate} />

                            <label htmlFor="description" className="mt-4">Description</label>
                            <input
                                type="text"
                                id="description"
                                placeholder="e.g. Tennisman"
                                value={shortDescription}
                                onChange={(e) => setShortDescription(e.target.value)}
                                className="bg-white text-gray-800 rounded-md p-2 max-w-52" />

                            <label htmlFor="localisation" className="mt-4">Localisation</label>
                            <input
                                type="text"
                                id="localisation"
                                placeholder="e.g. Paris"
                                value={worldLocationId}
                                onChange={(e) => setWorldLocationId(e.target.value)}
                                className="bg-white text-gray-800 rounded-md p-2 max-w-52" />
                        </div>
                        <div className="w-72 h-72 rounded-md border">{image ? (
                            <img
                                src={image}
                                alt="image"
                                className="w-full h-full object-contain"
                            />
                        ) : null}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
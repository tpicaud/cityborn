"use client";

import { useEffect, useState } from "react";
import { SearchInput } from "./search-input";
import { GuessObjectCandidate } from "@cityborn/types";
import { searchById } from "./action";

export function GuessObjectBuilder() {
    const [guessObjectCandidate, setGuessObjectCandidate] = useState<GuessObjectCandidate | null>(null);

    // Fonction utilitaire pour mettre à jour partiellement l'objet
    const updateGuessObjectCandidate = (update: Partial<GuessObjectCandidate>) => {
        setGuessObjectCandidate((prev) =>
            prev ? { ...prev, ...update } : (update as GuessObjectCandidate)
        );
    };

    useEffect(() => {
        const getFullObject = async () => {
            if (!guessObjectCandidate?.external_id) return;

            const fullCandidate = await searchById(guessObjectCandidate.external_id);
            console.log("Full candidate data:", fullCandidate);

            if (fullCandidate) {
                updateGuessObjectCandidate({
                    short_description: fullCandidate.short_description ?? "",
                    image: fullCandidate.image ?? "",
                    world_location_id: fullCandidate.world_location_id ?? "",
                    world_location: fullCandidate.world_location
                });
            }
        };

        getFullObject();
    }, [guessObjectCandidate?.external_id]);

    return (
        <div className="w-full h-full">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-1">Constructeur d'objets</h2>
                <span className="h-[2px] w-full bg-foreground mb-5"></span>
                <form>
                    <div className="grid grid-cols-2 grid-rows-1 gap-10">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name">Rechercher un objet</label>
                            <SearchInput
                                type="text"
                                id="name"
                                placeholder="e.g. Justin Timberlake"
                                value={guessObjectCandidate ? guessObjectCandidate.name : undefined}
                                onChange={(e) =>
                                    updateGuessObjectCandidate({ name: e.target.value })
                                }
                                setCandidate={setGuessObjectCandidate}
                            />

                            <label htmlFor="localisation" className="mt-4">
                                Localisation
                            </label>
                            <input
                                type="text"
                                id="localisation"
                                placeholder="e.g. Paris"
                                value={
                                    guessObjectCandidate?.world_location ? guessObjectCandidate.world_location.display_name : ""
                                    }
                                onChange={(e) =>
                                    updateGuessObjectCandidate({ world_location_id: e.target.value })
                                }
                                className="bg-white text-gray-800 rounded-md p-2 w-full max-w-96"
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

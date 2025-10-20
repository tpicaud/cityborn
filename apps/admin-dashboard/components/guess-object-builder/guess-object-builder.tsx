"use client";

import { useEffect, useState } from "react";
import { SearchInput } from "./search-input";
import { GuessObjectCandidate } from "@cityborn/types";
import { searchById } from "./action";

export function GuessObjectBuilder() {

    const [guessObjectCandidate, setGuessObjectCandidate] = useState<null | GuessObjectCandidate>(null);

    useEffect(() => {
        console.log("Selected candidate:", guessObjectCandidate);

        const getFullObject = async () => {
            if (guessObjectCandidate) {
                const full_candidate = await searchById(guessObjectCandidate.external_id);
                console.log("Full candidate data:", full_candidate);
            }
        }
        
        getFullObject();
    }, [guessObjectCandidate]);

    return (
        <div className="w-full h-full">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-1">Constructeur d'objets</h2>
                <span className="h-[2px] w-full bg-foreground mb-5"></span>
                <SearchInput label="Rechercher un objet" placeholder="e.g. Justin Timberlake" setCandidate={setGuessObjectCandidate} />
            </div>
        </div>
    )
}
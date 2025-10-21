import * as Ariakit from "@ariakit/react";
import { ChangeEventHandler, startTransition, useEffect, useState } from "react";
import { searchGuessObjectByName } from "./action";
import { GuessObjectCandidate } from "@cityborn/types";

export function GuessObjectSearchInput({
    type = "text",
    id,
    placeholder = "e.g., Pomme",
    value,
    onChange,
    setCandidate
}: {
    type: string;
    id: string;
    placeholder?: string;
    value: string | undefined;
    onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
    setCandidate: React.Dispatch<React.SetStateAction<GuessObjectCandidate | null>>;
}) {

    const [searchValue, setSearchValue] = useState("");
    const [matches, setMatches] = useState<GuessObjectCandidate[]>([]);

    useEffect(() => {
        if (!searchValue) {
            setMatches([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const candidates = await searchGuessObjectByName(searchValue);
                setMatches(candidates);
            } catch (error) {
                console.error("Search error:", error);
                setMatches([]);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchValue]);

    return (
        <Ariakit.ComboboxProvider
            setValue={(value) => {
                startTransition(() => setSearchValue(value));
            }}
        >
            <Ariakit.Combobox
                type={type}
                id={id}
                placeholder={placeholder}
                value={value ?? ""}
                autoComplete='off'
                onChange={onChange}
                className="bg-white rounded-md shadow-md text-gray-800 pl-2 h-10 w-52 mt-2"
            />
            <Ariakit.ComboboxPopover gutter={8} sameWidth className="text-gray-800 bg-white rounded-md shadow-md min-w-full">
                {matches.length ? (
                    matches.slice(0, 5).map((candidate) => (
                        <Ariakit.ComboboxItem
                            key={candidate.external_id}
                            value={candidate.name}
                            onClick={() => setCandidate(candidate)}
                            className="p-2 hover:bg-gray-300 hover:rounded-md hover:cursor-pointer"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{candidate.name}</span>
                                <span className="text-xs text-gray-500">{candidate.short_description}</span>
                            </div>
                        </Ariakit.ComboboxItem>
                    ))
                ) : (
                    searchValue ? <div className="p-2 text-gray-800 bg-white rounded-md shadow-md min-w-full">No results found</div> : <div></div>
                )}
            </Ariakit.ComboboxPopover>
        </Ariakit.ComboboxProvider>
    );
}
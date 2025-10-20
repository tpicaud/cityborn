import * as Ariakit from "@ariakit/react";
import { startTransition, useEffect, useState } from "react";
import { search } from "./action";
import { GuessObjectCandidate } from "@cityborn/types";

export function SearchInput({ label = "Input", placeholder = "e.g., Pomme" }: { label?: string; placeholder?: string }) {

    const [searchValue, setSearchValue] = useState("");
    const [matches, setMatches] = useState<GuessObjectCandidate[]>([]);

    useEffect(() => {
        if (!searchValue) {
            setMatches([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const candidates = await search(searchValue);
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
            <Ariakit.ComboboxLabel>
                {label}
            </Ariakit.ComboboxLabel>
            <Ariakit.Combobox placeholder={placeholder} autoComplete='off' className="bg-white rounded-md shadow-md text-gray-800 pl-2 h-10 w-40 mt-1" />
            <Ariakit.ComboboxPopover gutter={8} className="text-gray-800 bg-white rounded-md shadow-md min-w-full">
                {matches.length ? (
                    matches.slice(0, 5).map((item) => (
                        <Ariakit.ComboboxItem
                            key={item.external_id}
                            value={item.label}
                            className="p-2 hover:bg-gray-300 hover:rounded-md hover:cursor-pointer"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                <span className="text-xs text-gray-500">{item.description}</span>
                            </div>
                        </Ariakit.ComboboxItem>
                    ))
                ) : (
                    searchValue ? <div className="pl-2 text-gray-800">No results found</div> : <div></div>
                )}
            </Ariakit.ComboboxPopover>
        </Ariakit.ComboboxProvider>
    );
}
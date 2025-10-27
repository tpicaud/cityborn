import { GuessObject } from "@cityborn/types";
import { useEffect } from "react";

export function GuessObjectsList({
    guessObjects,
    selectedGuessObject,
    handleSelectGuessObject
}: {
    guessObjects: GuessObject[]
    selectedGuessObject: GuessObject | undefined
    handleSelectGuessObject: (guessObject: GuessObject) => void
}) {

    useEffect(() => {
        console.log('update list')
    }, [guessObjects[0]]);

    return (
        <div className="h-full w-full">
            {
                guessObjects.length === 0 ? (
                    <p className="text-center text-gray-300">
                        Aucun objet dans cette catégorie
                    </p>
                ) : (
                    guessObjects.map((obj, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelectGuessObject(obj)}
                            className={`rounded-xl border-2 p-3 bg-neutral-700 hover:border-gray-100 hover:cursor-pointer
                                                    ${selectedGuessObject === obj ? 'border-gray-100' : 'border-transparent'}`}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex flex-row gap-x-2 items-baseline">
                                    <div className="text-base font-bold">{obj.name}</div>
                                    {obj.world_location?.display_name && (
                                        <div className="text-xs text-gray-300">
                                            {obj.world_location.display_name}
                                        </div>
                                    )}
                                </div>

                                {obj.short_description ? (
                                    <p className="text-xs">{obj.short_description}</p>
                                ) : (
                                    <p className="text-xs italic">Aucune description</p>
                                )}
                            </div>
                        </div>
                    ))
                )
            }
        </div>
    )
}
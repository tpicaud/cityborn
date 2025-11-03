import { GuessObject } from "@cityborn/types";
import { Button } from "../ui/Button";

export function GuessObjectsList({
    guessObjects,
    selectedGuessObject,
    handleSelectGuessObject,
    handleDeleteGuessObject
}: {
    guessObjects: GuessObject[] | undefined
    selectedGuessObject: GuessObject | undefined
    handleSelectGuessObject: (guessObject: GuessObject) => void,
    handleDeleteGuessObject: (guessObject: GuessObject) => void
}) {
    return (
        <div className="h-full w-full z-0">
            {
                (!guessObjects || guessObjects.length === 0) ? (
                    <p className="text-center text-gray-300">
                        Aucun objet dans cette catégorie
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {guessObjects.map((obj, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelectGuessObject(obj)}
                                className={`rounded-xl border-2 p-3 bg-neutral-700 transition
                                          hover:border-gray-100 hover:cursor-pointer
                                            ${selectedGuessObject?.id === obj.id ? 'border-gray-100' : 'border-transparent'}`}
                            >
                                <div className="flex flex-row items-center justify-between">
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
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="group-hover:!border-transparent group-hover:!bg-neutral-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteGuessObject(obj)
                                        }}>X</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }
        </div>
    )
}
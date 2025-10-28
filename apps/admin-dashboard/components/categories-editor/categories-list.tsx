import { Category } from "@cityborn/types";

export function CategoriesList({
    categories,
    onCategorySelect
}: {
    categories: Category[],
    onCategorySelect: (category: Category) => void;
}) {
    return (
        <div className="w-full h-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map(category => (
                <div
                    onClick={() => onCategorySelect(category)}
                    className="w-full h-full
                                rounded-xl border-2 p-3 bg-neutral-700 transition
                              hover:border-gray-100 hover:cursor-pointer"
                >
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-bold">{category.name}</h3>
                        {
                            category.description
                                ? <p className="text-base">{category.description}</p>
                                : <p className="italic text-gray-300">Aucune description</p>
                        }
                    </div>
                </div>
            ))}
        </div>
    )
}
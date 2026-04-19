import type { Category } from '@cityborn/types';

export function CategoriesList({
  categories,
  onCategorySelect,
}: {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
}) {
  return (
    <div
      className="w-full h-full grid grid-cols-1 gap-2
                        sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => onCategorySelect(category)}
          className={`w-full h-full
                                flex flex-row justify-between p-3 bg-neutral-700
                                rounded-xl border border-solid
                                ${category.isPublished ? 'border-green-600' : 'border-orange-500'}
                                hover:outline-2 hover:outline-orange-100 hover:border-transparent
                                transition-all duration-50 cursor-pointer`}
        >
          <div className="flex flex-col gap-1 justfy-left">
            <div>
              <div className="italic font-extralight text-xs">
                {category.isPublished ? (
                  <p className="text-green-600">Publiée</p>
                ) : (
                  <p className="text-orange-500">Non publiée</p>
                )}
              </div>
              <h3 className="text-left text-lg font-bold">{category.name}</h3>
            </div>
            <div>
              {category.description ? (
                <p className="text-base">{category.description}</p>
              ) : (
                <p className="italic text-gray-300">Aucune description</p>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center items-center text-center gap-1">
            <div className="text-2xl font-bold">
              {category.guessObjects ? (
                <h2>{category.guessObjects.length}</h2>
              ) : (
                <h2 className="">?</h2>
              )}
            </div>
            <p>objets</p>
          </div>
        </div>
      ))}
    </div>
  );
}

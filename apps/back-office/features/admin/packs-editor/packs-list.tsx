import type { Pack, Theme } from '@cityborn/api';
import { ThemeBadge } from '../theme-badge';

export function PacksList({
  packs,
  themes,
  onPackSelect,
}: {
  packs: Pack[];
  themes: Theme[];
  onPackSelect: (pack: Pack) => void;
}) {
  return (
    <div
      className="w-full h-full grid grid-cols-1 gap-2
                        sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {packs.map((pack) => (
        <button
          key={pack.id}
          type="button"
          onClick={() => onPackSelect(pack)}
          className={`w-full h-full text-left
                                flex flex-row justify-between p-3 bg-neutral-700
                                rounded-xl border border-solid
                                ${pack.isPublished ? 'border-green-600' : 'border-orange-500'}
                                hover:outline-2 hover:outline-orange-100 hover:border-transparent
                                transition-all duration-50 cursor-pointer`}
        >
          <div className="flex flex-col gap-1 justfy-left">
            <div>
              <div className="italic font-extralight text-xs">
                {pack.isPublished ? (
                  <p className="text-green-600">Publié</p>
                ) : (
                  <p className="text-orange-500">Non publié</p>
                )}
              </div>
              <h3 className="text-left text-lg font-bold">{pack.name}</h3>
              <ThemeBadge themes={themes} themeId={pack.themeId} />
            </div>
            <div>
              {pack.description ? (
                <p className="text-base">{pack.description}</p>
              ) : (
                <p className="italic text-gray-300">Aucune description</p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

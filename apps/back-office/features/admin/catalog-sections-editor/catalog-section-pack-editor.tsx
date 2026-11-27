import {
  type CatalogSection,
  CatalogSectionMoveDirection,
  type Pack,
} from '@cityborn/api';
import {
  type CatalogSectionPacks,
  useCatalogSectionPacks,
} from '@cityborn/client/admin';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';

function PackSummary({ pack }: { pack: Pack }) {
  return (
    <span className="flex flex-1 flex-wrap items-baseline gap-2 break-all">
      <span>{pack.name}</span>
      <span
        className={`text-xs italic ${pack.isPublished ? 'text-green-600' : 'text-orange-500'}`}
      >
        {pack.isPublished ? 'Publié' : 'Non publié'}
      </span>
    </span>
  );
}

export function CatalogSectionPackEditor({
  section,
  isBusy,
}: {
  section: CatalogSection;
  isBusy: boolean;
}) {
  const sectionPacks: CatalogSectionPacks = useCatalogSectionPacks({
    section,
  });
  const isDisabled: boolean = isBusy || sectionPacks.isSaving;
  const searchId: string = `catalog-section-pack-search-${section.id}`;
  if (sectionPacks.loadError)
    return (
      <div role="alert" className="text-red-400">
        <p>{sectionPacks.loadError}</p>
        <Button onClick={sectionPacks.reload}>Réessayer</Button>
      </div>
    );
  if (sectionPacks.isLoading) return <Loader />;
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-700 pt-3">
      {sectionPacks.sectionPacks.length === 0 ? (
        <p className="text-zinc-400">Aucun pack dans cette section.</p>
      ) : (
        <ol
          aria-label={`Packs de ${section.name}`}
          className="flex flex-col gap-1"
        >
          {sectionPacks.sectionPacks.map((pack, index) => (
            <li key={pack.id} className="flex items-center gap-2">
              <PackSummary pack={pack} />
              <Button
                type="button"
                variant="ghost"
                disabled={isDisabled || index === 0}
                onClick={() =>
                  sectionPacks.movePack({
                    pack,
                    direction: CatalogSectionMoveDirection.UP,
                  })
                }
                aria-label={`Monter ${pack.name}`}
              >
                <ChevronUp size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={
                  isDisabled || index === sectionPacks.sectionPacks.length - 1
                }
                onClick={() =>
                  sectionPacks.movePack({
                    pack,
                    direction: CatalogSectionMoveDirection.DOWN,
                  })
                }
                aria-label={`Descendre ${pack.name}`}
              >
                <ChevronDown size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => sectionPacks.removePack(pack)}
                aria-label={`Retirer ${pack.name}`}
              >
                <Minus size={18} />
              </Button>
            </li>
          ))}
        </ol>
      )}
      <label htmlFor={searchId}>Rechercher un pack</label>
      <input
        id={searchId}
        type="search"
        value={sectionPacks.packQuery}
        onChange={(event) => sectionPacks.searchPacks(event.target.value)}
        className="min-w-0 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
      />
      {sectionPacks.packCandidates.length === 0 ? (
        <p className="text-zinc-400">Aucun pack à ajouter.</p>
      ) : (
        <ul
          aria-label={`Packs à ajouter à ${section.name}`}
          className="flex max-h-64 flex-col gap-1 overflow-auto"
        >
          {sectionPacks.packCandidates.map((pack) => (
            <li key={pack.id} className="flex items-center gap-2">
              <PackSummary pack={pack} />
              <Button
                type="button"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => sectionPacks.addPack(pack)}
                aria-label={`Ajouter ${pack.name}`}
              >
                <Plus size={18} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

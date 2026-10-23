'use client';

import type { Pack } from '@cityborn/api';
import { type PackCatalog, usePackCatalog } from '@cityborn/client/admin';
import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { CreatePackDialog } from './create-pack-popup';
import { PacksList } from './packs-list';

export function PacksEditor() {
  const router = useRouter();
  const { packs, themes, isLoading, reloadPacks }: PackCatalog =
    usePackCatalog();
  const [searchValue, setSearchValue] = useState<string>('');

  const filteredPacks = useMemo(() => {
    return packs.filter((pack) =>
      pack.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [packs, searchValue]);

  function onPackSelect(pack: Pack): void {
    router.push(`/dashboard/edit-pack?id=${pack.id}`);
  }

  return (
    <div className="h-full w-full flex flex-col gap-6">
      <div className="flex flex-col w-full">
        <div className="flex flex-row gap-2 mb-2 items-center">
          <h2 className="text-xl font-bold">Packs</h2>
        </div>

        <span className="h-[2px] w-full bg-foreground"></span>
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <h2 className="text-xl font-bold">Rechercher</h2>
        <input
          placeholder="e.g. Sport"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-[60%] pl-2 h-10 rounded-xl border border-gray-300"
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-row gap-2 mb-1">
          <CreatePackDialog onPackCreated={onPackSelect} />
          <Button variant="outline" onClick={reloadPacks}>
            <RefreshCcw />
          </Button>
        </div>
        {!isLoading ? (
          !filteredPacks || filteredPacks.length === 0 ? (
            <p className="text-center text-gray-300">Aucun pack trouvé</p>
          ) : (
            <PacksList
              packs={filteredPacks}
              themes={themes}
              onPackSelect={onPackSelect}
            />
          )
        ) : (
          <div className="flex items-center justify-center">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
}

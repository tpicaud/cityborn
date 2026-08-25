import * as Ariakit from '@ariakit/react';
import { getFriendlyErrorMessage, isApiError } from '@cityborn/api';
import Papa from 'papaparse';
import { useRef, useState } from 'react';
import {
  saveGuessObject,
  searchGuessObjectByExternalId,
  searchGuessObjectByName,
} from '@/server/actions/guess-object';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';

interface Objects {
  name: string;
  description?: string;
  errorMessage?: string;
}

function resolveImportErrorMessage(error: unknown): string {
  if (isApiError(error)) return getFriendlyErrorMessage(error);
  if (error instanceof Error) return error.message;
  return 'Erreur inconnue';
}

interface ImportRecap {
  success: number;
  failed: number;
  failed_objects: Objects[];
}

export function ImportCSVPopup({
  addOrUpdateGuessObjectToCategory,
}: {
  addOrUpdateGuessObjectToCategory: (id: string) => Promise<void>;
}) {
  const dialog = Ariakit.useDialogStore();
  const [file, setFile] = useState<File>();
  const [objects, setObjects] = useState<Objects[]>();
  const [state, setState] = useState<'start' | 'loading' | 'recap'>('start');
  const cancelImportRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [importRecap, setImportRecap] = useState<ImportRecap>({
    success: 0,
    failed: 0,
    failed_objects: [],
  });

  function handleClose() {
    setState('start');
    setFile(undefined);
    setObjects(undefined);
    setImportRecap({
      success: 0,
      failed: 0,
      failed_objects: [],
    });
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFile(file);

    const reader = new FileReader();

    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      const parsed_objects = await parseObjectFromCSV(csvText);
      setObjects(parsed_objects);
    };

    reader.readAsText(file);
  };

  async function parseObjectFromCSV(csv: string): Promise<
    {
      name: string;
      description?: string;
    }[]
  > {
    const result = Papa.parse<Record<string, string>>(csv, { header: true });
    const objects: { name: string; description: string }[] = [];

    for (const row of result.data) {
      if (row.Name?.trim()) {
        objects.push({
          name: row.Name.trim(),
          description: row.Description.trim() ?? undefined,
        });
      }
    }

    return objects;
  }

  async function handleImportObjects() {
    if (!objects) return;

    setState('loading');
    cancelImportRef.current = false;
    setImportRecap({
      success: 0,
      failed: 0,
      failed_objects: [],
    });

    for (const obj of objects) {
      if (cancelImportRef.current) break;

      try {
        const searchResult = await searchGuessObjectByName(obj.name);
        if (!searchResult.ok) throw searchResult.error;
        const candidate_obj = searchResult.data[0];

        const external_id = candidate_obj.source?.external_id;
        if (!external_id) throw new Error('Identifiant externe introuvable');
        const candidateResult =
          await searchGuessObjectByExternalId(external_id);
        if (!candidateResult.ok) throw candidateResult.error;
        const full_obj = candidateResult.data;
        if (!full_obj) throw new Error('Objet introuvable');
        if (obj.description) full_obj.short_description = obj.description;

        const locationId = full_obj.world_location?.id;
        if (!locationId) throw new Error('Localisation introuvable');

        const saveResult = await saveGuessObject({
          ...full_obj,
          world_location_id: locationId,
        });
        if (!saveResult.ok) throw saveResult.error;

        await addOrUpdateGuessObjectToCategory(saveResult.data);

        setImportRecap((prev) => {
          const newRecap = {
            ...prev,
            success: prev.success + 1,
          };
          setProgress(
            Math.round(
              ((newRecap.success + newRecap.failed) / objects.length) * 100,
            ),
          );
          return newRecap;
        });
      } catch (error) {
        const errorMessage = resolveImportErrorMessage(error);
        console.error(`Error importing ${obj.name}: ${errorMessage}`);

        setImportRecap((prev) => {
          const newRecap = {
            ...prev,
            failed: prev.failed + 1,
            failed_objects: [...prev.failed_objects, { ...obj, errorMessage }],
          };
          setProgress(
            Math.round(
              ((newRecap.success + newRecap.failed) / objects.length) * 100,
            ),
          );
          return newRecap;
        });
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setState('recap');
  }

  function handleStopImport() {
    cancelImportRef.current = true;

    const interval = setInterval(() => {
      if (state !== 'loading') {
        clearInterval(interval);
      }
    }, 100);
  }

  return (
    <div className="w-full h-full flex items-center">
      <Button size="sm" variant="outline" onClick={dialog.show}>
        Importer un CSV
      </Button>

      <Ariakit.Dialog
        store={dialog}
        portal={false}
        onClose={handleClose}
        hideOnInteractOutside={state !== 'loading'}
        backdrop={<div className="fixed bg-black/40 backdrop-blur-sm z-40" />}
        className="fixed z-60 flex flex-col items-center justify-center w-md
                           top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                           bg-background rounded-xl
                           focus:outline-none"
      >
        <div className="h-full w-full p-6">
          {state === 'start' ? (
            <div className="w-full h-full flex flex-col gap-4">
              <label
                htmlFor="csvInput"
                className="flex items-center justify-center h-24 w-full
                       border-2 border-dashed border-foreground rounded-md cursor-pointer
                       text-center text-grayforeground hover:bg-neutral-800 transition"
              >
                {file ? file.name : 'Sélectionnez un fichier'}
              </label>

              <input
                id="csvInput"
                placeholder="Sélectionnez un fichier"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {objects && (
                <p className="text-center">
                  ✅ {objects?.length} noms d'objets trouvés
                </p>
              )}
              <div className="flex justify-center gap-2">
                <Button
                  variant="primary"
                  disabled={!objects}
                  onClick={handleImportObjects}
                >
                  Importer les objets
                </Button>
              </div>
            </div>
          ) : state === 'loading' ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <Loader />
              <p>
                {importRecap.failed + importRecap.success} / {objects?.length}
              </p>

              <div className="w-full bg-gray-300 h-3 mt-2">
                <div
                  className="bg-blue-500 h-3 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <Button variant="destructive" onClick={handleStopImport}>
                Annuler
              </Button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <p>✅ {importRecap.success} objets ajoutés</p>
              <div className="flex flex-col items-center justify-center gap-2">
                <p>❌ {importRecap.failed} imports échoués</p>
                {importRecap.failed_objects && (
                  <div className="h-max-24 overflow-y-auto">
                    <ul className="list-disc pl-5">
                      {importRecap.failed_objects.map((obj) => (
                        <li key={obj.name}>
                          {obj.name} — {obj.errorMessage}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button variant="primary" onClick={dialog.hide}>
                OK
              </Button>
            </div>
          )}
        </div>
      </Ariakit.Dialog>
    </div>
  );
}

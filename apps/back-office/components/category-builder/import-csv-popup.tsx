import * as Ariakit from '@ariakit/react';
import type { GuessObjectId } from '@cityborn/api';
import {
  type GuessObjectImport,
  type ImportedGuessObject,
  useGuessObjectImport,
} from '@cityborn/client/admin';
import Papa from 'papaparse';
import { useState } from 'react';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';

function parseGuessObjectsFromCSV(csv: string): ImportedGuessObject[] {
  const result: Papa.ParseResult<Record<string, string>> = Papa.parse<
    Record<string, string>
  >(csv, { header: true });

  return result.data
    .filter((row: Record<string, string>) => row.Name?.trim())
    .map((row: Record<string, string>) => ({
      name: row.Name.trim(),
      description: row.Description?.trim(),
    }));
}

export function ImportCSVPopup({
  onGuessObjectImported,
}: {
  onGuessObjectImported: (guessObjectId: GuessObjectId) => Promise<void>;
}) {
  const dialog = Ariakit.useDialogStore();
  const [file, setFile] = useState<File>();
  const [objects, setObjects] = useState<ImportedGuessObject[]>();
  const {
    importStatus,
    importRecap,
    progressPercent,
    importGuessObjects,
    stopImport,
    resetImport,
  }: GuessObjectImport = useGuessObjectImport({ onGuessObjectImported });

  function handleClose() {
    resetImport();
    setFile(undefined);
    setObjects(undefined);
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
      setObjects(parseGuessObjectsFromCSV(csvText));
    };

    reader.readAsText(file);
  };

  async function handleImportObjects() {
    if (!objects) return;
    await importGuessObjects(objects);
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
        hideOnInteractOutside={importStatus !== 'importing'}
        backdrop={<div className="fixed bg-black/40 backdrop-blur-sm z-40" />}
        className="fixed z-60 flex flex-col items-center justify-center w-md
                           top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                           bg-background rounded-xl
                           focus:outline-none"
      >
        <div className="h-full w-full p-6">
          {importStatus === 'idle' ? (
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
          ) : importStatus === 'importing' ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <Loader />
              <p>
                {importRecap.importedCount + importRecap.failedImports.length} /{' '}
                {objects?.length}
              </p>

              <div className="w-full bg-gray-300 h-3 mt-2">
                <div
                  className="bg-blue-500 h-3 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <Button variant="destructive" onClick={stopImport}>
                Annuler
              </Button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <p>✅ {importRecap.importedCount} objets ajoutés</p>
              <div className="flex flex-col items-center justify-center gap-2">
                <p>❌ {importRecap.failedImports.length} imports échoués</p>
                {importRecap.failedImports && (
                  <div className="h-max-24 overflow-y-auto">
                    <ul className="list-disc pl-5">
                      {importRecap.failedImports.map((obj) => (
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

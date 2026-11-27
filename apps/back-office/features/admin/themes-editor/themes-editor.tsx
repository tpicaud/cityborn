'use client';
import {
  type ThemesManagement,
  useThemesManagement,
} from '@cityborn/client/admin';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { OrderedList } from '../ordered-list-editor';
import { ThemeRow } from './theme-row';
export function ThemesEditor() {
  const editor: ThemesManagement = useThemesManagement();
  const { creationForm, isBusy }: ThemesManagement = editor;
  const creationError: string | undefined =
    creationForm.formState.errors.name?.message;
  return (
    <section
      className="flex w-full flex-col gap-6 overflow-auto"
      aria-labelledby="themes-title"
    >
      <h2
        id="themes-title"
        className="text-xl font-bold border-b border-zinc-500 pb-2"
      >
        Thèmes
      </h2>
      <form
        onSubmit={editor.create}
        noValidate
        className="flex flex-col gap-2 max-w-xl"
      >
        <label htmlFor="new-theme">Nouveau thème</label>
        <div className="flex gap-2">
          <input
            id="new-theme"
            {...creationForm.register('name')}
            disabled={isBusy}
            aria-invalid={!!creationError}
            aria-describedby={creationError ? 'new-theme-error' : undefined}
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          <Button type="submit" disabled={isBusy}>
            Ajouter
          </Button>
        </div>
        {creationError && (
          <p id="new-theme-error" role="alert" className="text-red-400">
            {creationError}
          </p>
        )}
      </form>
      {editor.hasLoadError ? (
        <div role="alert" className="text-red-400">
          <p>Les thèmes n'ont pas pu être chargés.</p>
          <Button onClick={editor.reload}>Réessayer</Button>
        </div>
      ) : editor.isLoading ? (
        <Loader />
      ) : (
        <div className="max-w-3xl">
          <OrderedList
            label="Thèmes"
            items={editor.themes}
            renderItem={({ item: theme, position }) => (
              <ThemeRow theme={theme} editor={editor} position={position} />
            )}
          />
        </div>
      )}
    </section>
  );
}

'use client';
import {
  type ThemesManagement,
  useThemesManagement,
} from '@cityborn/client/admin';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { ThemeRow } from './theme-row';
export function ThemesEditor() {
  const editor: ThemesManagement = useThemesManagement();
  const { creationForm, state }: ThemesManagement = editor;
  const isBusy: boolean =
    creationForm.formState.isSubmitting ||
    editor.editForm.formState.isSubmitting ||
    editor.isMoving ||
    editor.isDeleting;
  const creationError: string | undefined =
    creationForm.formState.errors.name?.message ??
    state.creationError ??
    undefined;
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
        onSubmit={editor.createTheme}
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
      {editor.loadError ? (
        <div role="alert" className="text-red-400">
          <p>{editor.loadError}</p>
          <Button onClick={editor.reload}>Réessayer</Button>
        </div>
      ) : editor.isLoading ? (
        <Loader />
      ) : (
        <ul aria-label="Thèmes" className="flex flex-col gap-3 max-w-3xl">
          {editor.themes.map((theme, index) => (
            <ThemeRow
              key={theme.id}
              theme={theme}
              editor={editor}
              isBusy={isBusy}
              isFirst={index === 0}
              isLast={index === editor.themes.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

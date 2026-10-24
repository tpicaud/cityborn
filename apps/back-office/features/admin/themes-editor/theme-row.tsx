import type { AdminTheme } from '@cityborn/api';
import type { ThemesManagement } from '@cityborn/client/admin';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
export function ThemeRow({
  theme,
  editor,
  isBusy,
}: {
  theme: AdminTheme;
  editor: ThemesManagement;
  isBusy: boolean;
}) {
  const isEditing: boolean = editor.state.editedThemeId === theme.id;
  useEffect(() => {
    if (isEditing) editor.renameForm.setFocus('name');
  }, [isEditing, editor.renameForm]);
  const isConfirming: boolean = editor.state.deletionThemeId === theme.id;
  const error: string | undefined =
    (isEditing
      ? editor.renameForm.formState.errors.name?.message
      : undefined) ?? editor.state.rowErrors[theme.id];
  const errorId: string = `theme-error-${theme.id}`;
  return (
    <li className="rounded-lg border border-zinc-700 p-3 flex flex-col gap-2">
      {isEditing ? (
        <form
          onSubmit={editor.renameTheme}
          noValidate
          className="flex gap-2 items-center"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isBusy) {
              event.preventDefault();
              editor.cancel();
            }
          }}
        >
          <label htmlFor={`theme-name-${theme.id}`} className="sr-only">
            Nom du thème
          </label>
          <input
            id={`theme-name-${theme.id}`}
            {...editor.renameForm.register('name')}
            disabled={isBusy}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          <Button type="submit" disabled={isBusy} aria-label="Valider le nom">
            <Check size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={editor.cancel}
            aria-label="Annuler le renommage"
          >
            <X size={18} />
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium flex-1 break-all">{theme.name}</span>
          <span className="text-zinc-400 text-sm">
            {theme.packCount} pack{theme.packCount > 1 ? 's' : ''}
          </span>
          {theme.isDefault && (
            <span className="text-zinc-400 text-xs">Par défaut</span>
          )}
          {!isConfirming && (
            <>
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy}
                onClick={() => editor.startRenaming(theme)}
                aria-label={`Renommer ${theme.name}`}
              >
                <Pencil size={18} />
              </Button>
              {!theme.isDefault && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isBusy}
                  onClick={() => editor.confirmDeletion(theme.id)}
                  aria-label={`Supprimer ${theme.name}`}
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {isConfirming && (
        <div className="flex flex-wrap items-center gap-2">
          <span>Supprimer « {theme.name} » ?</span>
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => editor.deleteTheme(theme)}
          >
            Confirmer
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={editor.cancel}
          >
            Annuler
          </Button>
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-red-400">
          {error}
        </p>
      )}
    </li>
  );
}

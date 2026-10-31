import { type AdminTheme, ThemeIcon, ThemeMoveDirection } from '@cityborn/api';
import type { ThemesManagement } from '@cityborn/client/admin';
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ThemeIconGlyph } from './theme-icon-glyph';

const themeIconLabels: Record<ThemeIcon, string> = {
  [ThemeIcon.BASKETBALL]: 'Ballon de basket',
  [ThemeIcon.MUSIC]: 'Note de musique',
  [ThemeIcon.CINEMA]: 'Caméra',
  [ThemeIcon.EDUCATION]: 'Toque de diplômé',
};

export function ThemeRow({
  theme,
  editor,
  isBusy,
  isFirst,
  isLast,
}: {
  theme: AdminTheme;
  editor: ThemesManagement;
  isBusy: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isEditing: boolean = editor.state.editedThemeId === theme.id;
  useEffect(() => {
    if (isEditing) editor.editionForm.setFocus('name');
  }, [isEditing, editor.editionForm]);
  const isConfirming: boolean = editor.state.deletionThemeId === theme.id;
  const error: string | undefined =
    (isEditing
      ? (editor.editionForm.formState.errors.name?.message ??
        editor.editionForm.formState.errors.icon?.message)
      : undefined) ?? editor.state.rowErrors[theme.id];
  const errorId: string = `theme-error-${theme.id}`;
  return (
    <li className="rounded-lg border border-zinc-700 p-3 flex flex-col gap-2">
      {isEditing ? (
        <form
          onSubmit={editor.updateTheme}
          noValidate
          className="flex flex-wrap gap-2 items-center"
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
            {...editor.editionForm.register('name')}
            disabled={isBusy}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          <fieldset className="flex gap-1">
            <legend className="sr-only">Icône du thème</legend>
            {Object.values(ThemeIcon).map((icon: ThemeIcon) => (
              <label
                key={icon}
                className="cursor-pointer rounded-md border border-zinc-600 p-2 has-checked:border-sky-400 has-checked:text-sky-300 has-focus-visible:ring-2 has-focus-visible:ring-sky-400"
              >
                <input
                  type="radio"
                  value={icon}
                  {...editor.editionForm.register('icon')}
                  disabled={isBusy}
                  className="sr-only"
                />
                <ThemeIconGlyph icon={icon} />
                <span className="sr-only">{themeIconLabels[icon]}</span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" disabled={isBusy} aria-label="Valider le thème">
            <Check size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={editor.cancel}
            aria-label="Annuler la modification"
          >
            <X size={18} />
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <ThemeIconGlyph icon={theme.icon} />
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
                disabled={isBusy || isFirst}
                onClick={() =>
                  editor.moveTheme({
                    theme,
                    direction: ThemeMoveDirection.UP,
                  })
                }
                aria-label={`Monter ${theme.name}`}
              >
                <ChevronUp size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy || isLast}
                onClick={() =>
                  editor.moveTheme({
                    theme,
                    direction: ThemeMoveDirection.DOWN,
                  })
                }
                aria-label={`Descendre ${theme.name}`}
              >
                <ChevronDown size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy}
                onClick={() => editor.startEditing(theme)}
                aria-label={`Modifier ${theme.name}`}
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

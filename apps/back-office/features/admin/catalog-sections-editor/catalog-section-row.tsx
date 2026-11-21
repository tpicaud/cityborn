import {
  type CatalogSection,
  CatalogSectionMoveDirection,
} from '@cityborn/api';
import type { CatalogSectionsManagement } from '@cityborn/client/admin';
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export function CatalogSectionRow({
  section,
  editor,
  isBusy,
  isFirst,
  isLast,
}: {
  section: CatalogSection;
  editor: CatalogSectionsManagement;
  isBusy: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isEditing: boolean = editor.state.editedSectionId === section.id;
  useEffect(() => {
    if (isEditing) editor.editForm.setFocus('name');
  }, [isEditing, editor.editForm]);
  const isConfirming: boolean = editor.state.deletionSectionId === section.id;
  const error: string | undefined =
    (isEditing ? editor.editForm.formState.errors.name?.message : undefined) ??
    editor.state.rowErrors[section.id];
  const errorId: string = `catalog-section-error-${section.id}`;
  return (
    <li className="rounded-lg border border-zinc-700 p-3 flex flex-col gap-2">
      {isEditing ? (
        <form
          onSubmit={editor.renameCatalogSection}
          noValidate
          className="flex flex-wrap gap-2 items-center"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isBusy) {
              event.preventDefault();
              editor.cancel();
            }
          }}
        >
          <label
            htmlFor={`catalog-section-name-${section.id}`}
            className="sr-only"
          >
            Nom de la section
          </label>
          <input
            id={`catalog-section-name-${section.id}`}
            {...editor.editForm.register('name')}
            disabled={isBusy}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          <Button
            type="submit"
            disabled={isBusy}
            aria-label="Valider la section"
          >
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
          <span className="font-medium flex-1 break-all">{section.name}</span>
          {!isConfirming && (
            <>
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy || isFirst}
                onClick={() =>
                  editor.moveCatalogSection({
                    section,
                    direction: CatalogSectionMoveDirection.UP,
                  })
                }
                aria-label={`Monter ${section.name}`}
              >
                <ChevronUp size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy || isLast}
                onClick={() =>
                  editor.moveCatalogSection({
                    section,
                    direction: CatalogSectionMoveDirection.DOWN,
                  })
                }
                aria-label={`Descendre ${section.name}`}
              >
                <ChevronDown size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy}
                onClick={() => editor.startEditing(section)}
                aria-label={`Renommer ${section.name}`}
              >
                <Pencil size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy}
                onClick={() => editor.confirmDeletion(section.id)}
                aria-label={`Supprimer ${section.name}`}
              >
                <Trash2 size={18} />
              </Button>
            </>
          )}
        </div>
      )}
      {isConfirming && (
        <div className="flex flex-wrap items-center gap-2">
          <span>Supprimer « {section.name} » ?</span>
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => editor.deleteCatalogSection(section)}
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

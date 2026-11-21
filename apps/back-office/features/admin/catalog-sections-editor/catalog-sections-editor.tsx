'use client';
import {
  type CatalogSectionsManagement,
  useCatalogSectionsManagement,
} from '@cityborn/client/admin';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { CatalogSectionRow } from './catalog-section-row';

export function CatalogSectionsEditor() {
  const editor: CatalogSectionsManagement = useCatalogSectionsManagement();
  const { creationForm, state }: CatalogSectionsManagement = editor;
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
      aria-labelledby="catalog-sections-title"
    >
      <h2
        id="catalog-sections-title"
        className="text-xl font-bold border-b border-zinc-500 pb-2"
      >
        Sections
      </h2>
      <form
        onSubmit={editor.createCatalogSection}
        noValidate
        className="flex flex-col gap-2 max-w-xl"
      >
        <label htmlFor="new-catalog-section">Nouvelle section</label>
        <div className="flex gap-2">
          <input
            id="new-catalog-section"
            {...creationForm.register('name')}
            disabled={isBusy}
            aria-invalid={!!creationError}
            aria-describedby={
              creationError ? 'new-catalog-section-error' : undefined
            }
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          <Button type="submit" disabled={isBusy}>
            Ajouter
          </Button>
        </div>
        {creationError && (
          <p
            id="new-catalog-section-error"
            role="alert"
            className="text-red-400"
          >
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
        <ul aria-label="Sections" className="flex flex-col gap-3 max-w-3xl">
          {editor.sections.map((section, index) => (
            <CatalogSectionRow
              key={section.id}
              section={section}
              editor={editor}
              isBusy={isBusy}
              isFirst={index === 0}
              isLast={index === editor.sections.length - 1}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

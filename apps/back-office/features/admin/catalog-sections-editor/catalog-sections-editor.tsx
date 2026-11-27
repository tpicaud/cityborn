'use client';
import {
  allPacksFilterValue,
  type CatalogSectionsManagement,
  useCatalogSectionsManagement,
} from '@cityborn/client/admin';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { CatalogSectionRow } from './catalog-section-row';

export function CatalogSectionsEditor() {
  const editor: CatalogSectionsManagement = useCatalogSectionsManagement();
  const { creationForm }: CatalogSectionsManagement = editor;
  const isBusy: boolean =
    creationForm.formState.isSubmitting ||
    editor.editForm.formState.isSubmitting ||
    editor.isMoving ||
    editor.isDeleting;
  const creationError: string | undefined =
    creationForm.formState.errors.name?.message;
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
        <div className="flex flex-wrap gap-2">
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
          <label htmlFor="new-catalog-section-filter" className="sr-only">
            Filtre de la nouvelle section
          </label>
          <select
            id="new-catalog-section-filter"
            {...creationForm.register('themeId')}
            disabled={isBusy}
            className="rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          >
            <option value={allPacksFilterValue}>Tous</option>
            {editor.themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
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
        <div className="flex flex-col gap-6 max-w-3xl">
          {editor.sectionGroups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`catalog-section-group-${group.key}`}
              className="flex flex-col gap-3"
            >
              <h3
                id={`catalog-section-group-${group.key}`}
                className="text-lg font-semibold"
              >
                {group.title}
              </h3>
              {group.sections.length === 0 ? (
                <p className="text-zinc-400">Aucune section.</p>
              ) : (
                <ul
                  aria-label={`Sections de ${group.title}`}
                  className="flex flex-col gap-3"
                >
                  {group.sections.map((section, index) => (
                    <CatalogSectionRow
                      key={section.id}
                      section={section}
                      editor={editor}
                      isBusy={isBusy}
                      isFirst={index === 0}
                      isLast={index === group.sections.length - 1}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

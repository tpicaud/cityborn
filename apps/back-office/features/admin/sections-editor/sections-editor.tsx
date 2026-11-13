'use client';
import {
  type CatalogSectionGroup,
  type SectionNameForm,
  type SectionsManagement,
  useSectionNameForm,
  useSectionsManagement,
} from '@cityborn/client/admin';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { SectionRow } from './section-row';

function SectionGroup({
  group,
  editor,
}: {
  group: CatalogSectionGroup;
  editor: SectionsManagement;
}) {
  const { form, submit }: SectionNameForm = useSectionNameForm({
    saveName: (name) => editor.createSection({ themeId: group.themeId, name }),
  });
  const error: string | undefined = form.formState.errors.name?.message;
  const groupId: string = group.themeId ?? 'all';
  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby={`filter-${groupId}`}
    >
      <h3 id={`filter-${groupId}`} className="text-lg font-bold">
        {group.name}
      </h3>
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-2 max-w-xl"
      >
        <label htmlFor={`new-section-${groupId}`}>
          Nouvelle section dans « {group.name} »
        </label>
        <div className="flex gap-2">
          <input
            id={`new-section-${groupId}`}
            {...form.register('name')}
            disabled={editor.isBusy}
            aria-invalid={!!error}
            aria-describedby={
              error ? `new-section-error-${groupId}` : undefined
            }
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          <Button type="submit" disabled={editor.isBusy}>
            Ajouter
          </Button>
        </div>
        {error && (
          <p
            id={`new-section-error-${groupId}`}
            role="alert"
            className="text-red-400"
          >
            {error}
          </p>
        )}
      </form>
      <ol
        aria-label={`Sections dans ${group.name}`}
        className="flex flex-col gap-3"
      >
        {group.sections.map((section, index) => (
          <SectionRow
            key={section.id}
            section={section}
            editor={editor}
            isFirst={index === 0}
            isLast={index === group.sections.length - 1}
          />
        ))}
        <li className="rounded-lg border border-dashed border-zinc-600 p-3 text-zinc-400">
          Tous les packs — classement automatique par nom
        </li>
      </ol>
    </section>
  );
}
export function SectionsEditor() {
  const editor: SectionsManagement = useSectionsManagement();
  return (
    <section
      className="flex w-full flex-col gap-6 overflow-auto"
      aria-labelledby="sections-title"
    >
      <h2
        id="sections-title"
        className="text-xl font-bold border-b border-zinc-500 pb-2"
      >
        Sections
      </h2>
      <p className="text-zinc-400">
        Chaque filtre possède ses sections. Les packs non publiés restent
        classés et sont masqués aux joueurs.
      </p>
      {editor.loadError ? (
        <div role="alert">
          <p className="text-red-400">{editor.loadError}</p>
          <Button onClick={editor.reload}>Réessayer</Button>
        </div>
      ) : editor.isLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-8 max-w-4xl">
          {editor.groups.map((group) => (
            <SectionGroup
              key={group.themeId ?? 'all'}
              group={group}
              editor={editor}
            />
          ))}
        </div>
      )}
    </section>
  );
}

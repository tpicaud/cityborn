import {
  type CatalogSection,
  CatalogSectionMoveDirection,
  type Pack,
} from '@cityborn/api';
import {
  type SectionNameForm,
  type SectionsManagement,
  selectSectionPackCandidates,
  selectSectionPacks,
  useSectionNameForm,
} from '@cityborn/client/admin';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
export function SectionRow({
  section,
  editor,
  isFirst,
  isLast,
}: {
  section: CatalogSection;
  editor: SectionsManagement;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const { form, submit }: SectionNameForm = useSectionNameForm({
    initialName: section.name,
    saveName: (name) => editor.renameSection({ id: section.id, name }),
    onSaved: () => setIsEditing(false),
  });
  useEffect(() => {
    if (isEditing) form.setFocus('name');
  }, [isEditing, form]);
  const error: string | undefined = form.formState.errors.name?.message;
  const packs: Pack[] = selectSectionPacks({ section, packs: editor.packs });
  const candidates: Pack[] = selectSectionPackCandidates({
    section,
    packs: editor.packs,
    search,
  });
  return (
    <li className="rounded-lg border border-zinc-700 p-4 flex flex-col gap-3">
      {isEditing ? (
        <form
          onSubmit={submit}
          noValidate
          className="flex flex-wrap gap-2 items-center"
        >
          <label htmlFor={`section-name-${section.id}`} className="sr-only">
            Nom de la section
          </label>
          <input
            id={`section-name-${section.id}`}
            {...form.register('name')}
            disabled={editor.isBusy}
            aria-invalid={!!error}
            aria-describedby={
              error ? `section-name-error-${section.id}` : undefined
            }
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          <Button type="submit" disabled={editor.isBusy}>
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy}
            onClick={() => {
              form.reset({ name: section.name });
              setIsEditing(false);
            }}
          >
            Annuler
          </Button>
          {error && (
            <p
              id={`section-name-error-${section.id}`}
              role="alert"
              className="w-full text-red-400"
            >
              {error}
            </p>
          )}
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold flex-1 break-all">{section.name}</h4>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy || isFirst}
            onClick={() =>
              editor.moveSection({
                id: section.id,
                direction: CatalogSectionMoveDirection.UP,
              })
            }
            aria-label={`Monter ${section.name}`}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy || isLast}
            onClick={() =>
              editor.moveSection({
                id: section.id,
                direction: CatalogSectionMoveDirection.DOWN,
              })
            }
            aria-label={`Descendre ${section.name}`}
          >
            ↓
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy}
            onClick={() => setIsEditing(true)}
          >
            Renommer
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy}
            onClick={() => setIsConfirming(true)}
          >
            Supprimer
          </Button>
        </div>
      )}
      {isConfirming && (
        <fieldset
          aria-label={`Confirmer la suppression de ${section.name}`}
          className="flex flex-wrap items-center gap-2"
        >
          <p>Supprimer « {section.name} » ? Ses packs seront conservés.</p>
          <Button
            type="button"
            variant="destructive"
            disabled={editor.isBusy}
            onClick={() => editor.deleteSection(section.id)}
          >
            Confirmer la suppression
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy}
            onClick={() => setIsConfirming(false)}
          >
            Annuler
          </Button>
        </fieldset>
      )}
      <ol
        aria-label={`Packs dans ${section.name}`}
        className="flex flex-col gap-2"
      >
        {packs.map((pack, index) => (
          <li
            key={pack.id}
            className="flex flex-wrap gap-2 items-center rounded-md bg-zinc-800 p-2"
          >
            <span className="flex-1">
              {pack.name}{' '}
              <span
                className={
                  pack.isPublished ? 'text-green-400' : 'text-orange-400'
                }
              >
                — {pack.isPublished ? 'Publié' : 'Non publié'}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              disabled={editor.isBusy || index === 0}
              onClick={() =>
                editor.movePack({
                  id: section.id,
                  packId: pack.id,
                  direction: CatalogSectionMoveDirection.UP,
                })
              }
              aria-label={`Monter ${pack.name} dans ${section.name}`}
            >
              ↑
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={editor.isBusy || index === packs.length - 1}
              onClick={() =>
                editor.movePack({
                  id: section.id,
                  packId: pack.id,
                  direction: CatalogSectionMoveDirection.DOWN,
                })
              }
              aria-label={`Descendre ${pack.name} dans ${section.name}`}
            >
              ↓
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={editor.isBusy}
              onClick={() =>
                editor.removePack({ id: section.id, packId: pack.id })
              }
              aria-label={`Retirer ${pack.name} de ${section.name}`}
            >
              Retirer
            </Button>
          </li>
        ))}
      </ol>
      {packs.length === 0 && (
        <p className="text-zinc-400">Aucun pack dans cette section.</p>
      )}
      <label htmlFor={`section-search-${section.id}`}>
        Rechercher un pack à ajouter
      </label>
      <input
        id={`section-search-${section.id}`}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
      />
      <ul
        aria-label={`Packs admissibles pour ${section.name}`}
        className="flex flex-col gap-1 max-h-60 overflow-y-auto"
      >
        {candidates.map((pack) => (
          <li key={pack.id} className="flex items-center gap-2">
            <span className="flex-1">
              {pack.name}{' '}
              <span
                className={
                  pack.isPublished ? 'text-green-400' : 'text-orange-400'
                }
              >
                — {pack.isPublished ? 'Publié' : 'Non publié'}
              </span>
            </span>
            <Button
              type="button"
              disabled={editor.isBusy}
              onClick={() =>
                editor.addPack({ id: section.id, packId: pack.id })
              }
              aria-label={`Ajouter ${pack.name} dans ${section.name}`}
            >
              Ajouter
            </Button>
          </li>
        ))}
      </ul>
      {candidates.length === 0 && (
        <p className="text-zinc-400">Aucun pack admissible trouvé.</p>
      )}
    </li>
  );
}

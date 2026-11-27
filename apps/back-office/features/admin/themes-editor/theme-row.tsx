import type { AdminTheme } from '@cityborn/api';
import type { ThemesManagement } from '@cityborn/client/admin';
import {
  type OrderedListPosition,
  OrderedListRow,
} from '../ordered-list-editor';
import { IconifyIconPreview, ThemeIconGlyph } from './theme-icon-glyph';

export function ThemeRow({
  theme,
  editor,
  position,
}: {
  theme: AdminTheme;
  editor: ThemesManagement;
  position: OrderedListPosition;
}) {
  return (
    <OrderedListRow
      item={theme}
      editor={editor}
      position={position}
      idPrefix="theme"
      nameLabel="Nom du thème"
      submitLabel="Valider le thème"
      editLabel={`Modifier ${theme.name}`}
      deletionQuestion={`Supprimer « ${theme.name} » et ses sections ?`}
      isDeletable={!theme.isDefault}
      leading={<ThemeIconGlyph icon={theme.icon} />}
      details={
        <span className="text-zinc-400 text-sm">
          {theme.packCount} pack{theme.packCount > 1 ? 's' : ''}
        </span>
      }
      editFieldsError={editor.editForm.formState.errors.icon?.message}
      renderEditFields={(field) => (
        <>
          <label htmlFor={`theme-icon-${theme.id}`} className="sr-only">
            Icône Iconify du thème
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2">
            <IconifyIconPreview
              iconName={editor.editForm.watch('icon') ?? ''}
            />
            <input
              id={`theme-icon-${theme.id}`}
              {...editor.editForm.register('icon')}
              {...field}
              placeholder="fluent:sport-basketball-24-filled"
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </div>
          <a
            href="https://icon-sets.iconify.design/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-sky-300 underline"
          >
            Parcourir Iconify
          </a>
        </>
      )}
    />
  );
}

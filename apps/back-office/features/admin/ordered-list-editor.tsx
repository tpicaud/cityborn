import type {
  OrderedListEditor,
  OrderedListItem,
} from '@cityborn/client/admin';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Fragment, type ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { MoveControls } from '@/components/ui/MoveControls';

type EditableItem = OrderedListItem & { isDefault: boolean };

export type OrderedListPosition = { isFirst: boolean; isLast: boolean };

export type OrderedListFieldProps = {
  disabled: boolean;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
};

export function OrderedList<Item extends EditableItem>({
  label,
  items,
  renderItem,
}: {
  label: string;
  items: Item[];
  renderItem: ({
    item,
    position,
  }: {
    item: Item;
    position: OrderedListPosition;
  }) => ReactNode;
}) {
  return (
    <ul aria-label={label} className="flex flex-col gap-3">
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {renderItem({
            item,
            position: {
              isFirst: index === 0,
              isLast: index === items.length - 1,
            },
          })}
        </Fragment>
      ))}
    </ul>
  );
}

export function OrderedListRow<Item extends EditableItem>({
  item,
  editor,
  position,
  idPrefix,
  nameLabel,
  submitLabel,
  editLabel,
  deletionQuestion,
  isDeletable,
  leading,
  details,
  actions,
  editFieldsError,
  renderEditFields,
  children,
}: {
  item: Item;
  editor: OrderedListEditor<Item>;
  position: OrderedListPosition;
  idPrefix: string;
  nameLabel: string;
  submitLabel: string;
  editLabel: string;
  deletionQuestion: string;
  isDeletable: boolean;
  leading?: ReactNode;
  details?: ReactNode;
  actions?: ReactNode;
  editFieldsError?: string;
  renderEditFields?: (field: OrderedListFieldProps) => ReactNode;
  children?: ReactNode;
}) {
  const isEditing: boolean = editor.state.editedId === item.id;
  useEffect(() => {
    if (isEditing) editor.editForm.setFocus('name');
  }, [isEditing, editor.editForm]);
  const isConfirming: boolean = editor.state.deletionId === item.id;
  const error: string | undefined = isEditing
    ? (editor.editForm.formState.errors.name?.message ?? editFieldsError)
    : undefined;
  const errorId: string = `${idPrefix}-error-${item.id}`;
  const field: OrderedListFieldProps = {
    disabled: editor.isBusy,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined,
  };
  return (
    <li className="rounded-lg border border-zinc-700 p-3 flex flex-col gap-2">
      {isEditing ? (
        <form
          onSubmit={editor.update}
          noValidate
          className="flex flex-wrap gap-2 items-center"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !editor.isBusy) {
              event.preventDefault();
              editor.cancel();
            }
          }}
        >
          <label htmlFor={`${idPrefix}-name-${item.id}`} className="sr-only">
            {nameLabel}
          </label>
          <input
            id={`${idPrefix}-name-${item.id}`}
            {...editor.editForm.register('name')}
            {...field}
            className="min-w-0 flex-1 rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2"
          />
          {renderEditFields?.(field)}
          <Button
            type="submit"
            disabled={editor.isBusy}
            aria-label={submitLabel}
          >
            <Check size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy}
            onClick={editor.cancel}
            aria-label="Annuler la modification"
          >
            <X size={18} />
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {leading}
          <span className="font-medium flex-1 break-all">{item.name}</span>
          {details}
          {item.isDefault && (
            <span className="text-zinc-400 text-xs">Par défaut</span>
          )}
          {!isConfirming && (
            <>
              <MoveControls
                itemLabel={item.name}
                isFirst={position.isFirst}
                isLast={position.isLast}
                disabled={editor.isBusy}
                onMoveUp={() => editor.move({ item, direction: 'UP' })}
                onMoveDown={() => editor.move({ item, direction: 'DOWN' })}
              />
              {actions}
              <Button
                type="button"
                variant="ghost"
                disabled={editor.isBusy}
                onClick={() => editor.startEditing(item)}
                aria-label={editLabel}
              >
                <Pencil size={18} />
              </Button>
              {isDeletable && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={editor.isBusy}
                  onClick={() => editor.confirmDeletion(item.id)}
                  aria-label={`Supprimer ${item.name}`}
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
          <span>{deletionQuestion}</span>
          <Button
            type="button"
            variant="destructive"
            disabled={editor.isBusy}
            onClick={() => editor.delete(item)}
          >
            Confirmer
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={editor.isBusy}
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
      {children}
    </li>
  );
}

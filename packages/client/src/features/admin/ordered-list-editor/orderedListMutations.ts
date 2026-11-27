import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { ReportError } from '../../../shared/errorReporter';
import type { FormSubmitHandler } from '../../../shared/formSubmitHandler';
import type { OrderedListEditorAction } from './orderedListEditorState';

export type OrderedListItem = { id: string; name: string };

export type OrderedListMoveDirection = 'UP' | 'DOWN';

export type OrderedListOperations<
  Item extends OrderedListItem,
  Creation,
  Edit,
> = {
  create: (creation: Creation) => Promise<Item>;
  update: (update: { id: Item['id']; edit: Edit }) => Promise<Partial<Item>>;
  move: (move: {
    id: Item['id'];
    direction: OrderedListMoveDirection;
  }) => Promise<Item[]>;
  delete: (id: Item['id']) => Promise<void>;
  updateCache: (update: (items: Item[]) => Item[]) => Promise<void>;
  refreshAfterSave?: () => Promise<void>;
  describeDeletionFailure?: (failure: {
    error: unknown;
    item: Item;
  }) => Promise<unknown>;
};

export type OrderedListMutations<Item extends OrderedListItem> = {
  create: FormSubmitHandler;
  update: FormSubmitHandler;
  move: (move: {
    item: Item;
    direction: OrderedListMoveDirection;
  }) => Promise<void>;
  delete: (item: Item) => Promise<void>;
};

export function createOrderedListMutations<
  Item extends OrderedListItem,
  CreationInput extends FieldValues,
  Creation,
  EditInput extends FieldValues,
  Edit,
>({
  list,
  creationForm,
  editForm,
  nextCreationValues,
  editedId,
  dispatch,
  reportError,
  setIsMoving,
  setIsDeleting,
}: {
  list: OrderedListOperations<Item, Creation, Edit>;
  creationForm: Pick<
    UseFormReturn<CreationInput, undefined, Creation>,
    'handleSubmit' | 'reset'
  >;
  editForm: Pick<UseFormReturn<EditInput, undefined, Edit>, 'handleSubmit'>;
  nextCreationValues?: (creation: Creation) => CreationInput;
  editedId: Item['id'] | null;
  dispatch: (action: OrderedListEditorAction<Item['id']>) => void;
  reportError: ReportError;
  setIsMoving: (isMoving: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
}): OrderedListMutations<Item> {
  return {
    create: creationForm.handleSubmit(async (creation: Creation) => {
      try {
        const createdItem: Item = await list.create(creation);
        await list.updateCache((items) => [...items, createdItem]);
        creationForm.reset(nextCreationValues?.(creation));
        await list.refreshAfterSave?.();
      } catch (error: unknown) {
        reportError(error);
      }
    }),
    update: editForm.handleSubmit(async (edit: Edit) => {
      const id: Item['id'] | null = editedId;
      if (id === null) return;
      try {
        const savedItem: Partial<Item> = await list.update({ id, edit });
        await list.updateCache((items) =>
          items.map((item) =>
            item.id === id ? { ...item, ...savedItem } : item,
          ),
        );
        dispatch({ type: 'saved' });
        await list.refreshAfterSave?.();
      } catch (error: unknown) {
        reportError(error);
      }
    }),
    move: async ({ item, direction }) => {
      setIsMoving(true);
      try {
        const movedItems: Item[] = await list.move({ id: item.id, direction });
        await list.updateCache(() => movedItems);
      } catch (error: unknown) {
        reportError(error);
      } finally {
        setIsMoving(false);
      }
    },
    delete: async (item) => {
      setIsDeleting(true);
      try {
        await list.delete(item.id);
        await list.updateCache((items) =>
          items.filter((cachedItem) => cachedItem.id !== item.id),
        );
        dispatch({ type: 'saved' });
        await list.refreshAfterSave?.();
      } catch (error: unknown) {
        reportError(
          list.describeDeletionFailure
            ? await list.describeDeletionFailure({ error, item })
            : error,
        );
      } finally {
        setIsDeleting(false);
      }
    },
  };
}

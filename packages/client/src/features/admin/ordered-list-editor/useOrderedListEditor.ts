'use client';
import { useReducer, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../../shared/errorReporter';
import {
  initialOrderedListEditorState,
  type OrderedListEditorState,
  orderedListEditorReducer,
} from './orderedListEditorState';
import {
  createOrderedListMutations,
  type OrderedListItem,
  type OrderedListMutations,
  type OrderedListOperations,
} from './orderedListMutations';

export type OrderedListNameForm = Pick<
  UseFormReturn<{ name: string }>,
  'register' | 'setFocus' | 'formState'
>;

export type OrderedListEditor<
  Item extends OrderedListItem,
  CreationForm = unknown,
  EditForm = OrderedListNameForm,
> = OrderedListMutations<Item> & {
  state: OrderedListEditorState<Item['id']>;
  creationForm: CreationForm;
  editForm: EditForm;
  isMoving: boolean;
  isDeleting: boolean;
  isBusy: boolean;
  startEditing: (item: Item) => void;
  confirmDeletion: (id: Item['id']) => void;
  cancel: () => void;
};

export function useOrderedListEditor<
  Item extends OrderedListItem,
  CreationInput extends FieldValues,
  Creation,
  EditInput extends FieldValues,
  Edit,
>({
  list,
  creationForm,
  editForm,
  toEditValues,
  nextCreationValues,
}: {
  list: OrderedListOperations<Item, Creation, Edit>;
  creationForm: UseFormReturn<CreationInput, undefined, Creation>;
  editForm: UseFormReturn<EditInput, undefined, Edit>;
  toEditValues: (item: Item) => EditInput;
  nextCreationValues?: (creation: Creation) => CreationInput;
}): OrderedListEditor<
  Item,
  UseFormReturn<CreationInput, undefined, Creation>,
  UseFormReturn<EditInput, undefined, Edit>
> {
  const { reportError }: ErrorReporter = useErrorReporter();
  const [state, dispatch] = useReducer(
    orderedListEditorReducer<Item['id']>,
    initialOrderedListEditorState,
  );
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  return {
    state,
    creationForm,
    editForm,
    isMoving,
    isDeleting,
    isBusy:
      creationForm.formState.isSubmitting ||
      editForm.formState.isSubmitting ||
      isMoving ||
      isDeleting,
    startEditing: (item) => {
      editForm.reset(toEditValues(item));
      dispatch({ type: 'edit', id: item.id });
    },
    confirmDeletion: (id) => dispatch({ type: 'confirmDeletion', id }),
    cancel: () => dispatch({ type: 'cancel' }),
    ...createOrderedListMutations({
      list,
      creationForm,
      editForm,
      nextCreationValues,
      editedId: state.editedId,
      dispatch,
      reportError,
      setIsMoving,
      setIsDeleting,
    }),
  };
}

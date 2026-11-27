export type OrderedListEditorState<Id> = {
  editedId: Id | null;
  deletionId: Id | null;
};

export type OrderedListEditorAction<Id> =
  | { type: 'edit'; id: Id }
  | { type: 'confirmDeletion'; id: Id }
  | { type: 'cancel' }
  | { type: 'saved' };

export const initialOrderedListEditorState: OrderedListEditorState<never> = {
  editedId: null,
  deletionId: null,
};

export function orderedListEditorReducer<Id>(
  state: OrderedListEditorState<Id>,
  action: OrderedListEditorAction<Id>,
): OrderedListEditorState<Id> {
  switch (action.type) {
    case 'edit':
      return { ...state, editedId: action.id, deletionId: null };
    case 'confirmDeletion':
      return { ...state, editedId: null, deletionId: action.id };
    case 'cancel':
    case 'saved':
      return { ...state, editedId: null, deletionId: null };
  }
}

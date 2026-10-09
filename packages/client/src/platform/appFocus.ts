export interface AppFocus {
  subscribe(onFocusChange: (isFocused: boolean) => void): () => void;
}

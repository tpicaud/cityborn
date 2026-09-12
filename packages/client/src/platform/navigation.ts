export interface Navigation {
  push(path: string): void;
  replace(path: string): void;
  back(): void;
}

export interface Navigation {
  push(path: string): void;
  returnTo(path: string): void;
  back(): void;
}

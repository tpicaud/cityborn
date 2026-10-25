export type NavigationPath =
  | '/'
  | `/session/solo/${string}`
  | `/session/multi/${string}`;

export interface Navigation {
  push(path: NavigationPath): void;
  returnTo(path: NavigationPath): void;
  back(): void;
}

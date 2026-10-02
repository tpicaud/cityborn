export type NavigationPath = '/' | '/session/solo' | `/session/multi/${string}`;

export interface Navigation {
  push(path: NavigationPath): void;
  returnTo(path: NavigationPath): void;
  back(): void;
}

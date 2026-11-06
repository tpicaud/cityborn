export type NavigationPath =
  | '/'
  | '/profile'
  | '/auth/sign-up'
  | `/session/solo/${string}`
  | `/session/multi/${string}`;

export interface Navigation {
  push(path: NavigationPath): void;
  returnTo(path: NavigationPath): void;
  back(): void;
}

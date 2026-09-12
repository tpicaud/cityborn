export interface SessionNavigation {
  goHome(): void;
}

export interface PlayNavigation {
  goToSoloSession(): void;
  goToMultiSession(sessionID: string): void;
}

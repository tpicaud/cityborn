export interface SocketConnection {
  readonly connected: boolean;
  connect(): void;
  disconnect(): void;
  emit(event: string, ...args: unknown[]): void;
  on<Args extends unknown[]>(
    event: string,
    listener: (...args: Args) => void,
  ): void;
  off<Args extends unknown[]>(
    event: string,
    listener?: (...args: Args) => void,
  ): void;
}

/**
 * Asynchrone car le mobile doit lire le token stocké avant d'ouvrir la socket,
 * là où le web s'authentifie par cookie et peut résoudre immédiatement.
 */
export type SocketFactory = () => Promise<SocketConnection>;

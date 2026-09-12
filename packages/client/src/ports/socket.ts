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

export type SocketConnectionFactory = () => Promise<SocketConnection>;

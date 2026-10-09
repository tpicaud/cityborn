import type { SessionConfig } from '../config/config.module';

export type ConnectionRegistryTiming = {
  disconnectGracePeriodMs: number;
  leaseMs: number;
  heartbeatIntervalMs: number;
  presenceCheckIntervalMs: number;
  presenceCheckClaimMs: number;
};

export const CONNECTION_REGISTRY_TIMING: symbol = Symbol(
  'CONNECTION_REGISTRY_TIMING',
);

export function createConnectionRegistryTiming(
  sessionConfig: SessionConfig,
): ConnectionRegistryTiming {
  const connectionRegistryTiming: ConnectionRegistryTiming = {
    disconnectGracePeriodMs: sessionConfig.playerDisconnectGracePeriodMs,
    leaseMs: 30_000,
    heartbeatIntervalMs: 10_000,
    presenceCheckIntervalMs: 1_000,
    presenceCheckClaimMs: 10_000,
  };
  return connectionRegistryTiming;
}

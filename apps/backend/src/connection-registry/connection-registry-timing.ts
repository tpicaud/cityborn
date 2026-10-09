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

export const connectionRegistryTiming: ConnectionRegistryTiming = {
  disconnectGracePeriodMs: 30_000,
  leaseMs: 30_000,
  heartbeatIntervalMs: 10_000,
  presenceCheckIntervalMs: 1_000,
  presenceCheckClaimMs: 10_000,
};

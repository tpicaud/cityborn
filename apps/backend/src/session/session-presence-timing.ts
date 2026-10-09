export type SessionPresenceTiming = {
  disconnectGracePeriodMs: number;
  reconciliationIntervalMs: number;
};

export const SESSION_PRESENCE_TIMING: symbol = Symbol(
  'SESSION_PRESENCE_TIMING',
);

export const sessionPresenceTiming: SessionPresenceTiming = {
  disconnectGracePeriodMs: 30_000,
  reconciliationIntervalMs: 5_000,
};

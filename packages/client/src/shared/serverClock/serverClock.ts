export type ServerClock = {
  synchronize: (sample: {
    serverTime: number | undefined;
    requestStartedAt?: number;
  }) => void;
  localDeadline: (serverDeadline: number | undefined) => number | undefined;
};

export function createServerClock(): ServerClock {
  let offset: number | undefined;
  let bestRoundTrip: number = Number.POSITIVE_INFINITY;

  return {
    synchronize({ serverTime, requestStartedAt }) {
      if (serverTime === undefined) return;
      const receivedAt: number = performance.now();
      const roundTrip: number =
        requestStartedAt === undefined
          ? Number.POSITIVE_INFINITY
          : receivedAt - requestStartedAt;
      if (offset !== undefined && roundTrip >= bestRoundTrip) return;
      const estimatedTransit: number = Number.isFinite(roundTrip)
        ? roundTrip / 2
        : 0;
      offset = serverTime - (receivedAt - estimatedTransit);
      bestRoundTrip = roundTrip;
    },
    localDeadline(serverDeadline) {
      return serverDeadline === undefined || offset === undefined
        ? undefined
        : serverDeadline - offset;
    },
  };
}

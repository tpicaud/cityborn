import { nanoid } from 'nanoid';
import { ClsServiceManager } from 'nestjs-cls';
import type { Params } from 'nestjs-pino';
import type {
  LoggerOptions,
  TransportMultiOptions,
  TransportTargetOptions,
} from 'pino';
import type { WideEventClsStore } from '../wide-event/wide-event.service';

const isProduction = process.env.NODE_ENV === 'production';

// Les wide events portent des données personnelles (ip, userAgent, userId) :
// l'ingestion doit rester sur la région EU d'Axiom.
const AXIOM_EU_API_URL = 'https://api.eu.axiom.co';

export interface LoggerTransportEnvironment {
  isProduction: boolean;
  axiomToken: string | undefined;
  axiomDataset: string | undefined;
}

function currentRequestId(): string | undefined {
  return ClsServiceManager.getClsService<WideEventClsStore>().get('wideEvent')
    ?.requestId;
}

function stdoutTarget(isProductionRuntime: boolean): TransportTargetOptions {
  if (isProductionRuntime) {
    return { target: 'pino/file', options: { destination: 1 } };
  }
  return { target: 'pino-pretty', options: { singleLine: true } };
}

function axiomTarget(
  environment: LoggerTransportEnvironment,
): TransportTargetOptions | undefined {
  const { axiomToken, axiomDataset } = environment;
  if (!axiomToken || !axiomDataset) {
    return undefined;
  }
  return {
    target: '@axiomhq/pino',
    options: {
      token: axiomToken,
      dataset: axiomDataset,
      url: AXIOM_EU_API_URL,
    },
  };
}

export function buildLoggerTransport(
  environment: LoggerTransportEnvironment,
): TransportMultiOptions | undefined {
  const axiom = axiomTarget(environment);
  // Sans cible Axiom, la production garde l'écriture directe sur stdout plutôt
  // que de payer un worker thread pour le seul relais du flux.
  if (!axiom && environment.isProduction) {
    return undefined;
  }
  return {
    targets: [
      stdoutTarget(environment.isProduction),
      ...(axiom ? [axiom] : []),
    ],
  };
}

export const loggerBaseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  mixin: () => {
    const requestId = currentRequestId();
    return requestId ? { requestId } : {};
  },
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    '*.password',
    '*.token',
    '*.refreshToken',
  ],
  transport: buildLoggerTransport({
    isProduction,
    axiomToken: process.env.AXIOM_TOKEN,
    axiomDataset: process.env.AXIOM_DATASET,
  }),
};

export const loggerModuleParams: Params = {
  pinoHttp: {
    ...loggerBaseOptions,
    autoLogging: false,
    genReqId: () => currentRequestId() ?? nanoid(),
    customProps: (request) => ({ requestId: request.id }),
  },
};

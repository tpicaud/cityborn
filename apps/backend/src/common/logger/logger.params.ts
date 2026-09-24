import { nanoid } from 'nanoid';
import { ClsServiceManager } from 'nestjs-cls';
import type { Params } from 'nestjs-pino';
import type {
  LoggerOptions,
  TransportMultiOptions,
  TransportTargetOptions,
} from 'pino';
import { backendConfig } from '../../config/backend.config';
import type { WideEventClsStore } from '../wide-event/wide-event.service';

const AXIOM_EU_EDGE_DOMAIN = 'eu-central-1.aws.edge.axiom.co';

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
      edge: AXIOM_EU_EDGE_DOMAIN,
    },
  };
}

export function buildLoggerTransport(
  environment: LoggerTransportEnvironment,
): TransportMultiOptions | undefined {
  const axiom = axiomTarget(environment);
  const writesDirectlyToStdout = !axiom && environment.isProduction;
  if (writesDirectlyToStdout) {
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
  level: backendConfig.logger.level,
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
    isProduction: backendConfig.runtime.nodeEnvironment === 'production',
    axiomToken: backendConfig.logger.axiomToken,
    axiomDataset: backendConfig.logger.axiomDataset,
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

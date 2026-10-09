import 'dotenv/config';
import { z } from 'zod';

const optionalNonEmptyStringSchema = z.preprocess(
  (value: unknown) => (value === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const localOriginEnvironment: NodeJS.ProcessEnv = {
  CORS_ORIGIN: 'http://localhost:3000',
  BACK_OFFICE_ORIGIN: 'http://localhost:3001',
};

const corsOriginsSchema = z
  .string()
  .transform((value: string) =>
    value.split(',').map((origin: string) => origin.trim()),
  )
  .pipe(z.array(z.string().url()).min(1));

const backendEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    CORS_ORIGIN: corsOriginsSchema,
    BACK_OFFICE_ORIGIN: z.string().url(),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    JWT_ACCESS_SECRET: z.string().trim().min(1),
    JWT_REFRESH_SECRET: z.string().trim().min(1),
    GOOGLE_CLIENT_ID: z.string().trim().min(1),
    APP_ID: z.string().trim().min(1),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    SESSION_PLAYER_DISCONNECT_GRACE_PERIOD_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(30_000),
    BREVO_API_KEY: z.string().trim().min(1),
    BREVO_SENDER_EMAIL: z.string().email(),
    BREVO_SENDER_NAME: z.string().trim().min(1).default('Cityborn'),
    LOG_LEVEL: z.string().trim().min(1).default('info'),
    AXIOM_TOKEN: optionalNonEmptyStringSchema,
    AXIOM_DATASET: optionalNonEmptyStringSchema,
  })
  .superRefine((environment, context) => {
    const hasAxiomToken: boolean = environment.AXIOM_TOKEN !== undefined;
    const hasAxiomDataset: boolean = environment.AXIOM_DATASET !== undefined;
    if (hasAxiomToken !== hasAxiomDataset) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AXIOM_TOKEN and AXIOM_DATASET must be configured together',
        path: ['AXIOM_TOKEN'],
      });
    }
  });

type RawBackendEnvironment = z.infer<typeof backendEnvironmentSchema>;

export type BackendConfig = {
  runtime: {
    nodeEnvironment: 'development' | 'production' | 'test';
    port: number;
  };
  http: {
    corsOrigins: string[];
    backOfficeOrigin: string;
    frontendUrl: string;
  };
  auth: {
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    googleClientId: string;
    appleAppId: string;
  };
  persistence: {
    databaseUrl: string;
  };
  redis: {
    url: string;
  };
  session: {
    playerDisconnectGracePeriodMs: number;
  };
  mail: {
    apiKey: string;
    senderEmail: string;
    senderName: string;
  };
  logger: {
    level: string;
    axiomToken: string | undefined;
    axiomDataset: string | undefined;
  };
};

export function parseBackendConfig(
  environment: NodeJS.ProcessEnv,
): BackendConfig {
  const parsedEnvironment: RawBackendEnvironment =
    backendEnvironmentSchema.parse(
      environment.NODE_ENV === 'production'
        ? environment
        : { ...localOriginEnvironment, ...environment },
    );
  const config: BackendConfig = {
    runtime: {
      nodeEnvironment: parsedEnvironment.NODE_ENV,
      port: parsedEnvironment.PORT,
    },
    http: {
      corsOrigins: [
        ...new Set([
          ...parsedEnvironment.CORS_ORIGIN,
          parsedEnvironment.BACK_OFFICE_ORIGIN,
        ]),
      ],
      backOfficeOrigin: parsedEnvironment.BACK_OFFICE_ORIGIN,
      frontendUrl: parsedEnvironment.FRONTEND_URL,
    },
    auth: {
      jwtAccessSecret: parsedEnvironment.JWT_ACCESS_SECRET,
      jwtRefreshSecret: parsedEnvironment.JWT_REFRESH_SECRET,
      googleClientId: parsedEnvironment.GOOGLE_CLIENT_ID,
      appleAppId: parsedEnvironment.APP_ID,
    },
    persistence: {
      databaseUrl: parsedEnvironment.DATABASE_URL,
    },
    redis: {
      url: parsedEnvironment.REDIS_URL,
    },
    session: {
      playerDisconnectGracePeriodMs:
        parsedEnvironment.SESSION_PLAYER_DISCONNECT_GRACE_PERIOD_MS,
    },
    mail: {
      apiKey: parsedEnvironment.BREVO_API_KEY,
      senderEmail: parsedEnvironment.BREVO_SENDER_EMAIL,
      senderName: parsedEnvironment.BREVO_SENDER_NAME,
    },
    logger: {
      level: parsedEnvironment.LOG_LEVEL,
      axiomToken: parsedEnvironment.AXIOM_TOKEN,
      axiomDataset: parsedEnvironment.AXIOM_DATASET,
    },
  };
  return config;
}

export const backendConfig: BackendConfig = parseBackendConfig(process.env);

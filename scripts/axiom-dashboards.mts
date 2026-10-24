import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  Ajv2020,
  type ErrorObject,
  type ValidateFunction,
} from 'ajv/dist/2020.js';
import ajvFormats from 'ajv-formats';

const environments = ['dev', 'staging', 'production'] as const;

type JsonObject = { [key: string]: unknown };

type Environment = (typeof environments)[number];

type Dashboard = {
  file: string;
  uid: string;
  document: JsonObject;
};

type RenderedDashboards = {
  dashboards: Dashboard[];
  errors: string[];
};

const environmentPlaceholder: string = '{{environment}}';
const dashboardsRoot: string = join(process.cwd(), 'infra/axiom/dashboards');
const dashboardsApiUrl: string = 'https://api.axiom.co/v2/dashboards';
const dashboardSchemaUrl: string =
  'https://axiom.co/docs/schemas/dashboard.json';

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEnvironment = (value: string | undefined): value is Environment =>
  environments.some(
    (environment: Environment): boolean => environment === value,
  );

const stringField = ({
  value,
  key,
}: {
  value: unknown;
  key: string;
}): string | undefined => {
  if (!isJsonObject(value)) return undefined;
  const field: unknown = value[key];
  return typeof field === 'string' ? field : undefined;
};

const objectList = ({
  document,
  key,
}: {
  document: JsonObject;
  key: string;
}): unknown[] => {
  const field: unknown = document[key];
  return Array.isArray(field) ? field : [];
};

const datasetErrors = ({
  apl,
  environment,
}: {
  apl: string;
  environment: Environment;
}): string[] => {
  const datasets: string[] = Array.from(
    apl.matchAll(/\['(cityborn-backend-[^']*)'\]/gu),
    (match: RegExpMatchArray): string => match[1] ?? '',
  );
  if (datasets.length === 0) {
    return [`requête sans dataset cityborn-backend-${environmentPlaceholder}`];
  }
  return datasets
    .filter(
      (dataset: string): boolean =>
        dataset !== `cityborn-backend-${environment}`,
    )
    .map(
      (dataset: string): string =>
        `dataset ${dataset} écrit en dur au lieu de cityborn-backend-${environmentPlaceholder}`,
    );
};

const documentErrors = ({
  document,
  environment,
}: {
  document: JsonObject;
  environment: Environment;
}): string[] => {
  const charts: unknown[] = objectList({ document, key: 'charts' });
  const chartIds: string[] = charts.flatMap((chart: unknown): string[] => {
    const id: string | undefined = stringField({ value: chart, key: 'id' });
    return id ? [id] : [];
  });
  const layoutIds: string[] = objectList({ document, key: 'layout' }).flatMap(
    (item: unknown): string[] => {
      const id: string | undefined = stringField({ value: item, key: 'i' });
      return id ? [id] : [];
    },
  );
  const queryErrors: string[] = charts.flatMap((chart: unknown): string[] => {
    const query: unknown = isJsonObject(chart) ? chart.query : undefined;
    const apl: string | undefined = stringField({ value: query, key: 'apl' });
    if (!apl) return [];
    const chartId: string =
      stringField({ value: chart, key: 'id' }) ?? 'sans id';
    return datasetErrors({ apl, environment }).map(
      (error: string): string => `graphique ${chartId} : ${error}`,
    );
  });
  return [
    ...(charts.length === chartIds.length ? [] : ['graphique sans id']),
    ...chartIds
      .filter((id: string): boolean => !layoutIds.includes(id))
      .map((id: string): string => `graphique ${id} absent du layout`),
    ...layoutIds
      .filter((id: string): boolean => !chartIds.includes(id))
      .map((id: string): string => `layout ${id} sans graphique`),
    ...queryErrors,
  ];
};

const parseJson = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
};

const renderDashboards = (environment: Environment): RenderedDashboards => {
  const files: string[] = readdirSync(dashboardsRoot)
    .filter((file: string): boolean => file.endsWith('.json'))
    .sort();
  return files.reduce(
    (rendered: RenderedDashboards, file: string): RenderedDashboards => {
      const template: string = readFileSync(join(dashboardsRoot, file), 'utf8');
      const content: string = template.replaceAll(
        environmentPlaceholder,
        environment,
      );
      const document: unknown = parseJson(content);
      const errors: string[] = isJsonObject(document)
        ? [
            ...(content.includes('{{') ? ['placeholder inconnu'] : []),
            ...documentErrors({ document, environment }),
          ]
        : ['objet JSON invalide'];
      if (!isJsonObject(document) || errors.length > 0) {
        return {
          dashboards: rendered.dashboards,
          errors: [
            ...rendered.errors,
            ...errors.map(
              (error: string): string => `${file} (${environment}) : ${error}`,
            ),
          ],
        };
      }
      return {
        dashboards: [
          ...rendered.dashboards,
          {
            file,
            uid: `cityborn-${environment}-${basename(file, '.json')}`,
            document,
          },
        ],
        errors: rendered.errors,
      };
    },
    { dashboards: [], errors: [] },
  );
};

const loadDashboardValidator = async (): Promise<ValidateFunction> => {
  const response: Response = await fetch(dashboardSchemaUrl);
  if (!response.ok) {
    throw new Error(`GET ${dashboardSchemaUrl} : ${response.status}`);
  }
  const schema: unknown = await response.json();
  if (!isJsonObject(schema)) {
    throw new Error(`${dashboardSchemaUrl} : schéma invalide`);
  }
  const ajv: Ajv2020 = new Ajv2020();
  ajvFormats.default(ajv);
  return ajv.compile(schema);
};

const renderingErrors = ({
  rendered,
  validate,
}: {
  rendered: RenderedDashboards;
  validate: ValidateFunction;
}): string[] => [
  ...rendered.errors,
  ...rendered.dashboards.flatMap((dashboard: Dashboard): string[] =>
    validate(dashboard.document)
      ? []
      : (validate.errors ?? []).map((error: ErrorObject): string => {
          const property: unknown = error.params.additionalProperty;
          const detail: string =
            typeof property === 'string' ? ` : ${property}` : '';
          return `${dashboard.uid} : ${error.instancePath || '/'} ${error.message ?? 'invalide'}${detail}`;
        }),
  ),
];

const axiomRequest = async ({
  token,
  method,
  url,
  body,
}: {
  token: string;
  method: 'GET' | 'POST' | 'DELETE';
  url: string;
  body?: JsonObject;
}): Promise<unknown> => {
  const response: Response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text: string = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${url} : ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : undefined;
};

const deployDashboards = async (environment: Environment): Promise<void> => {
  const token: string | undefined = process.env.AXIOM_DASHBOARDS_TOKEN;
  if (!token) throw new Error('AXIOM_DASHBOARDS_TOKEN manquant');

  const validate: ValidateFunction = await loadDashboardValidator();
  const rendered: RenderedDashboards = renderDashboards(environment);
  const errors: string[] = renderingErrors({ rendered, validate });
  if (errors.length > 0) throw new Error(errors.join('\n'));
  const { dashboards }: RenderedDashboards = rendered;

  await Promise.all(
    dashboards.map(async (dashboard: Dashboard): Promise<void> => {
      const response: unknown = await axiomRequest({
        token,
        method: 'POST',
        url: dashboardsApiUrl,
        body: {
          uid: dashboard.uid,
          dashboard: dashboard.document,
          overwrite: true,
          message: `${dashboard.file} @ ${process.env.GITHUB_SHA ?? 'local'}`,
        },
      });
      const status: string =
        stringField({ value: response, key: 'status' }) ?? 'déployé';
      process.stdout.write(`${dashboard.uid} : ${status}\n`);
    }),
  );

  const deployed: unknown = await axiomRequest({
    token,
    method: 'GET',
    url: `${dashboardsApiUrl}?limit=1000&exclude=labels`,
  });
  const desiredUids: string[] = dashboards.map(
    (dashboard: Dashboard): string => dashboard.uid,
  );
  const obsoleteUids: string[] = (Array.isArray(deployed) ? deployed : [])
    .flatMap((resource: unknown): string[] => {
      const uid: string | undefined = stringField({
        value: resource,
        key: 'uid',
      });
      return uid ? [uid] : [];
    })
    .filter(
      (uid: string): boolean =>
        uid.startsWith(`cityborn-${environment}-`) &&
        !desiredUids.includes(uid),
    );
  await Promise.all(
    obsoleteUids.map(async (uid: string): Promise<void> => {
      await axiomRequest({
        token,
        method: 'DELETE',
        url: `${dashboardsApiUrl}/uid/${uid}`,
      });
      process.stdout.write(`${uid} : supprimé\n`);
    }),
  );
};

const checkDashboards = async (): Promise<void> => {
  const validate: ValidateFunction = await loadDashboardValidator();
  const rendered: RenderedDashboards[] = environments.map(renderDashboards);
  const errors: string[] = rendered.flatMap(
    (result: RenderedDashboards): string[] =>
      renderingErrors({ rendered: result, validate }),
  );
  if (errors.length > 0) throw new Error(errors.join('\n'));
  const dashboardCount: number = rendered[0]?.dashboards.length ?? 0;
  process.stdout.write(
    `${dashboardCount} dashboards validés pour ${environments.join(', ')}.\n`,
  );
};

const run = async ([command, environment]: string[]): Promise<void> => {
  if (command === 'check') return checkDashboards();
  if (command === 'deploy' && isEnvironment(environment)) {
    return deployDashboards(environment);
  }
  throw new Error(
    `usage : axiom-dashboards.mts check | deploy <${environments.join('|')}>`,
  );
};

try {
  await run(process.argv.slice(2));
} catch (error: unknown) {
  process.stderr.write(
    `ERREUR: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}

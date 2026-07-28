import { generateOpenApi } from '@ts-rest/open-api';
import type { OpenAPIObject } from 'openapi3-ts';
import packageJson from '../package.json';
import { contract } from '../src/contract/contract';

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export function getOpenApiDocument(baseUrl?: string): OpenAPIObject {
  return generateOpenApi(
    contract,
    {
      info: { title: 'Cityborn API', version: packageJson.version },
      servers: [{ url: baseUrl ?? 'http://localhost:3001' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    {
      operationMapper: (operation) => ({
        ...operation,
        tags: operation.tags?.length
          ? [operation.tags.map(capitalize).join(' - ')]
          : operation.tags,
      }),
    },
  );
}

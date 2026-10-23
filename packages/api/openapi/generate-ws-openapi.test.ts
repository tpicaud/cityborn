import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { OpenAPIObject } from 'openapi3-ts';
import { z } from 'zod';
import { wsChannels, wsSharedServerEvents } from '../src/contract/ws/registry';
import { getWsOpenApiDocument } from './generate-ws-openapi';

const JsonResponseSchema = z.object({
  responses: z.object({
    '200': z.object({
      content: z.object({
        'application/json': z.object({ schema: z.unknown() }),
      }),
    }),
  }),
});

const JsonRequestAndResponseSchema = JsonResponseSchema.extend({
  requestBody: z.object({
    content: z.object({
      'application/json': z.object({ schema: z.unknown() }),
    }),
  }),
});
const AckDocumentSchema = z.object({
  oneOf: z.array(
    z.object({
      properties: z.record(z.unknown()),
      required: z.array(z.string()),
    }),
  ),
});
type JsonRequestAndResponse = z.infer<typeof JsonRequestAndResponseSchema>;
type AckDocument = z.infer<typeof AckDocumentSchema>;

describe('getWsOpenApiDocument', () => {
  it('includes every registered event with its direction and shared path', () => {
    const document: OpenAPIObject = getWsOpenApiDocument();
    const expectedPaths: string[] = Object.values(wsChannels).flatMap(
      (channel) => [
        ...Object.keys(channel.clientToServer).map(
          (event) => `/ws/${channel.domain}/${event}`,
        ),
        ...Object.keys(channel.serverToClient).map(
          (event) => `/ws/${channel.domain}/${event}`,
        ),
      ],
    );
    expectedPaths.push(
      ...Object.keys(wsSharedServerEvents).map((event) => `/ws/${event}`),
    );

    assert.deepEqual(Object.keys(document.paths).sort(), expectedPaths.sort());
    assert.ok(document.paths['/ws/session/join'].post);
    assert.ok(document.paths['/ws/session/update'].get);
    assert.ok(document.paths['/ws/error'].get);
  });

  it('documents the request payload and the full success and failure acknowledgement', () => {
    const document: OpenAPIObject = getWsOpenApiDocument({
      channels: [
        {
          domain: 'session',
          clientToServer: {
            join: {
              payload: z.object({ name: z.string() }),
              ack: z.object({ token: z.string() }),
            },
          },
          serverToClient: {},
        },
      ],
      sharedServerEvents: {},
    });
    const operation: JsonRequestAndResponse =
      JsonRequestAndResponseSchema.parse(
        document.paths['/ws/session/join'].post,
      );
    const ack: AckDocument = AckDocumentSchema.parse(
      operation.responses['200'].content['application/json'].schema,
    );

    assert.deepEqual(operation.requestBody.content['application/json'].schema, {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    });
    assert.deepEqual(ack.oneOf[0].required, ['token', 'success']);
    assert.deepEqual(ack.oneOf[0].properties.success, {
      type: 'boolean',
      enum: [true],
    });
    assert.deepEqual(ack.oneOf[1].required, ['success']);
    assert.deepEqual(ack.oneOf[1].properties.success, {
      type: 'boolean',
      enum: [false],
    });
    assert.ok(ack.oneOf[1].properties.error);
  });

  it('keeps empty events, opposite directions and deprecation metadata', () => {
    const document: OpenAPIObject = getWsOpenApiDocument({
      channels: [
        {
          domain: 'session',
          clientToServer: { ping: { deprecated: true } },
          serverToClient: { ping: { deprecated: true } },
        },
      ],
      sharedServerEvents: { error: { deprecated: true } },
    });
    const ack: AckDocument = AckDocumentSchema.parse(
      JsonResponseSchema.parse(document.paths['/ws/session/ping'].post)
        .responses['200'].content['application/json'].schema,
    );

    assert.equal(document.paths['/ws/session/ping'].post?.deprecated, true);
    assert.equal(document.paths['/ws/session/ping'].get?.deprecated, true);
    assert.equal(document.paths['/ws/error'].get?.deprecated, true);
    assert.deepEqual(
      ack.oneOf.map((branch) => branch.required),
      [['success'], ['success']],
    );
    assert.deepEqual(
      JsonResponseSchema.parse(document.paths['/ws/session/ping'].get)
        .responses['200'].content['application/json'].schema,
      { type: 'object', properties: {} },
    );
  });
});

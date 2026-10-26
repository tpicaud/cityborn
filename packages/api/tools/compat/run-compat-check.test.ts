import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, type TestContext } from 'node:test';
import { initContract } from '@ts-rest/core';
import { generateOpenApi } from '@ts-rest/open-api';
import type { OpenAPIObject } from 'openapi3-ts';
import { type AnyZodObject, z } from 'zod';
import { getWsOpenApiDocument } from '../../openapi/ws/generate-ws-openapi';
import type { WsChannel, WsServerEvent } from '../../src/ws/channel';
import { formatHumanSummary, toJsonReport } from './report';
import { type RunCompatCheckOptions, runCompatCheck } from './run-compat-check';
import type { CompatReport } from './types';

const baselineChannel: WsChannel = {
  domain: 'session',
  clientToServer: {
    join: {
      payload: z.object({ name: z.string() }),
      ack: z.object({ token: z.string() }),
    },
    reconnect: {},
  },
  serverToClient: { update: { payload: z.object({ state: z.string() }) } },
};
const sharedEvents: Readonly<Record<string, WsServerEvent>> = {
  error: { payload: z.object({ message: z.string() }) },
};
const httpDocument: OpenAPIObject = {
  openapi: '3.0.2',
  info: { title: 'HTTP', version: 'v2' },
  paths: { '/health': { get: { responses: { 200: { description: 'OK' } } } } },
};

function getHttpDocument(body: AnyZodObject): OpenAPIObject {
  const contractBuilder: ReturnType<typeof initContract> = initContract();
  return generateOpenApi(
    contractBuilder.router({
      guess: {
        method: 'POST',
        path: '/session/guess',
        body,
        responses: { 200: z.object({ accepted: z.boolean() }) },
      },
    }),
    { info: { title: 'HTTP', version: 'v2' } },
  );
}

function getWsDocument(payload: AnyZodObject): OpenAPIObject {
  const channel: WsChannel = {
    ...baselineChannel,
    clientToServer: {
      ...baselineChannel.clientToServer,
      guess: { payload },
    },
  };
  return getWsOpenApiDocument({
    channels: [channel],
    sharedServerEvents: sharedEvents,
  });
}

function getCodeResponseDocument(enumValues: string[]): OpenAPIObject {
  return {
    openapi: '3.0.2',
    info: { title: 'HTTP', version: 'v2' },
    paths: {
      '/business': {
        get: {
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', enum: enumValues },
                    },
                    required: ['code'],
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

function historicalGuessPayload(): AnyZodObject {
  return z.object({
    guess: z.object({
      coordinates: z.object({ lat: z.number(), lng: z.number() }),
      distance: z.number(),
      points: z.number(),
      win: z.boolean(),
    }),
  });
}

function narrowedGuessPayload(): AnyZodObject {
  return z.object({
    guess: z
      .object({
        coordinates: z.object({
          lat: z.number().min(-90).max(90),
          lng: z.number().min(-180).max(180),
        }),
      })
      .strict(),
  });
}

function writeSupportedDocuments({
  options,
  http,
  ws,
}: {
  options: CompatFixture;
  http: OpenAPIObject;
  ws: OpenAPIObject;
}): void {
  const versions: number[] = [1, 2];
  versions.forEach((version) => {
    writeFileSync(
      join(options.versionsDir, `v${version}-api.json`),
      JSON.stringify(http),
    );
    writeFileSync(
      join(options.versionsDir, `v${version}-ws.json`),
      JSON.stringify(ws),
    );
  });
}

type CompatFixture = RunCompatCheckOptions & { acceptedChangesFile: string };

function fixture(t: TestContext): CompatFixture {
  const directory: string = mkdtempSync(join(tmpdir(), 'ws-compat-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const options: CompatFixture = {
    policyFile: join(directory, 'policy.json'),
    manifestFile: join(directory, 'versions-manifest.json'),
    versionsDir: directory,
    currentSpecFile: join(directory, 'http-current.json'),
    currentWsSpecFile: join(directory, 'ws-current.json'),
    acceptedChangesFile: join(directory, 'accepted-changes.json'),
    now: new Date('2026-10-23T00:00:00.000Z'),
  };
  writeFileSync(
    options.policyFile,
    JSON.stringify({ min_days_supported: 90, min_num_of_version_supported: 2 }),
  );
  writeFileSync(
    options.manifestFile,
    JSON.stringify({
      versions: [
        {
          versionNumber: 1,
          releasedAt: '2026-10-01T00:00:00.000Z',
        },
        {
          versionNumber: 2,
          releasedAt: '2026-10-02T00:00:00.000Z',
          draft: true,
        },
      ],
    }),
  );
  writeFileSync(join(directory, 'v1-api.json'), JSON.stringify(httpDocument));
  writeFileSync(join(directory, 'v2-api.json'), JSON.stringify(httpDocument));
  writeFileSync(options.currentSpecFile, JSON.stringify(httpDocument));
  const wsDocument: OpenAPIObject = getWsOpenApiDocument({
    channels: [baselineChannel],
    sharedServerEvents: sharedEvents,
  });
  writeFileSync(join(directory, 'v1-ws.json'), JSON.stringify(wsDocument));
  writeFileSync(join(directory, 'v2-ws.json'), JSON.stringify(wsDocument));
  writeFileSync(options.currentWsSpecFile, JSON.stringify(wsDocument));
  writeFileSync(options.acceptedChangesFile, '[]');
  return options;
}

describe('runCompatCheck', () => {
  it('checks both protocols for every supported version', (t) => {
    const options: CompatFixture = fixture(t);

    const report: CompatReport = runCompatCheck(options);

    assert.equal(report.brokenAt, undefined);
    assert.deepEqual(
      report.checked.map((result) => result.entry.versionNumber),
      [2, 1],
    );
    assert.deepEqual(JSON.parse(toJsonReport(report)), {
      checked: [
        {
          entry: {
            versionNumber: 2,
            releasedAt: '2026-10-02T00:00:00.000Z',
            draft: true,
          },
          breaking: false,
          changes: [],
        },
        {
          entry: { versionNumber: 1, releasedAt: '2026-10-01T00:00:00.000Z' },
          breaking: false,
          changes: [],
        },
      ],
      skippedDeprecated: [],
    });
    assert.match(
      formatHumanSummary(report),
      /✅ v2: COMPATIBLE\n {2}✅ v1: COMPATIBLE/,
    );
  });

  it('compares synthetic empty snapshots with the current WS contract', (t) => {
    const options: CompatFixture = fixture(t);
    writeFileSync(
      join(options.versionsDir, 'v1-ws.json'),
      readFileSync(
        new URL('../../openapi/versions/v1-ws.json', import.meta.url),
      ),
    );

    const report: CompatReport = runCompatCheck(options);

    assert.equal(report.brokenAt, undefined);
    assert.equal(report.checked.length, 2);
  });

  const filenames: string[] = ['v1-api.json', 'v1-ws.json'];
  filenames.forEach((filename) => {
    it(`rejects a missing ${filename} snapshot`, (t) => {
      const options: CompatFixture = fixture(t);
      unlinkSync(join(options.versionsDir, filename));

      assert.throws(
        () => runCompatCheck(options),
        (error: unknown) =>
          error instanceof Error &&
          error.message.includes('oasdiff failed') &&
          error.message.includes(filename),
      );
    });
  });

  it('rejects a WS break against an older supported version', (t) => {
    const options: CompatFixture = fixture(t);
    writeFileSync(
      join(options.versionsDir, 'v1-ws.json'),
      JSON.stringify(
        getWsOpenApiDocument({
          channels: [
            {
              ...baselineChannel,
              serverToClient: {
                ...baselineChannel.serverToClient,
                retired: {},
              },
            },
          ],
          sharedServerEvents: sharedEvents,
        }),
      ),
    );

    const report: CompatReport = runCompatCheck(options);

    assert.equal(report.brokenAt?.entry.versionNumber, 1);
    assert.deepEqual(
      report.checked.map((result) => result.breaking),
      [false, true],
    );
    assert.ok(
      report.brokenAt?.changes.some((change) => change.protocol === 'WS'),
    );
  });

  const scenarios: { name: string; channel: WsChannel }[] = [
    {
      name: 'removing a client event',
      channel: { ...baselineChannel, clientToServer: { reconnect: {} } },
    },
    {
      name: 'renaming a client event',
      channel: {
        ...baselineChannel,
        clientToServer: {
          joinRenamed: baselineChannel.clientToServer.join,
          reconnect: {},
        },
      },
    },
    {
      name: 'removing an acknowledgement field',
      channel: {
        ...baselineChannel,
        clientToServer: {
          ...baselineChannel.clientToServer,
          join: { payload: z.object({ name: z.string() }) },
        },
      },
    },
    {
      name: 'requiring a new request field',
      channel: {
        ...baselineChannel,
        clientToServer: {
          ...baselineChannel.clientToServer,
          join: {
            ...baselineChannel.clientToServer.join,
            payload: z.object({ name: z.string(), required: z.string() }),
          },
        },
      },
    },
    {
      name: 'removing a server payload field',
      channel: {
        ...baselineChannel,
        serverToClient: { update: { payload: z.object({}) } },
      },
    },
    {
      name: 'removing a server event',
      channel: { ...baselineChannel, serverToClient: {} },
    },
  ];
  scenarios.forEach(({ name, channel }) => {
    it(`rejects ${name} with the WS prefix and stops at that version`, (t) => {
      const options: CompatFixture = fixture(t);
      writeFileSync(
        options.currentWsSpecFile,
        JSON.stringify(
          getWsOpenApiDocument({
            channels: [channel],
            sharedServerEvents: sharedEvents,
          }),
        ),
      );

      const report: CompatReport = runCompatCheck(options);

      assert.equal(report.brokenAt?.entry.versionNumber, 2);
      assert.equal(report.checked.length, 1);
      assert.ok(
        report.checked[0].changes.some((change) => change.protocol === 'WS'),
      );
      assert.match(formatHumanSummary(report), /\[WS\]/);
    });
  });

  it('rejects removing a shared server event', (t) => {
    const options: CompatFixture = fixture(t);
    writeFileSync(
      options.currentWsSpecFile,
      JSON.stringify(
        getWsOpenApiDocument({
          channels: [baselineChannel],
          sharedServerEvents: {},
        }),
      ),
    );

    const report: CompatReport = runCompatCheck(options);

    assert.equal(report.brokenAt?.entry.versionNumber, 2);
    assert.ok(
      report.checked[0].changes.some((change) => change.path === '/ws/error'),
    );
  });

  it('accepts optional request fields and additional events', (t) => {
    const options: CompatFixture = fixture(t);
    const baselineHttpPayload: AnyZodObject = z.object({ name: z.string() });
    const currentHttpPayload: AnyZodObject = z.object({
      name: z.string(),
      optional: z.string().optional(),
    });
    const channel: WsChannel = {
      ...baselineChannel,
      clientToServer: {
        ...baselineChannel.clientToServer,
        join: {
          ...baselineChannel.clientToServer.join,
          payload: z.object({
            name: z.string(),
            optional: z.string().optional(),
          }),
        },
        play: {},
      },
      serverToClient: { ...baselineChannel.serverToClient, started: {} },
    };
    writeSupportedDocuments({
      options,
      http: getHttpDocument(baselineHttpPayload),
      ws: getWsOpenApiDocument({
        channels: [baselineChannel],
        sharedServerEvents: sharedEvents,
      }),
    });
    writeFileSync(
      options.currentSpecFile,
      JSON.stringify(getHttpDocument(currentHttpPayload)),
    );
    writeFileSync(
      options.currentWsSpecFile,
      JSON.stringify(
        getWsOpenApiDocument({
          channels: [channel],
          sharedServerEvents: sharedEvents,
        }),
      ),
    );

    const report: CompatReport = runCompatCheck(options);

    assert.equal(report.brokenAt, undefined);
    assert.equal(report.checked.length, 2);
  });

  it('rejects the historical guess payload narrowing for HTTP and WS', (t) => {
    const options: CompatFixture = fixture(t);
    const baselinePayload: AnyZodObject = historicalGuessPayload();
    const currentPayload: AnyZodObject = narrowedGuessPayload();
    writeSupportedDocuments({
      options,
      http: getHttpDocument(baselinePayload),
      ws: getWsDocument(baselinePayload),
    });
    writeFileSync(
      options.currentSpecFile,
      JSON.stringify(getHttpDocument(currentPayload)),
    );
    writeFileSync(
      options.currentWsSpecFile,
      JSON.stringify(getWsDocument(currentPayload)),
    );

    const report: CompatReport = runCompatCheck(options);
    const changes: NonNullable<CompatReport['brokenAt']>['changes'] =
      report.brokenAt?.changes ?? [];
    const summary: string = formatHumanSummary(report);
    const jsonReport: string = toJsonReport(report);
    const protocols: Array<'HTTP' | 'WS'> = ['HTTP', 'WS'];

    assert.equal(report.brokenAt?.entry.versionNumber, 2);
    protocols.forEach((protocol) => {
      const protocolChanges: typeof changes = changes.filter(
        (change) => change.protocol === protocol,
      );
      assert.deepEqual(
        protocolChanges
          .filter((change) => change.id === 'request-property-removed')
          .map((change) => change.text),
        [
          'removed the request property `guess/distance`',
          'removed the request property `guess/points`',
          'removed the request property `guess/win`',
        ],
      );
      assert.equal(
        protocolChanges.filter(
          (change) =>
            change.id === 'request-property-min-set' ||
            change.id === 'request-property-max-set',
        ).length,
        4,
      );
      assert.ok(
        protocolChanges.some(
          (change) => change.id === 'request-schema-became-strict',
        ),
      );
    });
    assert.match(summary, /Warnings requiring review/);
    assert.match(summary, /guess\/distance/);
    assert.match(summary, /guess\/points/);
    assert.match(summary, /guess\/win/);
    assert.match(jsonReport, /"severity": "warning"/);
    assert.match(jsonReport, /"severity": "error"/);
  });

  it('rejects strict request schemas without other structural changes', (t) => {
    const options: CompatFixture = fixture(t);
    const baselinePayload: AnyZodObject = z.object({
      payload: z.object({ value: z.string() }),
    });
    const currentPayload: AnyZodObject = z.object({
      payload: z.object({ value: z.string() }).strict(),
    });
    writeSupportedDocuments({
      options,
      http: getHttpDocument(baselinePayload),
      ws: getWsDocument(baselinePayload),
    });
    writeFileSync(
      options.currentSpecFile,
      JSON.stringify(getHttpDocument(currentPayload)),
    );
    writeFileSync(
      options.currentWsSpecFile,
      JSON.stringify(getWsDocument(currentPayload)),
    );

    const report: CompatReport = runCompatCheck(options);
    const strictChanges: NonNullable<CompatReport['brokenAt']>['changes'] =
      report.brokenAt?.changes.filter(
        (change) => change.id === 'request-schema-became-strict',
      ) ?? [];

    assert.deepEqual(
      strictChanges.map((change) => change.protocol),
      ['HTTP', 'WS'],
    );
    assert.ok(
      strictChanges.every(
        (change) =>
          change.text ===
          'the request property `payload` now rejects additional properties',
      ),
    );
  });

  it('reports configured warning exceptions as accepted changes', (t) => {
    const options: CompatFixture = fixture(t);
    const baselinePayload: AnyZodObject = z.object({
      kept: z.string(),
      removed: z.string(),
    });
    const currentPayload: AnyZodObject = z.object({ kept: z.string() });
    const acceptedChanges: Array<{
      id: string;
      text: string;
      reason: string;
    }> = [
      {
        id: 'request-property-removed',
        text: 'removed the request property `removed`',
        reason: 'Test clients never sent this field.',
      },
    ];
    writeSupportedDocuments({
      options,
      http: getHttpDocument(baselinePayload),
      ws: getWsDocument(baselinePayload),
    });
    writeFileSync(
      options.currentSpecFile,
      JSON.stringify(getHttpDocument(currentPayload)),
    );
    writeFileSync(
      options.currentWsSpecFile,
      JSON.stringify(getWsDocument(currentPayload)),
    );
    writeFileSync(options.acceptedChangesFile, JSON.stringify(acceptedChanges));

    const report: CompatReport = runCompatCheck(options);
    const changes: CompatReport['checked'][number]['changes'] =
      report.checked.flatMap((result) => result.changes);

    assert.equal(report.brokenAt, undefined);
    assert.ok(changes.length > 0);
    assert.ok(changes.every((change) => change.severity === 'accepted'));
    assert.match(formatHumanSummary(report), /Accepted changes/);
    assert.match(formatHumanSummary(report), /Test clients never sent/);
  });

  it('rejects an accepted code enum warning outside the API error schema', (t) => {
    const options: CompatFixture = fixture(t);
    const baselineHttp: OpenAPIObject = getCodeResponseDocument(['FIRST']);
    const currentHttp: OpenAPIObject = getCodeResponseDocument([
      'FIRST',
      'SECOND',
    ]);
    const wsDocument: OpenAPIObject = getWsOpenApiDocument({
      channels: [baselineChannel],
      sharedServerEvents: sharedEvents,
    });
    writeSupportedDocuments({
      options,
      http: baselineHttp,
      ws: wsDocument,
    });
    writeFileSync(options.currentSpecFile, JSON.stringify(currentHttp));
    writeFileSync(options.currentWsSpecFile, JSON.stringify(wsDocument));
    writeFileSync(
      options.acceptedChangesFile,
      JSON.stringify([
        {
          id: 'response-property-enum-value-added',
          textIncludes: '`code` response property',
          responseSchema: 'api-error',
          reason: 'Published clients normalize unknown API error codes.',
        },
      ]),
    );

    const report: CompatReport = runCompatCheck(options);
    const changes: CompatReport['checked'][number]['changes'] =
      report.brokenAt?.changes ?? [];

    assert.equal(report.brokenAt?.entry.versionNumber, 2);
    assert.ok(
      changes.some(
        (change) =>
          change.id === 'response-property-enum-value-added' &&
          change.severity === 'warning',
      ),
    );
  });

  it('combines HTTP and WS failures in one report', (t) => {
    const options: CompatFixture = fixture(t);
    writeFileSync(
      options.currentSpecFile,
      JSON.stringify({ ...httpDocument, paths: {} }),
    );
    writeFileSync(
      options.currentWsSpecFile,
      JSON.stringify(
        getWsOpenApiDocument({ channels: [], sharedServerEvents: {} }),
      ),
    );

    const report: CompatReport = runCompatCheck(options);
    const summary: string = formatHumanSummary(report);

    assert.equal(report.brokenAt?.entry.versionNumber, 2);
    assert.match(summary, /\[HTTP\]/);
    assert.match(summary, /\[WS\]/);
    assert.match(summary, /❌ v2: BROKEN/);
    assert.match(summary, /Breaking change detected against v2/);
  });

  it('reports accepted WS errors with their justification', (t) => {
    const options: CompatFixture = fixture(t);
    writeFileSync(
      options.currentWsSpecFile,
      JSON.stringify(
        getWsOpenApiDocument({
          channels: [{ ...baselineChannel, clientToServer: { reconnect: {} } }],
          sharedServerEvents: sharedEvents,
        }),
      ),
    );
    writeFileSync(
      options.acceptedChangesFile,
      JSON.stringify([
        {
          id: 'api-path-removed-without-deprecation',
          operation: 'POST',
          path: '/ws/session/join',
          text: 'api path removed without deprecation',
          reason: 'The test client does not use this event.',
        },
      ]),
    );

    const report: CompatReport = runCompatCheck(options);
    const summary: string = formatHumanSummary(report);
    const jsonReport: string = toJsonReport(report);

    assert.equal(report.brokenAt, undefined);
    assert.match(summary, /Accepted changes/);
    assert.match(summary, /The test client does not use this event/);
    assert.match(jsonReport, /"severity": "accepted"/);
    assert.match(jsonReport, /The test client does not use this event/);
  });

  it('uses the same version retirement floor for HTTP and WS', (t) => {
    const options: CompatFixture = fixture(t);
    writeFileSync(
      options.manifestFile,
      JSON.stringify({
        versions: [
          {
            versionNumber: 1,
            releasedAt: '2026-10-01T00:00:00.000Z',
            deprecatedAt: '2026-10-22',
            deprecationReason: 'Retired test version',
          },
          {
            versionNumber: 2,
            releasedAt: '2026-10-02T00:00:00.000Z',
          },
        ],
      }),
    );

    const report: CompatReport = runCompatCheck(options);

    assert.deepEqual(
      report.checked.map((result) => result.entry.versionNumber),
      [2],
    );
    assert.deepEqual(
      report.skippedDeprecated.map((entry) => entry.versionNumber),
      [1],
    );
  });
});

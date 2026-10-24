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
import type { OpenAPIObject } from 'openapi3-ts';
import { z } from 'zod';
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

type CompatFixture = RunCompatCheckOptions & { errIgnoreFile: string };

function fixture(t: TestContext): CompatFixture {
  const directory: string = mkdtempSync(join(tmpdir(), 'ws-compat-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const options: CompatFixture = {
    policyFile: join(directory, 'policy.json'),
    manifestFile: join(directory, 'versions-manifest.json'),
    versionsDir: directory,
    currentSpecFile: join(directory, 'http-current.json'),
    currentWsSpecFile: join(directory, 'ws-current.json'),
    errIgnoreFile: join(directory, 'err-ignore.txt'),
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
          file: 'v1-api.json',
          versionNumber: 1,
          releasedAt: '2026-10-01T00:00:00.000Z',
        },
        {
          file: 'v2-api.json',
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
  writeFileSync(options.errIgnoreFile, '');
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
      checked: report.checked,
      skippedDeprecated: [],
    });
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

  it('rejects a missing WS snapshot', (t) => {
    const options: CompatFixture = fixture(t);
    unlinkSync(join(options.versionsDir, 'v1-ws.json'));

    assert.throws(() => runCompatCheck(options), /oasdiff failed.*v1-ws\.json/);
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
  });

  it('uses the common ignore file for WS changes', (t) => {
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
      options.errIgnoreFile,
      'POST /ws/session/join api path removed without deprecation\n',
    );

    const report: CompatReport = runCompatCheck(options);

    assert.equal(report.brokenAt, undefined);
  });

  it('uses the same version retirement floor for HTTP and WS', (t) => {
    const options: CompatFixture = fixture(t);
    writeFileSync(
      options.manifestFile,
      JSON.stringify({
        versions: [
          {
            file: 'v1-api.json',
            versionNumber: 1,
            releasedAt: '2026-10-01T00:00:00.000Z',
            deprecatedAt: '2026-10-22',
            deprecationReason: 'Retired test version',
          },
          {
            file: 'v2-api.json',
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

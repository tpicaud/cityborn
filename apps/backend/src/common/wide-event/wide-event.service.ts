import { Inject, Injectable } from '@nestjs/common';
import { ClsService, ClsServiceManager, type ClsStore } from 'nestjs-cls';
import type {
  WideEvent,
  WideEventEnrichment,
  WideEventInit,
  WideEventLogger,
  WideEventOutcome,
} from './wide-event';
import { emitWideEventLine, WIDE_EVENT_LOGGER } from './wide-event';

export interface WideEventClsStore extends ClsStore {
  wideEvent: WideEvent;
  wideEventStartedAt: bigint;
  wideEventEmitted: boolean;
}

export function enrichWideEventFromCls(
  fields: Partial<WideEventEnrichment>,
): boolean {
  const cls = ClsServiceManager.getClsService<WideEventClsStore>();
  const current = cls.get('wideEvent');
  if (!current) {
    return false;
  }
  cls.set('wideEvent', Object.assign({}, current, fields));
  return true;
}

@Injectable()
export class WideEventService {
  constructor(
    private readonly cls: ClsService<WideEventClsStore>,
    @Inject(WIDE_EVENT_LOGGER) private readonly logger: WideEventLogger,
  ) {}

  set(init: WideEventInit): void {
    this.cls.set('wideEvent', init);
    this.cls.set('wideEventStartedAt', process.hrtime.bigint());
    this.cls.set('wideEventEmitted', false);
  }

  enrich(fields: Partial<WideEventEnrichment>): void {
    const current = this.cls.get('wideEvent');
    if (!current) {
      return;
    }
    this.cls.set('wideEvent', Object.assign({}, current, fields));
  }

  get(): WideEvent | undefined {
    return this.cls.get('wideEvent');
  }

  complete(fields: {
    outcome: WideEventOutcome;
    statusCode?: number;
    route?: string;
  }): WideEvent | undefined {
    if (this.cls.get('wideEventEmitted')) {
      return undefined;
    }

    const current = this.cls.get('wideEvent');
    const startedAt = this.cls.get('wideEventStartedAt');
    if (!current || startedAt === undefined) {
      return undefined;
    }

    this.cls.set('wideEventEmitted', true);
    this.enrich({
      ...fields,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
    });
    const completed = this.get();
    if (completed) {
      emitWideEventLine(this.logger, completed);
    }
    return completed;
  }
}

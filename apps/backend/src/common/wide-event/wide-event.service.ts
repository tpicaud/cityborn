import { Injectable } from '@nestjs/common';
import { ClsService, ClsServiceManager, type ClsStore } from 'nestjs-cls';
import type {
  WideEvent,
  WideEventAuthContext,
  WideEventBusinessContext,
  WideEventErrorContext,
  WideEventFinalization,
  WideEventFinalized,
  WideEventInit,
  WideEventRateLimitContext,
} from './wide-event';

export interface WideEventClsStore extends ClsStore {
  wideEvent: WideEvent;
}

export function enrichWideEventFromCls(fields: WideEventErrorContext): boolean {
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
  constructor(private readonly cls: ClsService<WideEventClsStore>) {}

  set(init: WideEventInit): void {
    this.cls.set('wideEvent', init);
  }

  enrichAuth(fields: WideEventAuthContext): void {
    this.merge(fields);
  }

  enrichBusinessContext(fields: WideEventBusinessContext): void {
    this.merge(fields);
  }

  enrichError(fields: WideEventErrorContext): void {
    this.merge(fields);
  }

  enrichRateLimit(fields: WideEventRateLimitContext): void {
    this.merge(fields);
  }

  finalize(fields: WideEventFinalization): WideEventFinalized | undefined {
    const current = this.cls.get('wideEvent');
    if (!current) {
      return undefined;
    }
    const finalized = Object.assign({}, current, fields);
    this.cls.set('wideEvent', finalized);
    return finalized;
  }

  get(): WideEvent | undefined {
    return this.cls.get('wideEvent');
  }

  private merge(
    fields:
      | WideEventAuthContext
      | WideEventBusinessContext
      | WideEventErrorContext
      | WideEventRateLimitContext,
  ): void {
    const current = this.cls.get('wideEvent');
    if (!current) {
      return;
    }
    this.cls.set('wideEvent', Object.assign({}, current, fields));
  }
}

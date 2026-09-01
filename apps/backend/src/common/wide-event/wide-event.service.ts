import { Injectable } from '@nestjs/common';
import { ClsService, ClsServiceManager, type ClsStore } from 'nestjs-cls';
import type { WideEvent, WideEventInit } from './wide-event';

export interface WideEventClsStore extends ClsStore {
  wideEvent: WideEvent;
}

export function enrichWideEventFromCls(fields: Partial<WideEvent>): void {
  const cls = ClsServiceManager.getClsService<WideEventClsStore>();
  const current = cls.get('wideEvent');
  if (!current) {
    return;
  }
  cls.set('wideEvent', { ...current, ...fields });
}

@Injectable()
export class WideEventService {
  constructor(private readonly cls: ClsService<WideEventClsStore>) {}

  set(init: WideEventInit): void {
    this.cls.set('wideEvent', init);
  }

  enrich(fields: Partial<WideEvent>): void {
    const current = this.cls.get('wideEvent');
    if (!current) {
      return;
    }
    this.cls.set('wideEvent', { ...current, ...fields });
  }

  get(): WideEvent | undefined {
    return this.cls.get('wideEvent');
  }
}

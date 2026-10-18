import 'reflect-metadata';
import { sessionWsEvent } from '@cityborn/api';
import {
  MESSAGE_MAPPING_METADATA,
  MESSAGE_METADATA,
} from '@nestjs/websockets/constants';
import { SessionGateway } from './session.gateway';

function subscribedEventNames(gateway: typeof SessionGateway): string[] {
  return Object.getOwnPropertyNames(gateway.prototype).flatMap(
    (property): string[] => {
      const handler: unknown = Object.getOwnPropertyDescriptor(
        gateway.prototype,
        property,
      )?.value;
      if (typeof handler !== 'function') return [];
      if (!Reflect.getMetadata(MESSAGE_MAPPING_METADATA, handler)) return [];

      const eventName: unknown = Reflect.getMetadata(MESSAGE_METADATA, handler);
      return typeof eventName === 'string' ? [eventName] : [];
    },
  );
}

describe('SessionGateway message mapping', () => {
  it('handles exactly the client events declared by the session channel', () => {
    const contractEvents: string[] = Object.values(sessionWsEvent);

    const handledEvents: string[] = subscribedEventNames(SessionGateway);

    expect(handledEvents.sort()).toEqual(contractEvents.sort());
  });
});

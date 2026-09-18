import type { WsChannel, WsChannelClientEvent } from '@cityborn/api';
import { wsEventName } from '@cityborn/api';
import { applyDecorators, UseInterceptors, UsePipes } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { WsAckInterceptor } from '../interceptors/ws-ack.interceptor';
import { WsPayloadValidationPipe } from '../pipes/ws-payload-validation.pipe';

/**
 * Branche un handler de gateway sur un event du contrat WS : nom de fil dérivé
 * du channel, validation zod du `@MessageBody()` et enveloppe d'ack en retour.
 */
export function WsMessage<
  Channel extends WsChannel,
  Event extends WsChannelClientEvent<Channel>,
>(channel: Channel, event: Event): MethodDecorator {
  return applyDecorators(
    SubscribeMessage(wsEventName(channel, event)),
    UsePipes(
      new WsPayloadValidationPipe(channel.clientToServer[event].payload),
    ),
    UseInterceptors(new WsAckInterceptor()),
  );
}

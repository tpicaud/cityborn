import type { GameConfig } from '@cityborn/api';
import { buildGameConfig, ErrorCode, sessionWsChannel } from '@cityborn/api';
import type { ArgumentMetadata } from '@nestjs/common';
import { WsPayloadValidationPipe } from './ws-payload-validation.pipe';

const bodyMetadata: ArgumentMetadata = { type: 'body' };

describe('WsPayloadValidationPipe', () => {
  describe('transform', () => {
    it('rejects an invalid game configuration as a bad request', () => {
      const pipe: WsPayloadValidationPipe = new WsPayloadValidationPipe(
        sessionWsChannel.clientToServer.updateGameConfig.payload,
      );
      const invalidPayload: { gameConfig: { timer: string } } = {
        gameConfig: { timer: 'fast' },
      };

      expect(() => pipe.transform(invalidPayload, bodyMetadata)).toThrow(
        expect.objectContaining({
          response: expect.objectContaining({ code: ErrorCode.BAD_REQUEST }),
        }),
      );
    });

    it('rejects an invalid guess as a bad request', () => {
      const pipe: WsPayloadValidationPipe = new WsPayloadValidationPipe(
        sessionWsChannel.clientToServer.guess.payload,
      );
      const invalidPayload: {
        guess: {
          coordinates: { lat: string; lng: number };
          distance: number;
          points: number;
          win: boolean;
        };
      } = {
        guess: {
          coordinates: { lat: 'north', lng: 2 },
          distance: 10,
          points: 100,
          win: false,
        },
      };

      expect(() => pipe.transform(invalidPayload, bodyMetadata)).toThrow(
        expect.objectContaining({
          response: expect.objectContaining({ code: ErrorCode.BAD_REQUEST }),
        }),
      );
    });

    it('rejects a payload the handler declares but the client omits', () => {
      const pipe: WsPayloadValidationPipe = new WsPayloadValidationPipe(
        sessionWsChannel.clientToServer.join.payload,
      );

      expect(() => pipe.transform(undefined, bodyMetadata)).toThrow(
        expect.objectContaining({
          response: expect.objectContaining({ code: ErrorCode.BAD_REQUEST }),
        }),
      );
    });

    it('strips the properties the payload schema does not declare', () => {
      const pipe: WsPayloadValidationPipe = new WsPayloadValidationPipe(
        sessionWsChannel.clientToServer.updateGameConfig.payload,
      );
      const gameConfig: GameConfig = buildGameConfig({
        timer: 30,
        nbOfObjects: 5,
      });

      const normalized: unknown = pipe.transform(
        { gameConfig: { ...gameConfig, ignored: true } },
        bodyMetadata,
      );

      expect(normalized).toEqual({ gameConfig });
    });

    it('leaves the arguments that are not a message body untouched', () => {
      const pipe: WsPayloadValidationPipe = new WsPayloadValidationPipe(
        sessionWsChannel.clientToServer.join.payload,
      );
      const socket: { id: string } = { id: 'socket-1' };

      expect(pipe.transform(socket, { type: 'custom' })).toBe(socket);
    });

    it('leaves the body of an event without declared payload untouched', () => {
      const pipe: WsPayloadValidationPipe = new WsPayloadValidationPipe(
        undefined,
      );

      expect(pipe.transform(undefined, bodyMetadata)).toBeUndefined();
    });
  });
});

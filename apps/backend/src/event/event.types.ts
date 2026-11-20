import type { AccountType, GameConfigPack, SessionMode } from '@cityborn/api';

export interface EventMap {
  user_signed_up: {
    method: AccountType;
  };
  user_signed_in: {
    method: AccountType;
  };

  session_created: {
    mode: SessionMode;
    quickPlay: boolean;
  };
  game_started: {
    mode: SessionMode;
    quickPlay: boolean;
    packs: GameConfigPack[];
    numberOfPlayers: number;
  };
  game_finished: {
    gameId: string;
    mode: SessionMode;
    quickPlay: boolean;
    numberOfPlayers: number;
    average_score: number;
  };
  game_abandoned: {
    gameId: string;
    mode: SessionMode;
    quickPlay: boolean;
    round: number;
    score: number;
  };
}

export type Event<Name extends keyof EventMap = keyof EventMap> = {
  id: string;
  visitorId: string;
  name: Name;
  properties: EventMap[Name];
  created_at: string;
};

export type CreateEvent<Name extends keyof EventMap = keyof EventMap> = Omit<
  Event<Name>,
  'id' | 'created_at'
>;

export function createEvent<Name extends keyof EventMap>(
  event: CreateEvent<Name>,
) {
  return event;
}

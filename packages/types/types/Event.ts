///////////////////
// Event mapping //

import { SessionMode } from '../enums/SessionMode.js';
import { Category } from './Category.js';

///////////////////
export interface EventMap {
  ////////////////
  // Connection //
  ////////////////
  user_signed_up: {
    method: 'email' | 'google';
  };
  user_signed_in: {
    method: 'email' | 'google';
  };
  user_new_connection: {};

  /////////////
  // Session //
  /////////////
  session_created: {
    mode: SessionMode;
  };
  game_started: {
    mode: SessionMode;
    categories: Category[];
    numberOfPlayers: number;
  };
  game_finished: {
    gameId: string;
    mode: SessionMode;
    numberOfPlayers: number;
    average_score: number;
  };
}

//////////////////////
// Type Event
//////////////////////
export type Event<Name extends keyof EventMap = keyof EventMap> = {
  id: string;
  visitorId: string;
  name: Name;
  properties: EventMap[Name];
  created_at: string;
};

/////////////////////////
// Type création event //
/////////////////////////
export type CreateEvent<Name extends keyof EventMap = keyof EventMap> = Omit<
  Event<Name>,
  'id' | 'created_at'
>;

export function createEvent<Name extends keyof EventMap>(
  event: CreateEvent<Name>,
) {
  return event;
}

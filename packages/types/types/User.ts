import type { GameRecord } from './Game.js';

export type AccountType = 'email' | 'google' | 'apple';

export class PublicUser {
  /////////////
  // Profile //
  /////////////
  id: string;

  username: string;
}

export class User extends PublicUser {
  /////////////
  // Profile //
  /////////////

  email: string;

  type: AccountType;

  createdAt?: string;

  updatedAt?: string;

  ///////////////
  // Relations //
  ///////////////
  relations?: {
    games?: GameRecord[];
  };
}

export class CreateUser {
  username: string;

  email: string;

  password: string;
}

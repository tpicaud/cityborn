import { GameRecord } from './Game.js';

export type AccountType = 'email' | 'google';

export class PublicUser {
  /////////////
  // Profile //
  /////////////
  id: string;

  username: string;

  isVerified: boolean;
}

export class User extends PublicUser {
  /////////////
  // Profile //
  /////////////

  email: string;

  birthdate?: string;

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

  birthdate: string;

  password: string;
}

import { GameRecord } from "./Game.js";

export class PublicUser {

  /////////////
  // Profile //
  /////////////
  id: number;

  username: string;

  email: string;

  isVerified?: boolean;

  createdAt?: string;

  updatedAt?: string;

  ///////////////
  // Relations //
  ///////////////
  relations?: {

    games?: GameRecord[]
    
  }
}

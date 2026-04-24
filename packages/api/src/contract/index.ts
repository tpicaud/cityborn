import { initContract } from '@ts-rest/core';
import { authContract } from './auth.contract.js';
import { categoryContract } from './category.contract.js';
import { eventContract } from './event.contract.js';
import { guessObjectContract } from './guess-object.contract.js';
import { sessionContract } from './session.contract.js';
import { userContract } from './user.contract.js';

const c = initContract();

export const contract = c.router({
  auth: authContract,
  user: userContract,
  session: sessionContract,
  category: categoryContract,
  guessObjects: guessObjectContract,
  event: eventContract,
});

export type AppContract = typeof contract;

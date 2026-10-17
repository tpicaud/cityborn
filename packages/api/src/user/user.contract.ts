import { initContract } from '@ts-rest/core';
import { UpdateUsernameSchema, UserSchema } from './user.schema';

const c = initContract();

export const userContract = c.router(
  {
    updateUsername: {
      method: 'PATCH',
      path: '/username',
      body: UpdateUsernameSchema,
      responses: { 200: UserSchema },
    },
  },
  { pathPrefix: '/user' },
);

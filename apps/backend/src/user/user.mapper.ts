import { User } from '@prisma/client'; // ou ton entity User
import { PublicUser } from '@cityborn/types';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
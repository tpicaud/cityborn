import { User as PrismaUser} from '@prisma/client';
import { PublicUser } from '@cityborn/types';

export function toPublicUser(user: PrismaUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
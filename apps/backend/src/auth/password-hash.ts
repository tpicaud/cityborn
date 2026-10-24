import * as bcrypt from 'bcrypt';

const PASSWORD_HASH_ROUNDS: number = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

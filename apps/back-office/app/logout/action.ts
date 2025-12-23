// src/app/logout/action.ts
'use server';

import { deleteSession } from '@/lib/auth';

export async function logout() {
  await deleteSession();
}

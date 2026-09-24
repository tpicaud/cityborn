'use server';

import { redirect } from 'next/navigation';
import { getBackOfficeServerConfig } from '@/config/server';
import { deleteSession, setSession } from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from '@/lib/rate-limit';

export async function login(formData: FormData) {
  const backOfficeServerConfig = getBackOfficeServerConfig();
  const rateLimit = await checkRateLimit();

  if (rateLimit.isBlocked) {
    const resetTime = rateLimit.resetTime
      ? new Date(rateLimit.resetTime)
      : new Date();
    const minutes = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60));
    return {
      success: false,
      error: `Trop de tentatives. Réessayez dans ${minutes} minute(s).`,
    };
  }

  const password = formData.get('password') as string;
  if (password === backOfficeServerConfig.adminPassword) {
    await resetAttempts();

    await setSession({
      isAuthenticated: true,
      loginTime: Date.now(),
    });

    redirect('/dashboard');
  }

  await recordFailedAttempt();

  const newRateLimit = await checkRateLimit();
  const remainingText =
    newRateLimit.remainingAttempts > 0
      ? ` (${newRateLimit.remainingAttempts} tentative(s) restante(s))`
      : '';

  return {
    success: false,
    error: `Mot de passe incorrect${remainingText}`,
  };
}

export async function logout() {
  await deleteSession();
}

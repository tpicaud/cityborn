// src/app/login/action.ts
'use server';

import { setSession } from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
} from '@/lib/rate-limit';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  // Check rate limit first
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
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (password === adminPassword) {
    // Reset attempts on successful login
    await resetAttempts();

    await setSession({
      isAuthenticated: true,
      loginTime: Date.now(),
    });

    redirect('/dashboard');
  }

  // Record failed attempt
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

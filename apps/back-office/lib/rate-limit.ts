// src/lib/rate-limit.ts
import { cookies } from 'next/headers';

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const RESET_WINDOW = 60 * 60 * 1000; // 1 hour

export async function checkRateLimit(): Promise<{
  isBlocked: boolean;
  remainingAttempts: number;
  resetTime?: number;
}> {
  const cookieStore = await cookies();
  const attemptsData = cookieStore.get('login_attempts')?.value;

  let attempts: LoginAttempt = { count: 0, lastAttempt: 0 };

  if (attemptsData) {
    try {
      attempts = JSON.parse(attemptsData);
    } catch {
      // Invalid data, reset
      attempts = { count: 0, lastAttempt: 0 };
    }
  }

  const now = Date.now();

  // Check if currently locked
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    return {
      isBlocked: true,
      remainingAttempts: 0,
      resetTime: attempts.lockedUntil,
    };
  }

  // Reset attempts if window has passed
  if (now - attempts.lastAttempt > RESET_WINDOW) {
    attempts = { count: 0, lastAttempt: now };
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts.count);

  return {
    isBlocked: false,
    remainingAttempts,
  };
}

export async function recordFailedAttempt(): Promise<void> {
  const cookieStore = await cookies();
  const attemptsData = cookieStore.get('login_attempts')?.value;

  let attempts: LoginAttempt = { count: 0, lastAttempt: 0 };

  if (attemptsData) {
    try {
      attempts = JSON.parse(attemptsData);
    } catch {
      attempts = { count: 0, lastAttempt: 0 };
    }
  }

  const now = Date.now();

  // Reset if window has passed
  if (now - attempts.lastAttempt > RESET_WINDOW) {
    attempts = { count: 0, lastAttempt: now };
  }

  attempts.count += 1;
  attempts.lastAttempt = now;

  // Lock if max attempts reached
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCK_DURATION;
  }

  cookieStore.set('login_attempts', JSON.stringify(attempts), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

export async function resetAttempts(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('login_attempts');
}

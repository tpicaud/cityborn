'use client';

import {
  type ApiError,
  ErrorCode,
  getFriendlyErrorMessage,
} from '@cityborn/api';
import { useAuth } from '@cityborn/client/auth';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import LogoutButton from '../logout-button';
import Loader from '../ui/Loader';

const adminAccessDeniedError: ApiError = {
  code: ErrorCode.USER_NOT_ADMIN,
  statusCode: 403,
  message: 'Admin role required',
};

export function AdminAccessGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div
        role="alert"
        className="h-full flex flex-col items-center justify-center gap-4 text-center"
      >
        <p>{getFriendlyErrorMessage(adminAccessDeniedError)}</p>
        <LogoutButton />
      </div>
    );
  }

  return children;
}

'use client';

import { useError } from '@cityborn/client';
import { useAuth } from '@cityborn/client/auth';
import { LogOut } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { Button } from './ui/Button';

export default function LogoutButton() {
  const { setUser } = useAuth();
  const { invokeError } = useError();

  const handleLogout = async (): Promise<void> => {
    try {
      await authApi.signOut();
      setUser(null);
    } catch (error: unknown) {
      invokeError(error);
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Déconnexion
    </Button>
  );
}

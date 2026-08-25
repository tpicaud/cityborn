'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logout } from '@/server/use-server/auth';
import { Button } from './ui/Button';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Déconnexion
    </Button>
  );
}

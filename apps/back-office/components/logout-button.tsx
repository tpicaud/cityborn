'use client';

import { type SignOut, useSignOut } from '@cityborn/client/auth';
import { LogOut } from 'lucide-react';
import { Button } from './ui/Button';

export default function LogoutButton() {
  const signOut: SignOut = useSignOut();

  return (
    <Button variant="outline" onClick={signOut}>
      <LogOut className="h-4 w-4 mr-2" />
      Déconnexion
    </Button>
  );
}

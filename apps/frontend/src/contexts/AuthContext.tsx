'use client';

import type { User } from '@cityborn/api';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({
  initialValue,
  children,
}: {
  initialValue: User | null;
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(initialValue);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;

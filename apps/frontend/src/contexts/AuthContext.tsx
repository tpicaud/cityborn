'use client';

import {
  useState,
  useContext,
  createContext,
  ReactNode,
  useCallback,
} from 'react';
import { User } from '@cityborn/types';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
}

// ✅ On exporte pour pouvoir l'utiliser ailleurs
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
        setUser(data.user ?? null);
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

// ✅ Hook pratique pour accéder au contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ✅ Export du provider pour envelopper l’app
export default AuthProvider;

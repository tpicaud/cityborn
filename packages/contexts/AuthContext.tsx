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

export const AuthProvider = ({
  initialValue,
  getCurrentUser,
  children,
}: {
  initialValue: User | null;
  getCurrentUser: () => Promise<User | null>;
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(initialValue);

  const refreshUser = useCallback(async () => {
    try {
      console.log('Refreshing user...');
      const user = await getCurrentUser();
      console.log('User refreshed:', user);
      setUser(user);
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

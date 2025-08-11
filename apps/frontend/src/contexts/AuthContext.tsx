import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import * as apiService from '@/services/apiService';
import { PublicUser } from "@cityborn/types";

interface AuthContextType {
    user: PublicUser | null;
    setUser: React.Dispatch<React.SetStateAction<PublicUser | null>>;
    loading: boolean;
}

// ✅ On exporte pour pouvoir l'utiliser ailleurs
export const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => { },
    loading: true,
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchUser() {
        setLoading(true);
        try {
            const user = await apiService.getCurrentUser();
            setUser(user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ Hook pratique pour accéder au contexte
export function useAuth() {
    return useContext(AuthContext);
}

// ✅ Export du provider pour envelopper l’app
export default AuthProvider;

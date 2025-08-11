'use client';

import { useAuth } from "@/contexts/AuthContext";
import { AuthComponent } from "./auth/AuthComponent";
import MenuComponent from "./MenuComponent";

export default function HomeComponent() {
    const { user } = useAuth();

    return (
        <div>
            {user ? (
                <MenuComponent />
            ) : (
                <AuthComponent />
            )}
        </div>
    )
}
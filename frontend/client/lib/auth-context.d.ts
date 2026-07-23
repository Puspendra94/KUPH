import React from "react";
interface User {
    id: string;
    email: string;
    authProvider?: string | null;
    authProviderId?: string | null;
    createdAt: string;
    updatedAt: string;
}
interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
}
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useAuth(): AuthContextType;
export {};

import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name?: string;
  agencyId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  keycloakConfig: any | null;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE = "http://localhost:3001/api";

WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keycloakConfig, setKeycloakConfig] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch Keycloak config on app startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await axios.get(`${API_BASE}/auth/keycloak-config`);
        setKeycloakConfig(response.data);
        
        // Check for stored token
        const storedToken = await SecureStore.getItemAsync("kuph_auth_token");
        if (storedToken) {
          setToken(storedToken);
          // Verify token with backend
          const userRes = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser(userRes.data);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    if (!keycloakConfig) {
      throw new Error("Keycloak config not loaded");
    }

    try {
      const redirectUrl = AuthSession.getRedirectUrl();
      const discoveryResult = await AuthSession.fetchDiscoveryAsync(
        `${keycloakConfig.authServerUrl}/realms/${keycloakConfig.realm}`
      );

      const authRequest = new AuthSession.AuthRequest({
        clientId: keycloakConfig.clientId,
        redirectUrl,
        scopes: ["openid", "profile", "email"],
        prompt: AuthSession.Prompt.Login,
      });

      const authResult = await authRequest.promptAsync(discoveryResult);

      if (authResult.type === "success") {
        const { access_token } = authResult.params;
        
        // Store token securely
        await SecureStore.setItemAsync("kuph_auth_token", access_token);
        setToken(access_token);

        // Verify with backend and create/fetch user
        const userRes = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setUser(userRes.data);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("kuph_auth_token");
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        keycloakConfig,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

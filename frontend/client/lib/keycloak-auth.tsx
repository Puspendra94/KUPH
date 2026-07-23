import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

interface KeycloakAuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  signupWithCredentials: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => string | null;
  forgotPassword: (email: string) => Promise<void>;
}

const KeycloakAuthContext = createContext<KeycloakAuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Decode a JWT token's payload without verifying the signature.
 * Used only to extract user info and check expiry on the frontend
 * after a successful login (the token was already issued by the backend).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return (payload.exp as number) < now;
}

function extractUserFromToken(token: string): UserProfile | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id: (payload.sub as string) || (payload.email as string) || "",
    email: (payload.email as string) || (payload.preferred_username as string) || "",
    name: (payload.name as string) || `${(payload.given_name as string) || ""} ${(payload.family_name as string) || ""}`.trim() || undefined,
  };
}

export function KeycloakAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load existing token on app startup — validate locally without backend call
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("auth_token");
      if (savedToken && !isTokenExpired(savedToken)) {
        const profile = extractUserFromToken(savedToken);
        if (profile && profile.email) {
          setUser(profile);
          setToken(savedToken);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("auth_token");
        }
      } else if (savedToken) {
        // Token exists but is expired
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Login failed");
        }

        const data = await res.json();
        localStorage.setItem("auth_token", data.access_token);
        setUser(data.user);
        setToken(data.access_token);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    []
  );

  const signupWithCredentials = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            name: name || "",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Signup failed");
        }

        // Signup was successful, store token and user
        const data = await res.json();
        localStorage.setItem("auth_token", data.access_token);
        setUser(data.user);
        setToken(data.access_token);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Signup failed:", error);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      // Invalidate session on the backend first
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          // Best-effort: log but don't block logout
          console.warn("Backend logout warning:", err);
        });
      }
    } finally {
      // Always clear local state regardless of backend result
      localStorage.removeItem("auth_token");
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  }, [token]);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to send reset email");
    }
  }, []);

  const getToken = useCallback(() => token, [token]);

  return (
    <KeycloakAuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        loginWithCredentials,
        signupWithCredentials,
        logout,
        getToken,
        forgotPassword,
      }}
    >
      {children}
    </KeycloakAuthContext.Provider>
  );
}

export function useKeycloakAuth() {
  const context = useContext(KeycloakAuthContext);
  if (!context) {
    throw new Error("useKeycloakAuth must be used within KeycloakAuthProvider");
  }
  return context;
}
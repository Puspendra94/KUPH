export interface AuthServiceProvider {
  /** Validate a JWT token against Keycloak's JWKS endpoint */
  verifyToken(token: string): Promise<Record<string, unknown>>;
  /** Return public Keycloak configuration for the frontend SPA client */
  getPublicConfig(): {
    authServerUrl: string;
    realm: string;
    clientId: string;
  };
  /** Authenticate with email and password, returning an access token */
  authenticateWithCredentials(email: string, password: string): Promise<string>;
  /** Create a new user in Keycloak */
  createKeycloakUser(email: string, password: string, name?: string): Promise<void>;
  /** Logout from Keycloak, invalidating the session */
  logout(token: string): Promise<void>;
  /** Send forgot-password email or trigger Keycloak password reset flow */
  forgotPassword(email: string): Promise<void>;
}

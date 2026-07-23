import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthServiceProvider } from './auth-service-provider.interface';

interface JwksKey {
  kid?: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
}

@Injectable()
export class KeycloakAdapter implements AuthServiceProvider {
  private readonly authServerUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private jwksCache: JwksKey[] | null = null;
  private jwksCacheTime = 0;
  private readonly jwksCacheTtl = 300_000; // 5 minutes

  constructor(private readonly configService: ConfigService) {
    this.authServerUrl = this.configService.get<string>('app.keycloak.authServerUrl', 'http://localhost:8080');
    this.realm = this.configService.get<string>('app.keycloak.realm', 'kuph');
    this.clientId = this.configService.get<string>('app.keycloak.frontendClientId', 'kuph-frontend');
    console.log(`KeycloakAdapter initialized with authServerUrl=${this.authServerUrl}, realm=${this.realm}, clientId=${this.clientId}`);
  }

  private get certsUrl(): string {
    return `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/certs`;
  }

  getPublicConfig() {
    return {
      authServerUrl: this.authServerUrl,
      realm: this.realm,
      clientId: this.clientId,
    };
  }

  async verifyToken(token: string): Promise<Record<string, unknown>> {
    // 1. Decode the JWT header to get the key ID (kid)
    const headerBase64 = token.split('.')[0];
    let kid: string | undefined;
    try {
      const header = JSON.parse(
        Buffer.from(headerBase64, 'base64').toString('utf-8'),
      ) as { kid?: string };
      kid = header.kid;
    } catch {
      throw new Error('Invalid token header');
    }

    // 2. Fetch JWKS (with caching)
    const jwks = await this.fetchJwks();
    const jwk = jwks.find((key) => key.kid === kid);
    if (!jwk) {
      throw new Error('No matching JWK found for token kid');
    }

    // 3. Import the JWK as a public key and verify
    const publicKey = await this.jwkToCryptoKey(jwk);

    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const signature = this.base64UrlToBuffer(signatureB64);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const valid = await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      publicKey,
      signature,
      data,
    );

    if (!valid) {
      throw new Error('Token signature verification failed');
    }

    // 4. Decode payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf-8'),
    ) as Record<string, unknown>;

    // 5. Validate basic claims
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && (payload.exp as number) < now) {
      throw new Error('Token has expired');
    }
    if (payload.nbf && (payload.nbf as number) > now) {
      throw new Error('Token is not yet valid');
    }
    if (payload.iss && payload.iss !== `${this.authServerUrl}/realms/${this.realm}`) {
      throw new Error('Invalid token issuer');
    }
    // Validate audience claim - token must be intended for one of our clients
    if (payload.aud) {
      const aud = payload.aud as string | string[];
      const expectedAudiences = [
        this.configService.get<string>('app.keycloak.frontendClientId', 'kuph-frontend'),
        this.configService.get<string>('app.keycloak.clientId', 'kuph-backend'),
        'account',
      ];
      const audArray = Array.isArray(aud) ? aud : [aud];
      const hasValidAudience = audArray.some((a) => expectedAudiences.includes(a));
      if (!hasValidAudience) {
        throw new Error('Invalid token audience');
      }
    }

    return payload;
  }

  private async fetchJwks(): Promise<JwksKey[]> {
    const now = Date.now();
    if (this.jwksCache && now - this.jwksCacheTime < this.jwksCacheTtl) {
      return this.jwksCache;
    }

    const response = await fetch(this.certsUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch JWKS');
    }

    const data = (await response.json()) as { keys: JwksKey[] };
    this.jwksCache = data.keys;
    this.jwksCacheTime = now;
    return this.jwksCache;
  }

  private async jwkToCryptoKey(jwk: JwksKey): Promise<CryptoKey> {
    const keyData = {
      kty: jwk.kty,
      n: this.base64UrlToBase64(jwk.n),
      e: this.base64UrlToBase64(jwk.e),
      alg: jwk.alg || 'RS256',
    };

    return crypto.subtle.importKey(
      'jwk',
      keyData as JsonWebKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  }

  private base64UrlToBuffer(base64Url: string): ArrayBuffer {
    const base64 = this.base64UrlToBase64(base64Url);
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private base64UrlToBase64(base64Url: string): string {
    return base64Url.replace(/-/g, '+').replace(/_/g, '/');
  }

  /**
   * Authenticate with email and password using Keycloak Resource Owner Password Credentials flow
   */
  async authenticateWithCredentials(email: string, password: string): Promise<string> {
    const tokenUrl = `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    // Use the frontend client ID for password grant (it has directAccessGrantsEnabled: true)
    const clientId = this.configService.get<string>('app.keycloak.frontendClientId', 'kuph-frontend');
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'password');
    params.append('username', email);
    params.append('password', password);
    params.append('scope', 'openid profile email');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Keycloak authentication failed: ${error}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  /**
   * Create a new user in Keycloak admin API
   */
  async createKeycloakUser(email: string, password: string, name?: string): Promise<void> {
    // Get admin token
    const adminToken = await this.getAdminToken();
    console.log(`Creating Keycloak user: ${email} with name: ${name || 'N/A'}`);
    // Create user
    const userUrl = `${this.authServerUrl}/admin/realms/${this.realm}/users`;
    const response = await fetch(userUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: email,
        email,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        enabled: true,
        emailVerified: true,
        requiredActions: [],
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: false,
          },
        ],
      }),
    });
    console.log(`Keycloak user creation response status: ${response.status}`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Keycloak user: ${error}`);
    }
  }

  /**
   * Get admin token for Keycloak admin API
   */
  private async getAdminToken(): Promise<string> {
    const tokenUrl = `${this.authServerUrl}/realms/master/protocol/openid-connect/token`;
    const adminUsername = this.configService.get<string>('app.keycloak.adminUsername', 'admin');
    const adminPassword = this.configService.get<string>('app.keycloak.adminPassword', 'admin');

    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('grant_type', 'password');
    params.append('username', adminUsername);
    params.append('password', adminPassword);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get admin token from Keycloak: ${errorText}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  /**
   * Logout from Keycloak, invalidating the token session.
   * Calls Keycloak's logout endpoint with the refresh_token if available.
   */
  async logout(token: string): Promise<void> {
    const logoutUrl = `${this.authServerUrl}/realms/${this.realm}/protocol/openid-connect/logout`;
    const clientId = this.configService.get<string>('app.keycloak.frontendClientId', 'kuph-frontend');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('refresh_token', token);

    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      // Log but don't throw - session invalidation is best-effort
      console.warn(`Keycloak logout returned status ${response.status}`);
    }
  }

  /**
   * Send forgot-password email via Keycloak's admin API.
   * This triggers Keycloak's built-in password reset email flow.
   */
  async forgotPassword(email: string): Promise<void> {
    // Get admin token
    const adminToken = await this.getAdminToken();

    // Find user by email in Keycloak
    const usersUrl = `${this.authServerUrl}/admin/realms/${this.realm}/users?email=${encodeURIComponent(email)}`;
    const usersResponse = await fetch(usersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (!usersResponse.ok) {
      throw new Error('Failed to look up user in Keycloak');
    }

    const users = (await usersResponse.json()) as Array<{ id: string }>;

    if (users.length === 0) {
      // Don't reveal whether the user exists for security
      return;
    }

    const userId = users[0].id;

    // Trigger password reset email via Keycloak's execute-actions-email
    const actionUrl = `${this.authServerUrl}/admin/realms/${this.realm}/users/${userId}/execute-actions-email`;
    const actionResponse = await fetch(actionUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(['UPDATE_PASSWORD']),
    });

    if (!actionResponse.ok) {
      throw new Error('Failed to trigger password reset email');
    }
  }
}

import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface KeycloakUser {
  id: string;
  email: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
}

/**
 * Mock Keycloak Adapter for development
 * Simulates Keycloak token generation and validation without requiring a running server
 */
@Injectable()
export class KeycloakAdapterMock {
  private users: Map<string, KeycloakUser & { password: string }> = new Map();
  private secret = 'mock-keycloak-secret-key-for-development';
  private userId = 0;

  constructor() {
    // Initialize with a test user
    this.createKeycloakUser('test123@example.com', 'TestPassword123', 'Test User').catch(err => {
      console.error('[KeycloakAdapterMock] Failed to create test user:', err);
    });
  }

  async authenticateWithCredentials(email: string, password: string) {
    const user = this.users.get(email.toLowerCase());
    
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }

    return {
      access_token: this.generateToken(user),
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }

  async createKeycloakUser(email: string, password: string, name: string) {
    const existingUser = this.users.get(email.toLowerCase());
    if (existingUser) {
      throw new Error('User already exists');
    }

    const userId = `user-${++this.userId}`;
    const user: KeycloakUser & { password: string } = {
      id: userId,
      email,
      password,
      preferred_username: email,
      given_name: name.split(' ')[0],
      family_name: name.split(' ').slice(1).join(' '),
      email_verified: true,
    };

    this.users.set(email.toLowerCase(), user);

    return {
      access_token: this.generateToken(user),
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: 'mock-keycloak',
        audience: 'kuph-backend',
      }) as any;

      return {
        sub: decoded.sub,
        email: decoded.email,
        preferred_username: decoded.preferred_username,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        email_verified: decoded.email_verified !== false,
      };
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  async logout(token: string) {
    // Mock implementation - just return success
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = this.users.get(email.toLowerCase());
    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }

    // In real implementation, send password reset email
    console.log(`[KeycloakAdapterMock] Password reset requested for ${email}`);
    return { success: true };
  }

  /**
   * Generate a mock JWT token
   */
  private generateToken(user: KeycloakUser): string {
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        preferred_username: user.preferred_username,
        given_name: user.given_name,
        family_name: user.family_name,
        email_verified: user.email_verified,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'mock-keycloak',
        aud: 'kuph-backend',
      },
      this.secret,
      {
        algorithm: 'HS256',
      },
    );

    return token;
  }
}

import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AuthServiceProvider } from './adapters/auth-service-provider.interface';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE_PROVIDER')
    private readonly authProvider: AuthServiceProvider,
    private readonly userService: UserService,
  ) {}

  /**
   * Return the public Keycloak configuration so the frontend
   * knows where to redirect for login.
   */
  getKeycloakConfig() {
    return this.authProvider.getPublicConfig();
  }

  /**
   * Verify a JWT sent from the frontend and return the user profile.
   * Creates a local user record on first encounter (if database available).
   */
  async verifyTokenAndGetUser(token: string): Promise<{ id: string; email: string; name?: string }> {
    let decoded: Record<string, unknown>;
    try {
      decoded = await this.authProvider.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const email =
      (decoded.email as string) ||
      (decoded.preferred_username as string) ||
      '';
    const name =
      (decoded.name as string) ||
      `${(decoded.given_name as string) || ''} ${(decoded.family_name as string) || ''}`.trim() ||
      undefined;
    const authProviderId = (decoded.sub as string) || email;

    if (!email) {
      throw new UnauthorizedException('Token does not contain an email address');
    }

    // Try to find or create user in database, but don't fail if database is unavailable
    try {
      let user = await this.userService.findByEmail(email);
      if (!user) {
        user = await this.userService.create({
          email,
          authProvider: 'keycloak',
          authProviderId,
        });
      }
      return { id: user.id, email: user.email, name };
    } catch (error) {
      // Database error - still return the user info from the token
      console.warn('Database unavailable for user lookup, using token claims:', error);
      return { 
        id: authProviderId, 
        email, 
        name 
      };
    }
  }

  /**
   * Legacy alias for backwards compatibility
   */
  async me(token: string): Promise<{ id: string; email: string; name?: string }> {
    return this.verifyTokenAndGetUser(token);
  }

  /**
   * Login with email and password credentials.
   * Calls Keycloak token endpoint directly and returns the token and user profile.
   */
  async loginWithCredentials(email: string, password: string): Promise<{ access_token: string; user: { id: string; email: string; name?: string } }> {
    try {
      const token = await this.authProvider.authenticateWithCredentials(email, password);
      const user = await this.verifyTokenAndGetUser(token);
      return { access_token: token, user };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('invalid_grant') || msg.includes('Invalid user credentials') || msg.includes('authentication failed')) {
        throw new UnauthorizedException('Invalid email or password. Please check your credentials.');
      }
      throw new UnauthorizedException(msg || 'Authentication failed');
    }
  }

  /**
   * Signup with email, password, and optional name.
   * Creates the user in Keycloak, then logs them in automatically.
   */
  async signupWithCredentials(email: string, password: string, name?: string): Promise<{ access_token: string; user: { id: string; email: string; name?: string } }> {
    let userCreated = false;
    let userAlreadyExisted = false;

    try {
      // Create user in Keycloak admin API
      await this.authProvider.createKeycloakUser(email, password, name);
      userCreated = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('user exists') || errorMessage.includes('conflict') || errorMessage.includes('duplicate')) {
        userAlreadyExisted = true;
      } else {
        throw new UnauthorizedException(`Signup failed: ${error instanceof Error ? error.message : 'Unable to create user'}`);
      }
    }
    
    // Login with the credentials
    try {
      const token = await this.authProvider.authenticateWithCredentials(email, password);
      const user = await this.verifyTokenAndGetUser(token);
      return { access_token: token, user };
    } catch (error) {
      if (userAlreadyExisted) {
        throw new UnauthorizedException('An account with this email already exists. Please check your password or sign in.');
      }
      if (userCreated) {
        throw new UnauthorizedException('Account created successfully, but automatic login failed. Please sign in with your password.');
      }
      throw new UnauthorizedException('Failed to authenticate newly created user.');
    }
  }

  /**
   * Logout from Keycloak, invalidating the session.
   */
  async logout(token: string): Promise<void> {
    await this.authProvider.logout(token);
  }

  /**
   * Send forgot-password email via Keycloak.
   */
  async forgotPassword(email: string): Promise<void> {
    await this.authProvider.forgotPassword(email);
  }
}

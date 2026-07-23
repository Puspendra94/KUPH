import {
  Controller,
  Get,
  Post,
  Headers,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Returns the public Keycloak configuration for the frontend SPA client.
   */
  @Get('keycloak-config')
  getKeycloakConfig() {
    return this.authService.getKeycloakConfig();
  }

  /**
   * Login endpoint - exchanges email/password for a Keycloak token.
   * Called by the frontend form submission.
   */
  @Post('login')
  async login(@Body() loginRequest: LoginRequest) {
    const { email, password } = loginRequest;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    return this.authService.loginWithCredentials(email, password);
  }

  /**
   * Signup endpoint - creates a new user in Keycloak and returns a token.
   * Called by the frontend registration form.
   */
  @Post('signup')
  async signup(@Body() signupRequest: SignupRequest) {
    
    const { email, password, name } = signupRequest;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    console.log('Signup request received:', signupRequest);
    return this.authService.signupWithCredentials(email, password, name);
  }

  /**
   * Logout endpoint - invalidates the Keycloak session.
   */
  @Post('logout')
  async logout(
    @Headers('authorization') authHeader?: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    await this.authService.logout(token);
    return { message: 'Logged out successfully' };
  }

  /**
   * Forgot password endpoint - triggers password reset email via Keycloak.
   */
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;
    if (!email) {
      throw new UnauthorizedException('Email is required');
    }

    // Always return success to not reveal whether the email exists
    await this.authService.forgotPassword(email);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  /**
   * Validates the JWT token and returns the user profile.
   * Creates a local user record on first login/signup.
   */
  @Post('verify-token')
  async verifyToken(
    @Headers('authorization') authHeader?: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    return this.authService.verifyTokenAndGetUser(token);
  }

  /**
   * Legacy endpoint for compatibility
   */
  @Get('me')
  async me(
    @Headers('authorization') authHeader?: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    return this.authService.verifyTokenAndGetUser(token);
  }
}

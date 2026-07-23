import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { AuthServiceProvider } from '../../auth/adapters/auth-service-provider.interface';

// Extend the Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    roles?: string[];
    agencyId?: string;
  };
}

@Injectable()
export class AgencyAuthGuard implements CanActivate {
  private authProvider!: AuthServiceProvider;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly moduleRef: ModuleRef,
  ) {}

  private async getAuthProvider(): Promise<AuthServiceProvider> {
    if (!this.authProvider) {
      this.authProvider = this.moduleRef.get<AuthServiceProvider>('AUTH_SERVICE_PROVIDER', { strict: false });
    }
    return this.authProvider;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context
      .switchToHttp()
      .getRequest();

    // 1. Extract JWT from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const authProvider = await this.getAuthProvider();

    // 2. Validate the JWT against Keycloak's JWKS endpoint
    let decodedToken: Record<string, unknown>;
    try {
      decodedToken = await authProvider.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = (decodedToken.sub as string) || (decodedToken.id as string);
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 3. Extract agency_id from request params or body
    const agencyId: string | undefined =
      request.params?.agency_id ||
      request.body?.agency_id ||
      (request.query?.agency_id as string);

    if (!agencyId) {
      throw new ForbiddenException('Agency ID is required');
    }

    // 4. Check if the user is a member of that agency via AgencyMember
    const agencyMember = await this.dataSource
      .getRepository('AgencyMember')
      .findOne({
        where: {
          user: { id: userId },
          agency: { id: agencyId },
        },
        relations: ['agency', 'agency.currentPlan'],
        order: { createdAt: 'ASC' },
      });

    if (!agencyMember) {
      throw new ForbiddenException('User is not a member of this agency');
    }

    const isAdmin = agencyMember.role === 'admin';

    // 5. If not admin, enforce seat limits
    if (!isAdmin) {
      const plan = agencyMember.agency?.currentPlan;
      if (plan && plan.maxSeats) {
        // Get all members ordered by created_at to determine seat position
        const allMembers = await this.dataSource
          .getRepository('AgencyMember')
          .find({
            where: { agency: { id: agencyId } },
            order: { createdAt: 'ASC' },
            select: ['id', 'userId', 'createdAt'],
          });

        // Find the index of the current user
        const userIndex = allMembers.findIndex(
          (m) => m.userId === userId,
        );

        // If user's index >= max_seats, they exceed the seat limit
        if (userIndex >= plan.maxSeats) {
          throw new ForbiddenException(
            'Seat limit exceeded for this plan. Please upgrade your plan to add more members.',
          );
        }
      }
    }

    // Attach user info to request
    request.user = {
      id: userId,
      email: (decodedToken.email as string) || (decodedToken.preferred_username as string),
      roles: agencyMember.role ? [agencyMember.role] : [],
      agencyId,
    };

    return true;
  }
}
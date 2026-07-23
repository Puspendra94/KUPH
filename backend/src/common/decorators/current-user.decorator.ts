import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface CurrentUser {
  id: string;
  email?: string;
  roles?: string[];
  agencyId?: string;
}

function resolveAgencyId(request: Request & { user?: CurrentUser }) {
  const fromParams = request.params?.agency_id;
  const fromBody = typeof request.body === 'object' ? request.body?.agency_id : undefined;
  const fromQuery = request.query?.agency_id;
  const fromHeader = request.headers['x-agency-id'];

  return (
    (fromParams as string | undefined) ||
    (fromBody as string | undefined) ||
    (fromQuery as string | undefined) ||
    (fromHeader as string | undefined) ||
    process.env.DEFAULT_AGENCY_ID ||
    'default-agency'
  );
}

function resolveUserFromHeader(request: Request & { user?: CurrentUser }) {
  const authHeader = request.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as Record<string, unknown> | null;
    if (!decoded) {
      return undefined;
    }

    return {
      id: (decoded.sub as string) || (decoded.id as string) || 'unknown-user',
      email: (decoded.email as string) || (decoded.preferred_username as string),
      roles: [],
      agencyId: resolveAgencyId(request),
    } satisfies CurrentUser;
  } catch {
    return undefined;
  }
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext) => {
    const request: Request & { user?: CurrentUser } = ctx
      .switchToHttp()
      .getRequest();

    const user = request.user ?? resolveUserFromHeader(request);

    if (!user) {
      return undefined;
    }

    // If a specific field is requested, return only that field
    if (data) {
      return user[data];
    }

    // Otherwise return the full user object
    return user;
  },
);

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  mixin,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Request } from 'express';

interface AgencyRequest extends Request {
  agency?: { id: string };
  user?: { id: string; agencyId?: string };
}

export const FeatureGuard = (featureKey: string) => {
  @Injectable()
  class FeatureGuardMixin implements CanActivate {
    @InjectDataSource() public readonly dataSource!: DataSource;

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request: AgencyRequest = context.switchToHttp().getRequest();

      // Determine agency_id from request
      const agencyId: string | undefined =
        request.params?.agency_id ||
        request.body?.agency_id ||
        (request.query?.agency_id as string) ||
        request.user?.agencyId ||
        request.agency?.id;

      if (!agencyId) {
        throw new ForbiddenException('Agency ID is required');
      }

      // Fetch the agency with its plan
      const agency = await this.dataSource
        .getRepository('Agency')

        .findOne({
          where: { id: agencyId },
          relations: ['currentPlan'],
        });

      if (!agency?.currentPlan) {
        throw new ForbiddenException('Agency does not have an active plan');
      }

      // Check if the plan has the required feature
      const planFeature = await this.dataSource
        .getRepository('PlanFeature')
        .findOne({
          where: {
            plan: { id: agency.currentPlan.id },
            featureKey: featureKey,
          },
        });

      if (!planFeature) {
        throw new ForbiddenException(
          `Plan does not include the required feature: ${featureKey}`,
        );
      }

      return true;
    }
  }

  return mixin(FeatureGuardMixin);
};
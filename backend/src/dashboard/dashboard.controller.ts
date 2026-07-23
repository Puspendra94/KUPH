import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @Req() req: Request,
    @CurrentUser() user?: { id: string; agencyId?: string },
  ) {
    const agencyId =
      user?.agencyId ||
      (req.query?.agency_id as string) ||
      process.env.DEFAULT_AGENCY_ID ||
      'default-agency';
    return this.dashboardService.getStats(agencyId);
  }
}
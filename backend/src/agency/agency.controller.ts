import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { OnboardAgencyDto } from './dto/onboard-agency.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Get('agency/me')
  async getMyAgency(@CurrentUser('id') userId: string) {
    return this.agencyService.getAgencyForUser(userId);
  }

  @Put('agency/me')
  async updateMyAgency(
    @Body('name') name: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.agencyService.updateAgencyName(userId, name);
  }

  @Get('agency/members')
  async getMembers(@CurrentUser('id') userId: string) {
    return this.agencyService.getMembersForUser(userId);
  }

  @Post('agency/invite')
  async sendInvite(
    @Body('email') email: string,
    @CurrentUser('id') userId: string,
  ) {
    const agency = await this.agencyService.getAgencyForUser(userId);
    return this.agencyService.createInvite(agency.id, email);
  }

  @Get('agency/activity-log')
  async getActivityLogs(@CurrentUser('id') userId: string) {
    return this.agencyService.getActivityLogsForUser(userId);
  }

  @Post('agency/onboard')
  async onboard(
    @Body() dto: OnboardAgencyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.agencyService.onboardAgency(userId, dto.agencyName);
  }

  @Get('team/invites/lookup')
  async lookupInvite(@Query('code') code: string) {
    return this.agencyService.resolveInvite(code);
  }

  @Post('team/invites/accept')
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.agencyService.acceptInvite(userId, dto.token);
  }
}

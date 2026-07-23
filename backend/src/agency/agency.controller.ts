import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { OnboardAgencyDto } from './dto/onboard-agency.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

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

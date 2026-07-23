import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  async create(
    @Body() data: Record<string, unknown>,
    @Req() req: Request,
    @CurrentUser() user?: { id: string; agencyId?: string },
  ) {
    const agencyId = user?.agencyId || (req.query?.agency_id as string) || process.env.DEFAULT_AGENCY_ID || 'default-agency';
    return this.campaignService.create(agencyId, data);
  }

  @Get()
  async findAll(@Req() req: Request, @CurrentUser() user?: { id: string; agencyId?: string }) {
    const agencyId = user?.agencyId || (req.query?.agency_id as string) || process.env.DEFAULT_AGENCY_ID || 'default-agency';
    return this.campaignService.findAll(agencyId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.campaignService.findById(id);
  }

  @Post(':id/shortlist/share')
  async shareShortlist(
    @Param('id') id: string,
    @Body() shortlistData: { influencerIds: string[] },
  ) {
    return this.campaignService.shareShortlist(id, shortlistData);
  }

  @Patch(':id/deals/:dealId/status')
  async updateDealStatus(
    @Param('id') id: string,
    @Param('dealId') dealId: string,
    @Body('status') status: string,
  ) {
    return this.campaignService.updateDealStatus(id, dealId, status);
  }
}

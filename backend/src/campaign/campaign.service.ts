import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignShortlist } from './entities/campaign-shortlist.entity';
import { Deal } from './entities/deal.entity';
import { CampaignStatus } from './entities/campaign-status.enum';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignShortlist)
    private readonly shortlistRepository: Repository<CampaignShortlist>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
  ) {}

  async create(agencyId: string, data: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...data,
      agencyId,
      status: CampaignStatus.DRAFT,
    });
    return this.campaignRepository.save(campaign);
  }

  async findAll(agencyId: string): Promise<Campaign[]> {
    const safeAgencyId = agencyId || process.env.DEFAULT_AGENCY_ID || 'default-agency';
    return this.campaignRepository.find({
      where: { agencyId: safeAgencyId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with id ${id} not found`);
    }
    return campaign;
  }

  async shareShortlist(
    campaignId: string,
    shortlistData: { influencerIds: string[] },
  ): Promise<{ shared: number }> {
    let shared = 0;
    for (const influencerId of shortlistData.influencerIds) {
      const existing = await this.shortlistRepository.findOne({
        where: { campaignId, influencerId },
      });
      if (!existing) {
        const entry = this.shortlistRepository.create({
          campaignId,
          influencerId,
        });
        await this.shortlistRepository.save(entry);
        shared++;
      }
    }
    return { shared };
  }

  async updateDealStatus(
    campaignId: string,
    dealId: string,
    status: string,
  ): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id: dealId, campaignId },
    });
    if (!deal) {
      throw new NotFoundException(
        `Deal with id ${dealId} not found in campaign ${campaignId}`,
      );
    }
    deal.workflowStatus = status as any;
    return this.dealRepository.save(deal);
  }
}

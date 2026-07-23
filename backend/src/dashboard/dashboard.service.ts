import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Client } from '../crm/entities/client.entity';
import { Influencer } from '../crm/entities/influencer.entity';
import { CampaignStatus } from '../campaign/entities/campaign-status.enum';

export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  completedCampaigns: number;
  totalInfluencers: number;
  totalClients: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Influencer)
    private readonly influencerRepository: Repository<Influencer>,
  ) {}

  async getStats(agencyId: string): Promise<DashboardStats> {
    const safeAgencyId = agencyId || process.env.DEFAULT_AGENCY_ID || 'default-agency';

    const [totalCampaigns, activeCampaigns, draftCampaigns, completedCampaigns] =
      await Promise.all([
        this.campaignRepository.count({ where: { agencyId: safeAgencyId } }),
        this.campaignRepository.count({
          where: { agencyId: safeAgencyId, status: CampaignStatus.ACTIVE },
        }),
        this.campaignRepository.count({
          where: { agencyId: safeAgencyId, status: CampaignStatus.DRAFT },
        }),
        this.campaignRepository.count({
          where: { agencyId: safeAgencyId, status: CampaignStatus.COMPLETED },
        }),
      ]);

    const [totalInfluencers, totalClients] = await Promise.all([
      this.influencerRepository.count({ where: { agencyId: safeAgencyId } }),
      this.clientRepository.count({ where: { agencyId: safeAgencyId } }),
    ]);

    return {
      totalCampaigns,
      activeCampaigns,
      draftCampaigns,
      completedCampaigns,
      totalInfluencers,
      totalClients,
    };
  }
}
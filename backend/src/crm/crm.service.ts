import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { Influencer } from './entities/influencer.entity';
import { CrmEntityType } from './entities/crm-entity-type.enum';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Influencer)
    private readonly influencerRepository: Repository<Influencer>,
  ) {}

  async importExecute(
    agencyId: string,
    data: Record<string, string>[],
    entityType: string,
  ): Promise<{ imported: number }> {
    let imported = 0;

    if (entityType === CrmEntityType.INFLUENCER) {
      for (const item of data) {
        const customAttributes: Record<string, string> = {};
        for (const [key, value] of Object.entries(item)) {
          if (key !== 'name') {
            customAttributes[key] = value;
          }
        }

        const influencer = this.influencerRepository.create({
          agencyId,
          name: item.name || 'Unnamed Influencer',
          customAttributes,
        });
        await this.influencerRepository.save(influencer);
        imported++;
      }
    } else if (entityType === CrmEntityType.BRAND) {
      for (const item of data) {
        const customAttributes: Record<string, string> = {};
        for (const [key, value] of Object.entries(item)) {
          if (key !== 'name') {
            customAttributes[key] = value;
          }
        }

        const client = this.clientRepository.create({
          agencyId,
          name: item.name || 'Unnamed Client',
          customAttributes,
        });
        await this.clientRepository.save(client);
        imported++;
      }
    } else {
      throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }

    return { imported };
  }

  async getInfluencers(
    agencyId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Influencer>> {
    const safeAgencyId = agencyId || process.env.DEFAULT_AGENCY_ID || 'default-agency';
    const skip = (page - 1) * limit;

    const [data, total] = await this.influencerRepository.findAndCount({
      where: { agencyId: safeAgencyId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getClients(
    agencyId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Client>> {
    const safeAgencyId = agencyId || process.env.DEFAULT_AGENCY_ID || 'default-agency';
    const skip = (page - 1) * limit;

    const [data, total] = await this.clientRepository.findAndCount({
      where: { agencyId: safeAgencyId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../campaign/entities/campaign.entity';
import { Client } from '../crm/entities/client.entity';
import { Influencer } from '../crm/entities/influencer.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Client, Influencer])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
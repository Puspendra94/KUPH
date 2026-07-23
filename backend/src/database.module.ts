import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { User } from './user/entities/user.entity';
import { Plan } from './subscription/entities/plan.entity';
import { PlanFeature } from './subscription/entities/plan-feature.entity';
import { Agency } from './agency/entities/agency.entity';
import { AgencyMember } from './agency/entities/agency-member.entity';
import { AgencyInvite } from './agency/entities/agency-invite.entity';
import { NotificationPref } from './agency/entities/notification-pref.entity';
import { ActivityLog } from './agency/entities/activity-log.entity';
import { EntityConfig } from './crm/entities/entity-config.entity';
import { Client } from './crm/entities/client.entity';
import { Influencer } from './crm/entities/influencer.entity';
import { Campaign } from './campaign/entities/campaign.entity';
import { CampaignShortlist } from './campaign/entities/campaign-shortlist.entity';
import { Deal } from './campaign/entities/deal.entity';

const entities = [
  User,
  Plan,
  PlanFeature,
  Agency,
  AgencyMember,
  AgencyInvite,
  NotificationPref,
  ActivityLog,
  EntityConfig,
  Client,
  Influencer,
  Campaign,
  CampaignShortlist,
  Deal,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const host = configService.get<string>('app.database.host');
        const port = configService.get<number>('app.database.port');
        
        logger.log(`Attempting to connect to database at ${host}:${port}`);
        
        return {
          type: 'postgres',
          host,
          port,
          username: configService.get<string>('app.database.username'),
          password: configService.get<string>('app.database.password'),
          database: configService.get<string>('app.database.database'),
          schema: configService.get<string>('app.database.schema'),
          entities,
          synchronize: false,
          logging: false,
          retryAttempts: 3,
          retryDelay: 2000,
          maxQueryExecutionTime: 1000,
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
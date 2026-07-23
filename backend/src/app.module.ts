import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/app.config';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth/auth.module';
// import { AgencyModule } from './agency/agency.module';
import { CrmModule } from './crm/crm.module';
import { CampaignModule } from './campaign/campaign.module';
import { DashboardModule } from './dashboard/dashboard.module';
// import { NotificationModule } from './notification/notification.module';
// import { StorageModule } from './storage/storage.module';
// import { SubscriptionModule } from './subscription/subscription.module';
// import { UserModule } from './user/user.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      },
    }),
    SharedModule,
    DatabaseModule,
    AuthModule,
    // AgencyModule,
    CrmModule,
    CampaignModule,
    DashboardModule,
    // NotificationModule,
    // StorageModule,
    // SubscriptionModule,
    // UserModule,
  ],
})
export class AppModule {}

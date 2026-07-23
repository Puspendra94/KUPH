import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agency } from './entities/agency.entity';
import { AgencyMember } from './entities/agency-member.entity';
import { AgencyInvite } from './entities/agency-invite.entity';
import { NotificationPref } from './entities/notification-pref.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { AgencyService } from './agency.service';
import { AgencyController } from './agency.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agency,
      AgencyMember,
      AgencyInvite,
      NotificationPref,
      ActivityLog,
    ]),
    UserModule,
  ],
  providers: [AgencyService],
  controllers: [AgencyController],
  exports: [AgencyService],
})
export class AgencyModule {}

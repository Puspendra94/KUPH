import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Agency } from './entities/agency.entity';
import { AgencyMember } from './entities/agency-member.entity';
import { AgencyInvite } from './entities/agency-invite.entity';
import { AgencyRole } from './entities/agency-role.enum';
import { UserService } from '../user/user.service';

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
    @InjectRepository(AgencyMember)
    private readonly agencyMemberRepository: Repository<AgencyMember>,
    @InjectRepository(AgencyInvite)
    private readonly agencyInviteRepository: Repository<AgencyInvite>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly userService: UserService,
  ) {}

  async getAgencyForUser(userId: string): Promise<Agency> {
    const member = await this.agencyMemberRepository.findOne({
      where: { userId },
      relations: ['agency'],
    });

    if (member?.agency) {
      return member.agency;
    }

    // Auto-onboard default agency if none exists
    const onboarded = await this.onboardAgency(userId, 'My Agency');
    return onboarded.agency;
  }

  async updateAgencyName(userId: string, name: string): Promise<Agency> {
    const agency = await this.getAgencyForUser(userId);
    agency.name = name;
    return this.agencyRepository.save(agency);
  }

  async getMembersForUser(userId: string): Promise<AgencyMember[]> {
    const agency = await this.getAgencyForUser(userId);
    return this.agencyMemberRepository.find({
      where: { agencyId: agency.id },
      relations: ['user'],
    });
  }

  async getActivityLogsForUser(userId: string): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async onboardAgency(
    userId: string,
    agencyName: string,
  ): Promise<{ agency: Agency; member: AgencyMember }> {
    let user = await this.userService.findById(userId);
    if (!user) {
      // Auto-provision user record from auth payload if missing
      user = await this.userService.createUser({
        email: `user_${userId.slice(0, 8)}@kuph.app`,
        role: 'user',
      });
    }

    // Create the agency
    const agency = this.agencyRepository.create({ name: agencyName });
    const savedAgency = await this.agencyRepository.save(agency);

    // Add the user as admin member
    const member = this.agencyMemberRepository.create({
      userId: user.id,
      agencyId: savedAgency.id,
      role: AgencyRole.ADMIN,
    });
    const savedMember = await this.agencyMemberRepository.save(member);

    return { agency: savedAgency, member: savedMember };
  }

  async getMembers(agencyId: string): Promise<AgencyMember[]> {
    const members = await this.agencyMemberRepository.find({
      where: { agencyId },
      relations: ['user'],
    });

    if (!members.length) {
      throw new NotFoundException('No members found for this agency');
    }

    return members;
  }

  async createInvite(
    agencyId: string,
    email: string,
  ): Promise<AgencyInvite> {
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = this.agencyInviteRepository.create({
      agencyId,
      email,
      token,
      expiresAt,
    });

    return this.agencyInviteRepository.save(invite);
  }

  async resolveInvite(token: string): Promise<AgencyInvite> {
    const invite = await this.agencyInviteRepository.findOne({
      where: { token },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('Invite has expired');
    }

    return invite;
  }

  async acceptInvite(userId: string, token: string): Promise<AgencyMember> {
    const invite = await this.resolveInvite(token);
    const agencyId = invite.agencyId || invite.id;

    // Check if user is already a member of this agency
    const existingMember = await this.agencyMemberRepository.findOne({
      where: { userId, agencyId },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this agency');
    }

    // Create the membership
    const member = this.agencyMemberRepository.create({
      userId,
      agencyId,
      role: AgencyRole.MEMBER,
    });

    return this.agencyMemberRepository.save(member);
  }
}

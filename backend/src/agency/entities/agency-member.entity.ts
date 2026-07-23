import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Agency } from './agency.entity';
import { AgencyRole } from './agency-role.enum';

@Entity('agency_members')
export class AgencyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'agency_id' })
  agencyId: string;

  @ManyToOne(() => Agency, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency: Agency;

  @Column({ type: 'enum', enum: AgencyRole, default: AgencyRole.MEMBER })
  role: AgencyRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

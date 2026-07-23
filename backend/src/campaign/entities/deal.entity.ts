import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Influencer } from '../../crm/entities/influencer.entity';
import { WorkflowStatus } from './workflow-status.enum';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'influencer_id' })
  influencerId: string;

  @ManyToOne(() => Influencer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencer_id' })
  influencer: Influencer;

  @Column({ name: 'agreed_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  agreedPrice: number;

  @Column({ name: 'workflow_status', type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.OUTREACH })
  workflowStatus: WorkflowStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

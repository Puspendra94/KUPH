import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CrmEntityType } from './crm-entity-type.enum';

@Entity('entity_configs')
export class EntityConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'enum', enum: CrmEntityType })
  entityType: CrmEntityType;

  @Column({ name: 'field_name' })
  fieldName: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'data_type' })
  dataType: string;

  @Column({ name: 'is_required' })
  isRequired: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

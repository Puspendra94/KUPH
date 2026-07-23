import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnumTypes1700000000000 implements MigrationInterface {
  name = 'CreateEnumTypes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Set the search path to the kuph schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS kuph`);
    await queryRunner.query(`SET search_path TO kuph, public`);

    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE kuph.agency_plan AS ENUM ('free', 'pro', 'max');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE kuph.agency_role AS ENUM ('admin', 'member', 'viewer');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE kuph.crm_entity_type AS ENUM ('influencer', 'brand');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE kuph.campaign_status AS ENUM ('Draft', 'Active', 'Completed');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE kuph.pitch_status AS ENUM ('FILTERED', 'SHARED_WITH_BRAND', 'BRAND_APPROVED', 'BRAND_REJECTED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE kuph.workflow_status AS ENUM ('OUTREACH', 'NEGOTIATING', 'ASSETS_SHARED', 'DEMO_APPROVAL_INITIATED', 'DEMO_CHANGE_REQUESTED', 'DEMO_APPROVED', 'LINK_SHARED', 'VIDEO_APPROVED', 'LIVE', 'PAYMENT_PENDING', 'COMPLETED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO kuph, public`);
    await queryRunner.query(`DROP TYPE IF EXISTS kuph.workflow_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS kuph.pitch_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS kuph.campaign_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS kuph.crm_entity_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS kuph.agency_role`);
    await queryRunner.query(`DROP TYPE IF EXISTS kuph.agency_plan`);
  }
}
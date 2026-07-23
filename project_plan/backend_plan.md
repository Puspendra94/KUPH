# KUPH — Backend Master Plan

This document serves as the strict architectural blueprint for the KUPH backend. Generate code adhering exactly to these specifications. 

## 1. Stack & Infrastructure
* **Framework:** NestJS (Node.js/TypeScript).
* **Database:** PostgreSQL (running locally in Docker).
* **ORM:** TypeORM (Strict use of Repository pattern and Migrations).
* **Identity Provider (IdP):** Keycloak (Dockerized).
* **API Documentation:** NestJS Swagger (`@nestjs/swagger`).
* **Logging:** Pino (`nestjs-pino`) for structured JSON logging.
* **Email Service:** AWS SES (via `@aws-sdk/client-ses`) for sending Magic Links, invites, and alerts.
* **Storage:** AWS S3 (via `@aws-sdk/client-s3`) for hosting campaign assets (scripts, logos) and generating secure pre-signed download URLs.

## 2. Architectural Strategy: Modular Monolith
* Strict domain separation: `AuthModule`, `AgencyModule`, `CrmModule`, `CampaignModule`, `NotificationModule`, `StorageModule`.
* Modules must communicate via internal services/interfaces. **Do not write cross-domain database joins.**
* **Auth Decoupling:** Use an Adapter Pattern (`KeycloakAdapter` implementing a generic `AuthServiceProvider`). The frontend never talks to Keycloak directly. NestJS handles Keycloak token generation and returns a standardized KUPH JWT to the frontend.

## 3. Database Schema (TypeORM Entities)

### IAM, Subscriptions & Preferences
* **User:** `id` (UUID, PK), `auth_provider` (String, default 'keycloak'), `auth_provider_id` (String), `email` (String).
* **Plan:** `id` (UUID), `name` (String: Free, Pro, Max), `max_seats` (Int), `price` (Decimal).
* **PlanFeature:** `id` (UUID), `plan_id` (FK), `feature_key` (String).
* **Agency:** `id` (UUID, PK), `name` (String), `current_plan_id` (FK), `subscription_expires_at` (Timestamp, nullable).
* **AgencyMember:** `id` (UUID, PK), `user_id` (FK), `agency_id` (FK), `role` (Enum: admin, member, viewer), `created_at` (Timestamp). 
* **AgencyInvite:** `id` (UUID), `email` (String), `token` (String), `expires_at` (Timestamp).
* **NotificationPref:** `id` (UUID, PK), `user_id` (FK), `agency_id` (FK), `email_alerts_enabled` (Boolean, default true), `marketing_emails_enabled` (Boolean).
* **ActivityLog:** `id` (UUID), `entity_type` (String), `action` (String), `diff_json` (JSONB).

### CRM (Hybrid Schema)
* **EntityConfig:** `id` (UUID), `entity_type` (Enum: influencer, brand), `field_name` (String), `display_name` (String), `data_type` (String), `is_required` (Boolean).
* **Client:** `id` (UUID, PK), `agency_id` (FK), `name` (String), `custom_attributes` (JSONB).
* **Influencer:** `id` (UUID, PK), `agency_id` (FK), `name` (String), `custom_attributes` (JSONB).

### 3-Tier Campaign System
* **Campaign:** `id` (UUID, PK), `agency_id` (FK), `client_id` (FK), `name` (String), `brief` (Text), `target_metrics` (JSONB - stores min/max views, category, language), `status` (Enum: Draft, Active, Completed).
* **CampaignShortlist:** `id` (UUID, PK), `campaign_id` (FK), `influencer_id` (FK), `pitch_status` (Enum: FILTERED, SHARED_WITH_BRAND, BRAND_APPROVED, BRAND_REJECTED).
* **Deal:** `id` (UUID, PK), `campaign_id` (FK), `influencer_id` (FK), `agreed_price` (Decimal), `workflow_status` (Enum: OUTREACH, NEGOTIATING, ASSETS_SHARED, DEMO_APPROVAL_INITIATED, DEMO_CHANGE_REQUESTED, DEMO_APPROVED, LINK_SHARED, VIDEO_APPROVED, LIVE, PAYMENT_PENDING, COMPLETED).

## 4. Core Business Logic & API Endpoints

### A. Auth & Team Onboarding 
* **Google OAuth (Keycloak):** Configure the `KeycloakAdapter` to support Identity Brokering. The `/api/auth/login/google` endpoint returns the standard KUPH JWT once Keycloak verifies the Google token.
* **New User Bootstrap & Agency Creation:** 1. Registration via Email or Google creates the `User` record, but NO agency is created yet.
    2. Provide a `POST /api/agency/onboard` endpoint. The newly signed-up user hits this endpoint to submit their agency details.
    3. The backend executes a transaction to: Create the `Agency` (Plan: Free), insert the user into `AgencyMember` as `admin`, and create their default `NotificationPref` record.
* **Invite Resolution (Short Codes & Tokens):** * `GET /api/team/invites/lookup?code=xyz` (Validates short codes/tokens before login).
    * `POST /api/team/invites/accept` (Binds authenticated user to `AgencyMember` and deletes invite).

### B. Subscription Management
* **Feature Gating:** Create a `@UseGuards(FeatureGuard('feature_key'))` interceptor. 
* **Automated Downgrades:** Implement a `@Cron()` job checking for `subscription_expires_at < NOW()`. Update agency to Free plan and log to `ActivityLog`.
* **Seat Enforcement:** Inside `AgencyAuthGuard`, fetch `AgencyMember` ordered by `created_at`. If user's index > `Plan.max_seats`, throw `403 Forbidden`. Admins bypass this.

### C. CRM Bulk Import (2-Step Execution)
* **Endpoint:** `POST /api/crm/import/execute`
* **Execution:** Use Node streams to read the file row-by-row. Apply the mapping dictionary to keys, validate mapped data against `EntityConfig` via `class-validator`, and save to the `custom_attributes` JSONB column. 

### D. Campaign Workflow & The "Magic Link"
* **Generate Magic Link:** `POST /campaigns/:id/shortlist/share` -> Backend generates a JWT, constructs a Magic Link, and uses AWS SES to email the Brand. Updates `pitch_status` to `SHARED_WITH_BRAND`.
* **Brand Magic Link Access:** `GET /api/public/campaigns/magic/:token` -> Returns a read-only payload of the `CampaignShortlist`.
* **Brand Direct Approval:** `PATCH /api/public/campaigns/magic/:token/approve` -> Updates to `BRAND_APPROVED`, triggering automatic child `Deal` record generation.
* **Deal Feedback Loop:** `PATCH /campaigns/:id/deals/:deal_id/status` -> Updates `workflow_status`. Supports feedback notes for `DEMO_CHANGE_REQUESTED`.

## 5. API & Error Standardization
* **Interceptors:** A global `ResponseInterceptor` formatting all success outputs as `{ data, meta, message }`.
* **Exceptions:** A global `AllExceptionsFilter` catching TypeORM/HTTP errors and returning standardized JSON.
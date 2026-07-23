# KUPH Backend — NestJS Modular Monolith

[![NestJS](https://img.shields.io/badge/Framework-NestJS%2010-red?logo=nestjs)](https://nestjs.com/)
[![TypeORM](https://img.shields.io/badge/ORM-TypeORM%200.3-orange)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/Docs-Swagger%20OpenAPI-green?logo=swagger)](https://swagger.io/)

The **KUPH Backend** is built as a modular monolith in NestJS and TypeScript. It powers the RESTful APIs, identity authentication, multi-tenant agency management, 3-tier campaign workflows, client Magic Link authentication, hybrid schema CRM, activity audit logs, and subscription tier enforcement.

---

## 🏗 Domain Modules Architecture

The application source code ([`src/`](file:///Users/puspendrapandey/Documents/KUPH/backend/src)) is structured into decoupled domain modules:

| Module | Description | Core Responsibilities |
| :--- | :--- | :--- |
| [**AuthModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/auth) | Identity & Access Management | Keycloak IdP adapter, Google OAuth token exchange, KUPH JWT token issuance. |
| [**AgencyModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/agency) | Multi-tenant Agency Engine | Agency creation onboarding transaction, member roles (`admin`, `member`, `viewer`), invitation short codes, seat limits. |
| [**UserModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/user) | User Account Management | Profile metadata, notification preferences per agency. |
| [**CrmModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/crm) | Hybrid Dynamic CRM | Managing Influencers & Clients, custom attributes (`JSONB`), `EntityConfig` definitions, 2-step streamed CSV/Excel imports. |
| [**CampaignModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/campaign) | 3-Tier Campaign Engine | Managing `Campaign` briefs, `CampaignShortlist` selection, public **Magic Link** token verification, and 11-stage `Deal` pipeline. |
| [**SubscriptionModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/subscription) | Tier Gating & Seat Enforcement | `Free`, `Pro`, and `Max` feature guards (`@FeatureGuard`), seat cap validations, subscription expiration cron jobs. |
| [**NotificationModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/notification) | Email Dispatcher | Transactional emails via AWS SES (Magic Links, member invites, campaign status updates). |
| [**StorageModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/storage) | Cloud Asset Manager | AWS S3 asset upload, file validation, and pre-signed URL generation. |
| [**DashboardModule**](file:///Users/puspendrapandey/Documents/KUPH/backend/src/dashboard) | Analytics & Metrics Engine | Aggregate metrics, campaign statistics, deal conversion performance. |

---

## 🗄️ Database & Schema Design

Powered by PostgreSQL and TypeORM Repository pattern with strict migrations:

```text
       ┌──────────────┐          ┌─────────────────┐
       │   Agencies   │◄─────────┤  AgencyMembers  ├─────────┐
       └──────┬───────┘          └─────────────────┘         │
              │                                              │
              ├──► ┌─────────────┐                  ┌────────┴────────┐
              │    │   Clients   │                  │      Users      │
              │    └──────┬──────┘                  └─────────────────┘
              │           │
              ├──► ┌──────┴──────┐
              │    │  Campaigns  │
              │    └──────┬──────┘
              │           │
              ├──► ┌──────┴──────────────┐
              │    │  CampaignShortlists │
              │    └──────┬──────────────┘
              │           │
              └──► ┌──────┴──────┐                  ┌─────────────────┐
                   │    Deals    │◄─────────────────┤   Influencers   │
                   └─────────────┘                  └─────────────────┘
```

- **Dynamic CRM Fields**: `Influencer` and `Client` entities store agency-specific fields inside `custom_attributes` (`JSONB`).
- **Audit Logs**: `ActivityLog` entries are captured by PostgreSQL triggers computing column diffs on data changes.

---

## 🚦 Getting Started

### 1. Environment Configuration
Create your local configuration from `.env.example`:
```bash
cp .env.example .env
```

Ensure PostgreSQL and Keycloak credentials match your local container settings:
```env
APP_PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=postgres
DB_SCHEMA=kuph
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=kuph
```

### 2. Database Migrations
Generate & execute migrations:
```bash
# Execute pending migrations
npm run migration:run

# Revert previous migration
npm run migration:revert

# Generate new migration from entity changes
npm run migration:generate
```

### 3. Running the Server

```bash
# Development (with auto-reload)
npm run start:dev

# Debug mode
npm run start:debug

# Production build & start
npm run build
npm run start:prod
```

### 4. API Documentation
Once running, interactive Swagger API documentation is available at:
`http://localhost:3001/api/docs`

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Test coverage
npm run test:cov

# End-to-end integration tests
npm run test:e2e
```

# KUPH — Agency & Influencer Marketing Platform (Modular Monorepo)

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-red?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-purple?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)](https://www.postgresql.org/)
[![TypeORM](https://img.shields.io/badge/ORM-TypeORM-orange)](https://typeorm.io/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%203-cyan?logo=tailwindcss)](https://tailwindcss.com/)

**KUPH** is an enterprise-grade, modular monorepo platform designed for marketing agencies, brand managers, and influencer networks. It combines a dynamic CRM, multi-tenant agency management, 3-tier campaign workflow engine, client "Magic Link" sharing, activity auditing, and tier-based feature gating into a unified system.

---

## 📐 Monorepo Architecture & Directory Layout

The workspace is organized as a clean modular monorepo, separating backend micro-domains, full-stack frontend rendering, deployment infrastructure, and design documentation:

```text
KUPH/
├── backend/            # Modular monolith REST API (NestJS + TypeORM + PostgreSQL)
│   ├── src/
│   │   ├── agency/     # Multi-tenant agency onboarding, invitations, & seat caps
│   │   ├── auth/       # Identity provider adapter (Keycloak / Google OAuth + JWT)
│   │   ├── campaign/   # 3-tier campaign engine (Campaign -> Shortlist -> Deal)
│   │   ├── common/     # Global filters, interceptors, guards, and decorators
│   │   ├── config/     # NestJS environment configuration management
│   │   ├── crm/        # Dynamic hybrid schema CRM for Clients & Influencers
│   │   ├── dashboard/  # Analytics & reporting metrics engine
│   │   ├── notification/ # AWS SES email notifications & invitation triggers
│   │   ├── storage/    # AWS S3 campaign asset management & pre-signed URLs
│   │   ├── subscription/# Plan management (Free/Pro/Max) & feature gating
│   │   ├── user/       # User profiles & notification preferences
│   │   ├── database.module.ts # PostgreSQL & TypeORM database initialization
│   │   └── main.ts     # NestJS bootstrap entrypoint
│   ├── swagger.json    # OpenAPI 3.0 specification
│   └── package.json
│
├── frontend/           # Full-stack SPA & SSR server build (Vite + React 18)
│   ├── client/         # React SPA source code
│   │   ├── components/ # Radix UI, Shadcn, & custom dynamic UI components
│   │   ├── hooks/      # React hooks (usePlan, useCurrentAgency, etc.)
│   │   ├── lib/        # SW registration, auth utilities, API clients
│   │   └── pages/      # Route components & view layers
│   ├── server/         # Express production SSR / Node build adapter
│   ├── shared/         # Shared TypeScript schemas & API contract types
│   ├── netlify/        # Serverless edge function deployment configs
│   ├── tailwind.config.ts # TailwindCSS design tokens & plugins
│   ├── vite.config.ts  # Vite build tooling & PWA plugin setup
│   └── package.json
│
├── project_plan/       # Comprehensive architectural blueprints & domain specs
│   ├── project_plan.md # Master plan (Subscriptions, Audit logs, PWA, Settings)
│   ├── backend_plan.md # Backend architecture specification
│   ├── frontend_plan.md# Frontend architecture specification
│   └── devops_plan.md  # Infrastructure & deployment specification
│
└── devops/             # Container manifests (Docker, Kubernetes, CI/CD scripts)
```

---

## 🚀 Core Features & Business Logic

### 1. Multi-Tenant Agency Onboarding & Seat Enforcement
- **Transactional Onboarding**: New users bootstrap an agency with a single atomic transaction that sets up the agency, grants `admin` role to the creator, sets the `Free` plan, and configures default notification preferences.
- **Seat Limit Guards**: Automatic database triggers and NestJS route guards enforce seat caps per tier (e.g., `Free` tier capped at $\le 5$ team members). Attempting to invite excess members triggers a friendly upgrade CTA.

### 2. Hybrid Schema CRM & 2-Step Bulk Import
- **Hybrid Data Model**: Blends fixed relational columns with `JSONB` custom attributes for both Brands/Clients and Influencers.
- **Dynamic Field Configuration**: `EntityConfig` defines custom attributes, display types, and validation rules per agency.
- **Streamed CSV/Excel Import**: High-performance streaming parser maps external spreadsheet headers directly to `custom_attributes`, validating data with `class-validator`.

### 3. 3-Tier Campaign Engine & Brand "Magic Links"
- **Tier 1 — Campaign**: Defines brief, budget, target metrics (min/max views, categories, languages), and lifecycle status.
- **Tier 2 — Campaign Shortlist & Magic Links**: Influencers shortlisted for a campaign can be shared with brand clients via passwordless **Magic Links** (`/api/public/campaigns/magic/:token`). Brands review and directly approve/reject pitches without creating an account.
- **Tier 3 — Deal Workflow**: Brand approvals automatically transition candidates into active `Deal` pipeline records:
  $$\text{Outreach} \rightarrow \text{Negotiating} \rightarrow \text{Assets Shared} \rightarrow \text{Demo Approval} \rightarrow \text{Video Approved} \rightarrow \text{Live} \rightarrow \text{Payment Pending} \rightarrow \text{Completed}$$

### 4. Audit Logging & System Activity Triggers
- **Automated Audit Triggers**: PostgreSQL `AFTER INSERT/UPDATE/DELETE` triggers compute JSON column diffs across core domain tables (`influencers`, `clients`, `campaigns`, `agency_members`, etc.).
- **Plan Gated Viewing**: Audit log records are security-gated; accessible only to agencies on `Pro` or `Max` subscriptions.

### 5. Progressive Web App (PWA) & Offline Capabilities
- **Installable Desktop/Mobile App**: Built-in `manifest.webmanifest`, responsive layout guards, service worker cache strategies (`NetworkFirst` for HTML navigation, `CacheFirst` for hashed static assets).
- **Environment Safeguards**: Automatic service worker guard (`register-sw.ts`) prevents registration in local development, iframe contexts, or staging preview domains.

---

## 💎 Subscription Tier Matrix

Feature access across the platform is dynamically driven by the agency's active subscription tier:

| Feature | Free Tier | Pro Tier | Max Tier |
| :--- | :---: | :---: | :---: |
| **Influencer & Client CRM** | Unlimited | Unlimited | Unlimited |
| **Campaigns & Dashboards** | Unlimited | Unlimited | Unlimited |
| **CSV / Excel Import & Export** | Included | Included | Included |
| **Team Member Seat Limit** | $\le 5$ seats | Unlimited ($\infty$) | Unlimited ($\infty$) |
| **Team Member Invites** | Included | Included | Included |
| **Activity Audit Logs** | — | Included | Included |
| **Email Alerts & Notifications** | — | Included | Included |
| **Priority Support Badge** | — | Included | Included |
| **Agency-Wide In-App Chat** | — | — | Included |
| **AI-Powered Influencer Search** | — | — | Included |
| **Influencer Online Payouts** | — | — | Included |
| **Enterprise SSO (SAML/OIDC)** | — | — | Included |

---

## 🧰 Tech Stack Breakdown

### Backend Stack ([`backend`](file:///Users/puspendrapandey/Documents/KUPH/backend))
- **Framework**: [NestJS 10](https://nestjs.com/) (Express platform provider)
- **Database & ORM**: PostgreSQL with [TypeORM 0.3](https://typeorm.io/) (Repository pattern & migrations)
- **Identity Provider**: Keycloak Identity Brokering with custom NestJS `KeycloakAdapter`
- **File Storage**: AWS S3 via `@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`
- **Email Service**: AWS SES via `@aws-sdk/client-ses`
- **Logging & Diagnostics**: `nestjs-pino`, `pino-pretty`, and `morgan`
- **Validation**: `class-validator` & `class-transformer`

### Frontend Stack ([`frontend`](file:///Users/puspendrapandey/Documents/KUPH/frontend))
- **Build Tool**: [Vite 8](https://vitejs.dev/) with SWC React plugin (`@vitejs/plugin-react`)
- **UI Library**: [React 18](https://reactjs.org/) + [React Router DOM v6](https://reactrouter.com/)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query)
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/) + PostCSS + `@tailwindcss/typography`
- **Component Primitives**: [Radix UI](https://www.radix-ui.org/) (Dialog, Dropdown, Accordion, Popover, Select, Tabs, etc.)
- **Animations & 3D**: [Framer Motion](https://www.framer.com/motion/) + [Three.js](https://threejs.org/) / `@react-three/fiber`
- **Charts & Data Viz**: [Recharts](https://recharts.org/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 🛠️ Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `pnpm` (v10+ recommended) or `npm`
- **Docker**: Docker Desktop for local PostgreSQL and Keycloak containers

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   PORT=3000
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_NAME=kuph_db
   JWT_SECRET=your_super_secret_jwt_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=kuph-campaign-assets
   ```

5. Run database migrations:
   ```bash
   pnpm run migration:run
   ```

6. Start NestJS in development watch mode:
   ```bash
   pnpm run start:dev
   ```

   The backend server will launch on `http://localhost:3000`. Swagger documentation will be available at `http://localhost:3000/api/docs`.

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start Vite dev server:
   ```bash
   pnpm run dev
   ```

   The web app will run locally at `http://localhost:5173`.

4. Build for production (Client + Server SSR Adapter):
   ```bash
   pnpm run build
   ```

---

## 📑 NPM Scripts Reference

### Backend Scripts ([`backend/package.json`](file:///Users/puspendrapandey/Documents/KUPH/backend/package.json))

| Command | Description |
| :--- | :--- |
| `pnpm run start:dev` | Starts NestJS server in watch mode |
| `pnpm run build` | Compiles TypeScript into `/dist` |
| `pnpm run start:prod` | Runs compiled production server (`node dist/main`) |
| `pnpm run test` | Executes Jest unit tests |
| `pnpm run test:e2e` | Runs end-to-end integration tests |
| `pnpm run migration:generate` | Generates TypeORM migration based on entity changes |
| `pnpm run migration:run` | Executes pending database migrations |

### Frontend Scripts ([`frontend/package.json`](file:///Users/puspendrapandey/Documents/KUPH/frontend/package.json))

| Command | Description |
| :--- | :--- |
| `pnpm run dev` | Launches Vite local development server |
| `pnpm run build` | Builds both client bundle and server SSR adapter |
| `pnpm run build:client` | Builds Vite SPA client bundle (`dist/spa`) |
| `pnpm run build:server` | Builds SSR Node bundle (`dist/server/node-build.mjs`) |
| `pnpm run start` | Serves compiled Node build |
| `pnpm run test` | Executes Vitest test suite |
| `pnpm run typecheck` | Validates TypeScript types across frontend |

---

## 📖 Architecture & Design Documentation

For deep-dive architectural specifications, database schemas, and implementation details, refer to the files in the [`project_plan`](file:///Users/puspendrapandey/Documents/KUPH/project_plan) directory:

- [**Master Project Plan**](file:///Users/puspendrapandey/Documents/KUPH/project_plan/project_plan.md): Complete specifications for subscriptions, activity logs, PWA, and settings reorganization.
- [**Backend Master Blueprint**](file:///Users/puspendrapandey/Documents/KUPH/project_plan/backend_plan.md): TypeORM entity designs, Keycloak adapter details, and API endpoint reference.
- [**Frontend Master Blueprint**](file:///Users/puspendrapandey/Documents/KUPH/project_plan/frontend_plan.md): UI component architecture, client state management, and route specifications.

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

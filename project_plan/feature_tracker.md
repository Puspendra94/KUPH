# KUPH — Zero-Dependency Standalone Feature Tracker & Roadmap

This document serves as the master feature tracker and specification backlog for **KUPH** standalone, zero-external-dependency capabilities. All features listed here are designed to be built in-house using existing NestJS backend services, TypeORM entities, PostgreSQL database models, and React frontend UI components without third-party APIs.

---

## 📊 Master Feature Tracker Table

| ID | Feature Name | Priority | Target Location | Backend Module | Frontend View | Status |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: |
| **FT-01** | Customizable Deal Pipeline Stage Builder | `P1 - High` | Settings / Campaign | `CampaignModule` | `Settings.tsx`, `Campaigns.tsx` | 📋 Backlog |
| **FT-02** | Deliverable Milestone Checklist | `P1 - High` | Campaign Details | `CampaignModule` | `CampaignDetails.tsx` | 📋 Backlog |
| **FT-03** | Dynamic CRM Custom Attribute UI Builder | `P2 - Med` | Settings | `CrmModule` | `Settings.tsx`, `Influencers.tsx` | 📋 Backlog |
| **FT-04** | Interactive Passwordless Brand Magic Link Hub | `P1 - High` | Public Route | `CampaignModule` | `MagicLinkView.tsx` | 📋 Backlog |
| **FT-05** | Visual Audit Log & Activity Change History Timeline | `P2 - Med` | Settings | `AgencyModule` | `Settings.tsx` (Activity) | 📋 Backlog |
| **FT-06** | In-App Notification Center & Brief Template Engine | `P3 - Low` | Navbar / Campaigns | `NotificationModule` | `AppLayout.tsx`, `Campaigns.tsx` | 📋 Backlog |
| **FT-07** | Native Data Exporter (CSV & Excel) | `P2 - Med` | CRM / Dashboard | `CrmModule`, `SharedModule` | `Influencers.tsx`, `Clients.tsx` | 📋 Backlog |

---

## 📋 Feature Specifications & Acceptance Criteria

### FT-01: Customizable Deal Pipeline Stage Builder
- **Description**: Allows agency admins to define, reorder, and rename custom pipeline stages per agency (e.g. `Outreach` $\rightarrow$ `Contract Sent` $\rightarrow$ `Sample Mailed` $\rightarrow$ `Post Live` $\rightarrow$ `Payment Approved`) instead of fixed hardcoded status enums.
- **Backend Schema**: Add `pipeline_stages` (`JSONB`) column or entity to `Agency`.
- **API Endpoints**:
  - `GET /api/agency/pipeline-stages`
  - `PUT /api/agency/pipeline-stages`
- **Acceptance Criteria**:
  - [ ] Admins can add, edit, reorder, and delete stages in Settings.
  - [ ] Deals on Campaign Details page dynamically map to the custom agency stages.

---

### FT-02: Deliverable Milestone Checklist
- **Description**: Attach a deliverable checklist to each campaign deal (e.g. `[ ] 1x YouTube Video`, `[ ] 2x Instagram Stories`, `[ ] 1x TikTok`).
- **Backend Schema**: Add `deliverables` (`JSONB` array of `{ id, title, completed, dueDate }`) to `Deal` entity.
- **API Endpoints**:
  - `PATCH /api/campaigns/:id/deals/:dealId/deliverables`
- **Acceptance Criteria**:
  - [ ] Campaign managers can check/uncheck deliverables per deal.
  - [ ] Deal progress bar automatically calculates completion percentage ($0\% \rightarrow 100\%$).

---

### FT-03: Dynamic CRM Custom Attribute UI Builder
- **Description**: A visual editor in Settings enabling admins to configure custom CRM attributes for Influencers and Clients (e.g., *Location*, *Primary Platform*, *Pricing Tier*) without database migrations.
- **Backend Schema**: Uses existing `EntityConfig` entity and `custom_attributes` (`JSONB`) column.
- **API Endpoints**:
  - `GET /api/crm/config`
  - `POST /api/crm/config`
- **Acceptance Criteria**:
  - [ ] Admins can define dynamic fields with types (`string`, `number`, `select`, `boolean`).
  - [ ] "Add Influencer" and "Add Client" modals automatically render inputs matching the agency's `EntityConfig`.

---

### FT-04: Interactive Passwordless Brand Magic Link Hub
- **Description**: Expands the public Magic Link (`/api/public/campaigns/magic/:token`) into an interactive read-only brand client portal.
- **Backend Schema**: Uses existing JWT magic link token verification.
- **API Endpoints**:
  - `GET /api/public/campaigns/magic/:token`
  - `PATCH /api/public/campaigns/magic/:token/feedback`
- **Acceptance Criteria**:
  - [ ] Brand clients can view shortlisted creators, approve/reject pitches, and leave timestamped review notes.
  - [ ] Brand clients can view campaign brief metrics and budget allocation charts without logging in.

---

### FT-05: Visual Audit Log & Activity Timeline UI
- **Description**: A filterable audit log timeline UI under `/settings/activity` rendering historical change events captured by database activity triggers.
- **Backend Schema**: Uses existing `ActivityLog` entity.
- **API Endpoints**:
  - `GET /api/agency/activity-log?page=1&limit=20&actorId=xyz&entityType=campaign`
- **Acceptance Criteria**:
  - [ ] Filterable by actor, entity type (`Campaign`, `Influencer`, `Deal`), and date.
  - [ ] Expandable human-readable diff view showing old vs new values.

---

### FT-06: In-App Notification Center & Brief Template Engine
- **Description**: Navbar bell dropdown for internal team notifications (deal status changes, member invites, campaign milestones) and brief template creation.
- **Backend Schema**: Create `Notification` entity for in-app alerts; `BriefTemplate` entity for reusable briefs.
- **API Endpoints**:
  - `GET /api/notifications`
  - `PATCH /api/notifications/:id/read`
- **Acceptance Criteria**:
  - [ ] Real-time unread counter badge on navbar bell icon.
  - [ ] 1-click loading of saved campaign brief templates when creating new campaigns.

---

### FT-07: Native Data Exporter (CSV & Excel)
- **Description**: Export filtered CRM lists, client directories, or campaign summaries to downloadable `.csv` or `.xlsx` files using local file generation.
- **Backend/Frontend**: Uses browser `xlsx` library & Node streams.
- **Acceptance Criteria**:
  - [ ] "Export CSV/Excel" button on Influencers, Clients, and Campaign Details views.
  - [ ] Export respects active search query filters.

---

## 📈 Revision History & Execution Log

| Date | Branch | Changes / Milestones | Author |
| :--- | :--- | :--- | :--- |
| **2026-07-24** | `master` / `develop` | Scaffolded Monorepo, updated root/sub `.gitignore`, synced `.env.example`, created project & sub READMEs. | Puspendra Pandey |
| **2026-07-24** | `feature/auth` | Fixed Keycloak auth error handling, configured CORS for open origin support, added Playwright E2E test suite. | Puspendra Pandey |
| **2026-07-24** | `develop` | Activated all NestJS domain modules (`Agency`, `User`, `Notification`, `Storage`, `Subscription`), integrated LocalStack S3/SES. | Puspendra Pandey |
| **2026-07-24** | `develop` | Initialized `feature_tracker.md` standalone backlog specification. | Puspendra Pandey |

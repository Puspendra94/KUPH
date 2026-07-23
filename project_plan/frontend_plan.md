# KUPH — Frontend Master Plan (Universal App)

This document serves as the strict architectural blueprint for the KUPH frontend. Generate code adhering exactly to these specifications.

## 1. Tech Stack & Infrastructure
* **Framework:** Expo (React Native) for Universal App (Web, iOS, Android).
* **Styling:** NativeWind (Tailwind CSS for React Native).
* **State Management:** Zustand (for complex wizard state) + TanStack Query (Server state).
* **Auth Storage:** `expo-secure-store`.
* **File/Parsing:** `expo-document-picker` + SheetJS.
* **Notifications:** `expo-notifications`.

## 2. Authentication & Network
* **No Supabase:** Auth forms must post directly to the NestJS backend at `/api/auth/login` or `/api/auth/register`.
* **Google OAuth:** Trigger backend Identity Brokering flow.
* **Auth Flow:** Standard JWT-based `Bearer` header authentication.

## 3. Route Architecture (Expo Router)

### Public & Magic Links (`app/(public)`)
* `/` -> Landing page.
* `/login`, `/register` -> Auth forms.
* `/onboarding` -> **REQUIRED:** Dedicated step after first login to capture Agency Name/Details and perform bootstrap (API `/api/agency/onboard`).
* `/reset-password`
* `/join` -> UI for email tokens and manual short-code entry (Parity with old `/join` + `/accept-invite`).
* **`/magic/[token]` -> Brand Magic Link UI:** Polished, read-only interface for Brands to review and approve/reject/request changes.

### Protected App (`app/(app)`)
* `/(tabs)/dashboard` -> KPIs + Recharts.
* `/(tabs)/influencers` -> CRM + `<DataImportWizard />`.
* `/(tabs)/clients` -> CRM + `<DataImportWizard />`.
* `/(tabs)/campaigns` -> Master list.
* `/campaigns/[id]` -> Campaign Details (3-Tier workflow tabs).

### Settings Layout (`app/(settings)`)
**Strict Rule:** Entire layout hidden from non-admin users. Redirect non-admins to `/dashboard`.
* `/profile` -> User profile.
* `/team` -> Member management, invite generation (email/code), seat-limit UI.
* `/notifications` -> Map to `NotificationPref` database table (parity with old `notification_prefs` UI).
* `/billing` -> Plan switcher (Free / Pro / Max).
* `/activity` -> Pro+ Activity log viewer.
* `/danger` -> Leave/Delete agency.

## 4. Core UI Components & Workflows

### A. The 2-Step Import Wizard (`<DataImportWizard />`)
* **Step 1 (Preview):** Instant 5-10 row preview using SheetJS. Auto-map exact name matches to system fields. Mandatory fields check.
* **Step 2 (Execution):** POST `multipart/form-data` (file) + `JSON mapping` to `/api/crm/import/execute`.

### B. Campaign Details View (`<CampaignManager />`)
* **Tab 1 (Shortlist):** `pitch_status` management.
  * Includes the **"Generate Magic Link"** button (replaces old Excel export).
* **Tab 2 (Deals):** `workflow_status` tracking.
  * Granular statuses: `DEMO_APPROVAL_INITIATED`, `DEMO_CHANGE_REQUESTED`, `VIDEO_APPROVED`, etc.
  * Asset management UI (S3 upload integration).

### C. Feature Gating (`<PlanGate />`)
* Checks `agency.current_plan_id`. Locks UI (Activity Log, Notifications, Pro/Max features) based on tier matrix.
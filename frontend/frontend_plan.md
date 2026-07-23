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

### Auth Flow (Frontend-Mediated with Keycloak)
**Key change: The frontend talks directly to Keycloak for login, NOT through the backend.**

1. **Fetch Keycloak config** from `GET /api/auth/keycloak-config` on app startup
2. **Redirect user to Keycloak login** using the public SPA client (PKCE flow, no client_secret)
3. **After successful login**, Keycloak redirects back with an authorization code
4. **Exchange code for tokens** — `oidc-client-ts` or `@react-keycloak/app` handles this automatically
5. **Store the access token** in `expo-secure-store`
6. **Verify token with backend** via `GET /api/auth/me` (Bearer token) — backend validates against Keycloak JWKS, creates local user if new
7. **Include token** as `Authorization: Bearer <token>` on all API requests

### Keycloak Client Setup (Required in Keycloak Admin Console)
- Create a **public SPA client** (client id: `kuph-frontend`)
- Enable **Standard Flow** (Authorization Code with PKCE)
- Set **Valid Redirect URIs**: `app://callback`, `exp://*`
- No client_secret needed (public client)

### Library Recommendations
- **Web:** `oidc-client-ts` or `@react-keycloak/web`
- **Mobile (Expo):** `expo-auth-session` with Keycloak provider configuration
- **Alternative:** Raw `expo-web-browser` for auth redirects + manual token handling

### Auth API Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/keycloak-config` | GET | Returns `{ authServerUrl, realm, clientId }` for OIDC init |
| `/api/auth/me` | GET | Validates JWT, returns/creates user profile. Requires `Authorization: Bearer <token>` |

### Auth Flow Diagram
```
App Start
  ↓
GET /api/auth/keycloak-config  →  Get Keycloak URL, realm, clientId
  ↓
Redirect to Keycloak login (OIDC authorization endpoint)
  ↓
User logs in (email/password, Google SSO, magic link, etc.)
  ↓
Keycloak redirects back with authorization code
  ↓
Exchange code for tokens (access_token, refresh_token, id_token)
  ↓
Store access_token in expo-secure-store
  ↓
GET /api/auth/me (Authorization: Bearer <token>)
  ↓
Backend validates JWT via JWKS, creates local user if needed
  ↓
App is authenticated — proceed to dashboard
```

## 3. Route Architecture (Expo Router)

### Public & Magic Links (`app/(public)`)
* `/` -> Landing page.
* `/login`, `/register` -> Auth forms. (These now redirect to Keycloak's login page)
* `/onboarding` -> **REQUIRED:** Dedicated step after first login to capture Agency Name/Details and perform bootstrap (API `/api/agency/onboard`).
* `/reset-password` -> (Handled by Keycloak account console)
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
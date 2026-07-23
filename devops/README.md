# KUPH DevOps — Infrastructure & Deployment

This directory contains containerization manifests, local infrastructure services, environment deployment configs, and CI/CD pipelines for the **KUPH** platform.

---

## 🐳 Infrastructure Components

Local development and production deployment utilize Docker containers for background infrastructure:

```text
┌─────────────────────────────────────────────────────────────┐
│                    KUPH Platform Stack                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌────────────────┐
│  PostgreSQL  │       │   Keycloak   │       │     AWS S3     │
│  (Database)  │       │ (Identity)   │       │  (MinIO Local) │
│  Port: 5432  │       │  Port: 8080  │       │   Port: 9000   │
└──────────────┘       └──────────────┘       └────────────────┘
```

### 1. PostgreSQL Database
- **Port**: `5432`
- **Default Database**: `postgres` (or `kuph_db`)
- **Schema**: `kuph`
- **Features**: Triggers for activity logging, security definer functions, JSONB indexing.

### 2. Keycloak Identity Provider
- **Port**: `8080`
- **Admin Console**: `http://localhost:8080` (`admin` / `admin`)
- **Realm**: `kuph`
- **Clients**:
  - `kuph-backend` (Confidential client for token verification)
  - `kuph-frontend` (Public client for PKCE browser auth)
- **Identity Brokering**: Google OAuth 2.0 integration configured via Keycloak Admin Console.

---

## 🚀 Deployment Targets

1. **Frontend (Vite / Netlify / Node)**:
   - Configured for Netlify via [`frontend/netlify.toml`](file:///Users/puspendrapandey/Documents/KUPH/frontend/netlify.toml) or standalone Node environment (`dist/server/node-build.mjs`).
2. **Backend (NestJS)**:
   - Containerized NestJS build executed via `node dist/main.js` behind a reverse proxy (Nginx / AWS ALB).

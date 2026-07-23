# KUPH Frontend — Full-Stack Vite + React SPA & SSR Server

[![Vite](https://img.shields.io/badge/Bundler-Vite%208-purple?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/Framework-React%2018-blue?logo=react)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-cyan?logo=tailwindcss)](https://tailwindcss.com/)
[![Radix UI](https://img.shields.io/badge/UI-Radix%20Primitives-black)](https://www.radix-ui.org/)

The **KUPH Frontend** is a modern, high-performance web application powering the Agency Dashboard, Influencer/Client CRM, Campaign Manager, Deal Pipeline, Settings Administration, and Progressive Web App (PWA).

---

## 📂 Architecture Overview

The frontend package features a dual client/server bundle design:

```text
frontend/
├── client/                 # React Single Page Application (SPA)
│   ├── components/         # Radix UI primitives, Shadcn components, & custom UI widgets
│   ├── hooks/              # Custom hooks (usePlan, useCurrentAgency, useToast, etc.)
│   ├── lib/                # SW registration, Keycloak auth adapter, API client helpers
│   ├── pages/              # View components (Dashboard, Campaigns, CRM, Settings, etc.)
│   ├── App.tsx             # Main routing component & provider wrappers
│   ├── global.css          # Tailwind CSS design system tokens & animations
│   └── index.html          # SPA HTML template & PWA manifest linkages
│
├── server/                 # Express production server adapter
│   ├── index.ts            # Express server initialization & API middleware
│   └── node-build.ts       # Entrypoint for compiled Node server (serves dist/spa)
│
├── shared/                 # Shared TypeScript interfaces & API contracts
│   └── api.ts              # Common payload interfaces between client and server
│
├── public/                 # Web manifest, icons, and static public assets
├── vite.config.ts          # Client build configuration & PWA plugin
├── vite.config.server.ts   # Server SSR build configuration
├── tailwind.config.ts      # Tailwind design system tokens, colors, & keyframes
└── package.json
```

---

## 🎨 UI Component System & Stack

- **Design Tokens & Theme**: Custom HSL color palettes, dark mode support via `next-themes`, responsive container utilities, and smooth micro-animations.
- **Component Primitives**: 25+ Accessible Radix UI components (`@radix-ui/react-*`), including Dialogs, Accordions, Dropdown Menus, Navigation Menus, Tabs, and Toast notifications via `sonner`.
- **Form Controls & Validation**: `react-hook-form` paired with `zod` schemas and `@hookform/resolvers`.
- **Motion & Charts**: [Framer Motion](https://www.framer.com/motion/) for page transitions and micro-interactions; [Recharts](https://recharts.org/) for campaign analytics and revenue dashboards.
- **3D Graphics**: Three.js integration with `@react-three/fiber` and `@react-three/drei`.

---

## 📱 PWA (Progressive Web App) Setup

The frontend is fully configured for PWA installation on desktop and mobile:

- **Manifest**: Located at [`public/manifest.webmanifest`](file:///Users/puspendrapandey/Documents/KUPH/frontend/public/manifest.webmanifest) with theme colors, icons (192, 512, maskable), and `display: standalone`.
- **Service Worker Guard**: `src/lib/register-sw.ts` safely registers the service worker only in production host environments (preventing SW pollution in local dev or iframe preview environments).
- **Caching Strategy**:
  - `NetworkFirst` for HTML navigations.
  - `CacheFirst` for static assets (`.js`, `.css`, `.png`, `.svg`).

---

## ⚡ Getting Started

### 1. Environment Configuration
Create local `.env` file:
```bash
cp .env.example .env
```

Default environment parameters:
```env
PORT=3000
VITE_API_URL=http://localhost:3001/api
PING_MESSAGE=ping
```

### 2. Development Mode
Run Vite development server with hot module replacement (HMR):
```bash
pnpm run dev
# or
npm run dev
```

App will run at `http://localhost:5173`.

### 3. Production Build

Build client SPA and Express server adapter:
```bash
pnpm run build
```

This compiles:
- SPA bundle to `dist/spa`
- Express server bundle to `dist/server/node-build.mjs`

To run the production Node build:
```bash
pnpm run start
```

---

## 🧪 Testing & Quality Assurance

```bash
# Run Vitest unit & component tests
pnpm run test

# Run TypeScript type checker
pnpm run typecheck

# Format code with Prettier
pnpm run format.fix
```

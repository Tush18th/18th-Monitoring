# Dashboard Workspace (`apps/dashboard`)

The visualization and administration control plane mapping event ingestion flows directly to human-readable Key Performance Indicators.

## 🎯 App Purpose

The Web Dashboard handles the presentation layer utilizing a modern, reactive stack built on **Next.js 15 (App Router)**. It provides near-real-time synchronization parsing REST aggregates dynamically enforcing Tenant strict isolation guaranteeing users can only view KPIs authorized to their boundaries. 

By consuming complex telemetry (sync counts, HTTP errors, UX bottlenecks), it normalizes data dynamically into comprehensive chart summaries for Admins and read-only Overviews for basic Customers.

## 🔄 Routing Structure (Next.js)

- **`/login`**: Autonomous token generation. Secures gateway interceptors.
- **`/projects`**: Portfolio summary interface. Dynamically rendered for multi-project overseers (`SUPER_ADMIN`).
- **`/project/[projectId]/...`**: Tenant-scoped routes mapping specific boundaries:
    - `/overview`: Real-time primary operational KPIs.
    - `/alerts`: Triggered rule SLA evaluations.
    - `/customers`: RBAC viewer-management tools.
    - `/integrations`: External API/ERP Sync health summaries.
    - `/settings`: Rule threshold modifier controls (e.g. Page Load caps).

## 🧩 Key Components & Layout Structure

- `TopBar.tsx`: Manages cross-tenant workspace swapping safely validating available bounds ensuring isolation natively. Dispatches simulated background inputs securely.
- `RoleGuard.tsx`: Server/Client interceptor protecting explicit Next.js routes ensuring nested un-authorized bounces navigate gracefully.
- `AuthContext.tsx`: Core State Provider caching JWTs, intercepting 401 unauthenticated drops automatically through centralized Axios structures.

## 💾 State Management & Data Fetching

- Environment properties are explicitly prefixed natively: `NEXT_PUBLIC_API_URL`, capturing endpoints explicitly.
- The platform manages a globally wrapped Axios instance inside its `AuthContext` protecting token headers safely on each dynamic call routing gracefully.
- Component-level states natively await the global data feed executing inline mapping guarantees `Array.isArray(x)`. Ensure components use `.env` paths appropriately.

## ⚙️ How It Works (Data Flow)
1. User interacts (clicks specific `store_001` project context mapping bounds).
2. UI fetches data synchronously: `GET /api/v1/dashboard/summaries?siteId=store_001` dynamically evaluated by the `API_BASE` variables securely.
3. Axios interceptors inject session maps safely passing authorization checks.
4. Server parses data dynamically and responds.

## 🚀 Commands

Navigate specifically to this workspace boundary before running standard inputs:
```bash
npm install
npm run dev
npm run build
npm start
``` 

## 🔧 Known Issues & Fixes
- **Next.js Hook Isolation**: Importing Next.js Native Server context (e.g., `useParams`) requires proper React structural boundaries. Always assert `'use client';` inside pages navigating layout structures gracefully.
- **Interceptor 401 Ghosting**: Using outdated JWT cookies will silently force Axios to refresh your bounds sending you strictly to `/login`. Ensure you restart the UI if the backend flushes.

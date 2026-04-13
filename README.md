# E-Commerce Monitoring & Reporting Platform

A production-grade, multi-tenant observability platform designed to monitor e-commerce performance, integration health, and user activity with granular role-based access control.

## 📋 Project Overview

### Purpose
This platform provides a centralized control plane for monitoring high-traffic e-commerce ecosystems across multiple brands or projects. It captures real-time data from storefronts and backend services, aggregating business-critical KPIs to guarantee uptime and fast incident recovery.

### Key Features
- **Multi-Tenant SaaS Architecture**: Seamlessly manage multiple projects/stores from a single global portfolio landing page.
- **Dynamic KPI Engine**: Real-time computation of Page Load, Error Rates, Order Velocity, and Integration Sync health.
- **Automated Alerting**: Immediate detection and status tracking for SLA breaches relative to site-specific thresholds.
- **Role-Based Access Control (RBAC)**:
    - **Super Admin**: Global oversight, configuration, and portfolio access.
    - **Admin**: Full monitoring control over specific assigned projects.
    - **Customer/Viewer**: Restricted, read-only dashboard experiences natively sandboxed.

## 🏗️ Architecture Overview

The system strictly decouples concerns between state ingestion, processing, and multi-tenant visualization.

- **Frontend (`apps/dashboard`)**: A High-fidelity Next.js App Router workspace natively isolated bounding scopes per Active User.
- **Backend (`apps/api`)**: A fast Fastify API evaluating KPIs natively using persistent in-memory maps protecting data isolation.
- **Scripts (`scripts`)**: TypeScript utilities including an orchestration simulation mocking heavy telemetry ingestion traffic into the architecture.

**Data Flow**: `Simulation Scripts` / `Client Telemetry` → `apps/api` (Event Processing) → `apps/dashboard` (KPI Dashboards).

## 🧰 Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Backend API**: Fastify, Node.js (via `tsx`)
- **Language**: TypeScript (End-to-End)
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Network Layer**: Axios, native fetch primitives
- **Simulation**: Puppeteer (QA tracking), Kafka Mocks

## 📂 Folder Structure

```text
├── apps/
│   ├── dashboard/          # Next.js UI Workspace (Port 3000)
│   └── api/                # Fastify RBAC-protected Core API (Port 4000)
├── packages/               
│   └── db/                 # Modular Persistence (MemoryStore bounds)
├── scripts/                # E2E Event Simulation tools & QA scripts
├── screenshots/            # Automated UI verification dumps
└── tests/                  # Headless QA and browser validation suites
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm / pnpm

### Installation
1. Clone the repository and install all workspace boundaries globally:
   ```bash
   npm install
   ```

2. Establish Environment Boundaries:
   Ensure your env properties map correctly for proxy interceptions:
   ```bash
   # apps/dashboard/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:4000

   # apps/api/.env
   PORT=4000
   JWT_SECRET=your_secure_hash_secret_here
   ```

### Execution Commands
Boot the Fastify Backend API (handles authentication and data flows):
```bash
npx tsx apps/api/src/server.ts 
```

Boot the Next.js Dashboard:
```bash
cd apps/dashboard
npm run dev
```

Run Telemetry Simulation (From root):
```bash
npm run start:simulation
```

## 🛠️ Available Scripts
- `npm run start:simulation`: Executes `scripts/e2e-simulation.ts`, immediately generating multi-tenant traffic (Page views, JS Errors, OMS Syncs) and evaluating them against Rule Engines dynamically scaling alert statuses visible in the UI.

## 🌟 Features Overview
- **Global Portfolio**: High-level cross-tenant tracking aggregating active metrics across assigned boundaries.
- **KPI Monitoring**: Real-time evaluation of `syncSuccessRate`, `ordersDelayCount`, `pageLoadTime`, ensuring zero degradation latency metrics.
- **Real-Time Integration Alerts**: Tracks failing downstream flows (SAP/OMS/ERP sync traces).

## 🛑 Troubleshooting Guide
- **`user is not defined`**: Ensure `useAuth` is destructured appropriately within hooks (`const { user } = useAuth();`).
- **`projects.filter is not a function`**: Ensure `.env.local` accurately targets the backend `http://localhost:4000`. Relative paths without `API_BASE` appendings natively route into Next.js 404 HTML templates causing Array bounds to fail locally.
- **`⨯ Unable to compile TypeScript`**: If the `start:simulation` script crashes complaining about dependencies, ensure it runs exclusively via `tsx`, not `ts-node`.

## 📦 Deployment Notes
- **API Services**: The Fastify Node server can run autonomously natively using `pm2` or inside stateless Docker containers pointing to PostgreSQL.
- **Dashboard**: Use standard Vercel configurations targeting `apps/dashboard` strictly running standard `next build` static export bindings securely wrapping the environment keys dynamically.

# Ingestion & Dashboard API

The central communication hub for telemetry ingestion, data delivery, and multi-tenant access control.

## 1. Overview

The API application is a high-performance **Fastify** server written in TypeScript. It provides the endpoints for browser and server-side event ingestion, as well as the secure data layer for the multi-tenant monitoring dashboard.

## 2. Responsibilities

- **Multi-Tenant Authorization**: Enforce strict isolation between different projects/stores based on user role and project assignment.
- **Ingestion**: Receive, validate, and batch telemetry from clients.
- **Stream Publishing**: Hand off validated events to the `MemoryBus` for asynchronous processing.
- **Data Serving**: Provide RBAC-filtered summaries and alert logs.
- **Project Management**: Provide APIs for project discovery and customer provisioning.

## 3. How It Fits in Architecture

- **Upstream Sources**: JS Agent, External Server Logs.
- **Management Layer**: Admin UI (apps/dashboard).
- **Security Logic**:
    - `tenantAuthHandler`: Validates tokens and verify project membership.
    - `viewOnlyGuard`: Blocks write/simulate actions for restricted roles.
    - `roleGuard`: Ensures only admins/superadmins can manage customers or settings.

## 4. Key Endpoints

### Auth & Navigation
- `POST /api/v1/auth/login`: Issue session tokens.
- `GET /api/v1/user/me`: Identify active role and assigned projects.
- `GET /api/v1/projects`: List projects available to the user.

### Monitoring (Project Scoped)
- `GET /api/v1/dashboard/summaries`: Returns KPI averages filtered by `siteId`.
- `GET /api/v1/dashboard/alerts`: Returns recent breaches for a specific store.

### Management (Admin Only)
- `GET /api/v1/admin/projects/:projectId/customers`: List viewers for a shop.
- `POST /api/v1/admin/projects/:projectId/customers`: Invite new project viewers.
- `POST /api/v1/simulate`: Trigger controlled event injection for testing.

### Ingestion (Public Edge)
- `POST /api/v1/i/browser`: Batch ingestion from the JS agent.
- `POST /api/v1/i/server`: Batch ingestion from server-side SDKs.

## 5. Security Model

Every project-specific request is validated against the user's `assignedProjects` claim. 
- **Super Admins** bypass this check and see all data.
- **Regular Admins** are restricted to their specific storefronts.
- **Customers** are further restricted to read-only operations via the `viewOnlyGuard`.

## 6. Local Development

Run the API independently:
```bash
npm run dev --workspace=@kpi/api
```
The server will be available at http://localhost:4000.

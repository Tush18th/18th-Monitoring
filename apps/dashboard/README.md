# Multi-Tenant Dashboard

The visualization and administrative control plane for the E-Commerce Monitoring platform.

## 1. Overview

The Dashboard is a high-performance, role-aware web application built with **Next.js 15 (App Router)**. It provides real-time visualization of site health across multiple projects and serves as the management console for project admins.

## 2. Multi-Tenant Architecture

The dashboard uses a dynamic routing structure to achieve project isolation:
- **Global View**: `/projects` - Portfolio landing page for Super Admins.
- **Project Context**: `/project/[projectId]/...` - All monitoring and configuration pages are scoped to a specific store context.

### Access Control & Visibility
- **`AuthContext`**: Manages session tokens and role-based metadata.
- **`apiFetch` Wrapper**: Automatically attaches headers and handles global 401/403 redirections.
- **Role-Based Navigation**: 
    - **`RoleGuard`**: Protects administrative pages from viewer access.
    - **Dynamic Sidebar**: Filters links based on active user capabilities (e.g., hiding "Customers" for viewers).
    - **Project Switcher**: Filters the project list in the TopBar to only show assigned stores.

## 3. Core Pages (Project-Scoped)

- **Overview**: High-level KPI summary and capability roadmap.
- **Performance / Users / Orders / Integrations**: Dedicated domain monitors.
- **Alerts**: Real-time incident logs and breach history.
- **Settings**: Threshold management and project configuration (Admin Only).
- **Customers**: Viewer account provisioning and status management (Admin Only).

## 4. How It Fits in Architecture

- **Data Source**: Fetches authenticated data from **apps/api** (Port 4000).
- **Context Injection**: Uses the `projectId` URL segment to drive consistent data fetching across all sub-pages.
- **Safety Boundary**: The `/unauthorized` landing page provides a recovery path when RBAC boundaries are hit.

## 5. UI & Styling

The app uses **Tailwind CSS v4** and **Vanilla CSS** for a "Premium Light" aesthetic. It emphasizes glassmorphism, fluid transitions, and clear typography (Inter/Outfit) for professional readability.

## 6. Local Development

Run the dashboard independently:
```bash
npm run dev --workspace=@kpi/dashboard
```
The app will be available at http://localhost:3000.

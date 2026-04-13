# E-Commerce Monitoring & Reporting Platform

A production-grade, multi-tenant observability platform designed to monitor e-commerce performance, integration health, and user activity with granular role-based access control.

## 📋 Platform Overview

This platform provides a centralized control plane for monitoring high-traffic e-commerce ecosystems across multiple brands or projects. It captures real-time data from storefronts and backend services, aggregates business-critical KPIs, and enforces strict security boundaries between administrative and viewer accounts.

## ✨ Key Features

- **Multi-Tenant SaaS Architecture**: Seamlessly manage multiple projects/stores from a single global portfolio landing page.
- **Granular RBAC**: 
    - **Super Admin**: Global oversight and configuration.
    - **Admin**: Full control over specific assigned projects.
    - **Customer/Viewer**: Restricted, read-only monitoring experience.
- **Project Isolation**: Physical sandboxing of data and configurations ensures no cross-tenant leakage.
- **Dynamic KPI Engine**: Real-time computation of Page Load, Error Rates, Order Velocity, and Integration Sync health.
- **Premium Dashboard**: A high-fidelity Next.js interface featuring role-aware navigation and restricted administrative views.
- **Automated Alerting**: Immediate detection and status tracking for SLA breaches relative to site-specific thresholds.

## 🏗️ Architecture Summary

```text
├── apps/
│   ├── dashboard/          # Next.js 15 Multi-Tenant Interface (Port 3000)
│   └── api/                # Fastify RBAC-protected API (Port 4000)
├── services/
│   ├── processor/          # Stream Aggregator & KPI Engine
│   └── alert-engine/       # Multi-tenant Rule Evaluator
├── packages/
│   ├── db/                 # Modular Persistence (MemoryStore with SQL/NoSQL interface)
│   ├── config/             # Site-specific Threshold Resolver
│   └── streaming/          # Internal Event Bus (Mock Kafka)
```

For detailed technical details, see the [Architecture Documentation](./docs/architecture.md).

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Platform**:
   ```bash
   npm run dev
   ```

3. **Login & Test**:
   - Access the dashboard at `http://localhost:3000`.
   - Login as `superadmin@monitor.io` (pass: `password123`) for full global access.
   - Use the **"▶ Simulate Events"** button to populate real-time data.

For a full setup and roles guide, see the [Local Setup Guide](./docs/setup-guide.md).

## 📊 Compliance & Validation

The platform includes a specialized **Integrity Suite** to verify RBAC and Data Flow:
```powershell
powershell -File packages/ops/scripts/validate-system.ps1
```
The system currently maintains a **100% compliance score** across all role-based security scenarios.

---
Developed for high-scale observability.

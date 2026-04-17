# E-Commerce KPI Monitoring Platform

> **Status: Production-Grade Synthetic Monitoring + Observability Layer Active**

A production-grade observability, alerting, and synthetic monitoring platform for multi-tenant e-commerce environments. Provides real-time KPI ingestion, Core Web Vitals, automated synthetic journey validation, and deep ERP/OMS integration monitoring with strict tenant isolation.

---

## 🚀 Key Modules

### 1. 🧪 Synthetic Monitoring Agent (NEW)
Automated Playwright-based monitoring that runs every **4 hours** against real desktop and mobile browser contexts.

- **Journey Coverage**: Homepage Load, Login Flow, Signup Flow, Protected Route Access, Navigation
- **Device Emulation**: Full Chromium desktop + iPhone 13 mobile simulation
- **Metrics Captured per Run**:
  - Step-level pass/fail results
  - LCP, TTFB, CLS Core Web Vitals
  - Execution time per journey
  - Console errors & network failures
  - Screenshots on failure
  - Final journey success rate
- **Cron Schedule**: `0 */4 * * *` — runs at midnight, 4am, 8am, 12pm, 4pm, 8pm

### 2. 📊 Performance & Real User Monitoring (RUM) (ENHANCED)
High-fidelity tracking of frontend health using standardized Google metrics.

- **Page Load Metrics**: TTFB, FCP, LCP, Full Load Time, P95 Load Time
- **Rendering Metrics**: CLS, FID/INP, visual stability
- **Segmentation**: Desktop vs Mobile, Browser-level (Chrome/Safari/Edge/Firefox), Region-based
- **Resource Analysis**: JS, CSS, Images, Fonts weight breakdown

### 3. 🌍 Integration & ERP Governance
Real-time monitoring of the data supply chain.

- **Connectivity Map**: Visual status of SAP, Shopify, and Legacy system synchronization.
- **Sync Success Trends**: Area-chart tracking of ingestion health over the last 24 hours.
- **Manual Ingestion**: Operational controls for CSV reconciliation and manual sync triggers.

### 4. 📦 KPI Aggregation Engine
High-throughput event streaming and normalization.

- **Order Reconciliation**: Tracking delayed or stuck orders across the supply chain.
- **Revenue Monitoring**: Real-time sales tracking with anomaly detection.
- **Customer Intelligence**: Dynamic segmentation of active user sessions.

### 5. ✨ Premium Enterprise UI (NEW)
A modernized, high-conversion interface designed for focus and productivity.

- **Redesigned Auth Experience**: 2-column responsive layout with premium typography, mesh gradients, and role-based quick access.
- **Full Theme Support**: Native Light and Dark mode support across the entire platform.
- **Design System**: Built on a modular component library (`@kpi-platform/ui`) with strict 8px vertical rhythm and optimized accessibility.
- **Glassmorphism**: Subtle blur and transparency effects for a high-end, professional SaaS aesthetic.

---

## 🏗️ Technical Architecture

```
Browser/Mobile → Playwright Agent → POST /synthetic/run-results
                                          ↓
Source: Shopify/SAP → Ingestion Layer → Stream Processor → KPI Aggregation → API Layer → Next.js Dashboard
                                                                                  ↑            ↑
                                                              Shared UI Kit (@kpi-platform/ui) + ThemeProvider
                                                                                  ↑
                                                              In-Memory Store (GlobalMemoryStore)
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+

### Quick Start
```bash
# 1. Install all dependencies (including synthetic agent)
npm install
npm install --prefix apps/synthetic-agent

# 2. Install Playwright browsers
npx --prefix apps/synthetic-agent playwright install chromium

# 3. Start API + Dashboard (in one terminal)
npm run dev

# 4. (Optional) Start Synthetic Agent (in separate terminal)
npm run dev:synthetic

# 5. Boot Live Demo (Tushar's Creation)
# This injects 140+ realistic events into the running system
npm run demo:seed
```

### Environment Variables

**API** (`apps/api/.env.local`):
```
PORT=4000
JWT_SECRET=your_secret_here
```

**Synthetic Agent** (`apps/synthetic-agent/.env`):
```
TARGET_URL=http://localhost:3000    # Dashboard URL to test against
API_BASE=http://localhost:4000      # API base URL for ingestion
SITE_ID=store_001
AGENT_EMAIL=superadmin@monitor.io
AGENT_PASS=password123
```

---

## 📡 API Integration & Connectivity

The platform provides a production-grade API for high-throughput telemetry ingestion and cross-system monitoring.

### Available API Modules
- **Authentication**: JWT Management tokens and Site API Keys.
- **Ingestion**: Global REST endpoints for Browser (RUM) and Server (Transactional) events.
- **Analytics**: Aggregated KPI summaries, Order RCA, and Sync health trends.
- **Governance**: Audit logs, Access key rotation, and Connector configuration.

### 🚀 Quick Start: Your First API Call
Authenticate and fetch your project list in seconds:

```bash
# 1. Login to get your Bearer Token
export TOKEN=$(curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@monitor.io", "password": "password123"}' | jq -r '.token')

# 2. Call the Projects API
curl -X GET http://localhost:4000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN"
```

### 🔗 Integration Onboarding
- **E-Commerce Patterns**: Webhook templates for **Shopify**, **Magento**, and **Custom sites**.
- **Supply Chain**: Polling connectors for **SAP ERP**, **IBM Sterling OMS**, and **Marketing APIs**.

**[Read the Full API Integration Documentation →](./API_INTEGRATION.md)**

---

## 🔐 Security & Compliance
- **Tenant Isolation**: Strict middleware enforcement — User A cannot see Site B's data
- **Bearer JWT Auth**: All dashboard + synthetic endpoints require `Authorization: Bearer <token>`
- **Rate Limiting**: 100 requests/min per IP

---

## 🔔 Alerts

The alert engine triggers on:
| Event | Severity |
|-------|----------|
| Synthetic journey failure | Critical |
| LCP > 3000ms | High |
| Login / signup flow fails | Critical |
| Success rate < 95% | High |
| OMS sync failure | Critical |
| Error rate > 4% | High |

---

## 📖 Extended Documentation
- **[API Integration Specification](./API_INTEGRATION.md)** - Full production reference
- [API Synthetic Endpoints](./apps/api/README.md) - Payload reference
- [Dashboard README](./apps/dashboard/README.md) - Component tree
- [Synthetic Agent README](./apps/synthetic-agent/README.md) - Playwright setup

---

## 🚀 Live Demo Environment: "Tushar's Creation"

The system comes pre-configured with a comprehensive demo environment named **"Tushar's Creation"**.

### How to access:
1. Start the system: `npm run dev`
2. Run the seeder: `npm run demo:seed`
3. Login at `http://localhost:3000/login` with:
   - **Email:** `superadmin@monitor.io`
   - **Password:** `password123`
4. Select the **"Tushar's Creation"** project from the list.

### What is simulated:
- **E-Commerce Syncs:** Real-time order ingestion from Shopify and Magento.
- **Supply Chain Issues:** Controlled OMS sync failures on IBM Sterling for Root Cause Analysis (RCA) demonstration.
- **Performance Drift:** A simulated slow-loading checkout page (4.9s) triggering automated alerts.
- **Traffic Patterns:** Varied traffic across Desktop, Mobile, and Tablet browsers.

---
*Architecture: Antigravity Production Observability Platform · 2026*

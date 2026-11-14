# ACME Global Compensation & Salary Management System

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2012-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Unit%20%26%20Integration-87%20Passed%20(1.9s)-brightgreen)](backend/)

A compensation intelligence and salary management platform built for ACME's global operations across 5 countries (United States, India, United Kingdom, Germany, Singapore). Provides a single source of truth for **10,000 employees**, multi-currency normalization, real-time analytics, and transactional audit trails.

---

## 🚀 Quick Evaluation for Reviewers (Test in 5 Seconds)

The UI includes a **sticky top banner with 1-click demo role switching** so reviewers can test access control immediately without typing credentials:

| Role | Pre-configured Credentials | Capabilities |
| :--- | :--- | :--- |
| **`HR_ADMIN`** | `admin@acme.com` / `admin123` | **Full Read & Write**: Directory search, analytics, and revising employee salaries. |
| **`HR_VIEWER`** | `viewer@acme.com` / `viewer123` | **Read-Only**: Directory search, analytics, and audit history. Salary adjustments are disabled & forbidden. |

---

## 🏛️ System Architecture & Architecture Decision Records (ADRs)

Detailed architectural justifications are documented in [`docs/02-architecture-and-adr.md`](docs/02-architecture-and-adr.md):

* **[ADR-01: Monetary Precision via Integer Minor Units](docs/02-architecture-and-adr.md#adr-01-monetary-precision-via-integer-minor-units):** All salaries are stored as PostgreSQL `BIGINT` in the smallest currency subunit (cents, paise, pence) using a custom TypeORM `ColumnNumericTransformer` to prevent JavaScript floating-point drift and string concatenation bugs.
* **[ADR-02: Deterministic Baseline FX Normalization](docs/02-architecture-and-adr.md#adr-02-deterministic-baseline-fx-rate-normalization-at-writeseed-time):** Normalizes foreign currencies (`INR`, `GBP`, `EUR`, `SGD`) to USD at write/seed time. Database queries (`SUM()`, `AVG()`) run natively in PostgreSQL SQL in `< 20ms`.
* **[ADR-03: 10,000-Row Performance & Caching](docs/02-architecture-and-adr.md#adr-03-10000-row-query-performance--caching-strategy):** Composite B-tree indexes on `(country, department, level)` and `(base_salary_usd_minor)`. Server-side pagination capped at `limit <= 100`. Analytics cached with automatic mutation invalidation.
* **[ADR-04: Transactional Audit Trail](docs/02-architecture-and-adr.md#adr-04-transactional-audit-trail-for-salary-revisions):** Every salary update executes atomically inside a TypeORM transaction (`DataSource.transaction`), recording an immutable audit entry in `salary_history`.
* **[ADR-05: Declarative RBAC](docs/02-architecture-and-adr.md#adr-05-role-based-access-control-rbac):** Role protection via NestJS `@Roles(...)` decorator, `JwtAuthGuard`, and `RolesGuard`.

---

## 📦 Getting Started (Local Development)

### Prerequisites
* **Node.js** >= 20.x
* **Docker & Docker Compose**

### 1. Start PostgreSQL 16 Database
```bash
docker compose up -d
```

### 2. Setup & Seed Backend (10,000 Employees)
```bash
cd backend
npm install
npm run seed     # Batch-inserts 10,000 deterministic employees & demo users in ~2s
npm run start:dev
```
*Backend runs on `http://localhost:3000` (API prefix: `/api`).*  
*Swagger OpenAPI documentation is available at `http://localhost:3000/api/docs`.*

### 3. Start Frontend Dashboard
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Verification & Test Execution

Run the fast, deterministic test suites:

```bash
# In backend/
npm test            # Runs 87 unit & integration tests in < 2.0s
npm run build       # Verifies zero TypeScript errors (strict mode)

# In frontend/
npm run build       # Compiles TypeScript and builds Vite production bundle
```

### Test Suite Highlights
* **Currency Math (`currency.service.spec.ts`):** 22 tests verifying 1:1 USD identity, non-USD conversions, rounding guarantees, and input validations.
* **BigInt Serialization (`column-numeric.transformer.spec.ts`):** 9 tests ensuring PostgreSQL strings deserialize as numbers to prevent `"500000" + 100000 = "500000100000"`.
* **RBAC & Authorization (`rbac-and-salary.integration.spec.ts`):** Verifies `HR_ADMIN` write permissions vs `HR_VIEWER` 403 Forbidden enforcement.
* **Transactions (`transaction-and-currency.integration.spec.ts`):** Validates atomicity and database rollback on failure.

---

## 📂 Project Structure

```
acme-salary-manager/
├── docker-compose.yml         # PostgreSQL 16 Alpine container
├── docs/
│   ├── 01-one-page-requirements.md   # PRD, persona & non-goals
│   ├── 02-architecture-and-adr.md    # Architecture & ADRs 01-05
│   └── 03-ai-workflow-log.md         # Intentional AI collaboration log
├── backend/
│   ├── src/
│   │   ├── common/            # Transformers, Guards, Decorators, Filters
│   │   ├── database/          # TypeORM Entities (User, Employee, SalaryHistory)
│   │   │   └── seeders/       # Deterministic PRNG seeder (10k records)
│   │   ├── modules/
│   │   │   ├── auth/          # JWT authentication, Passport strategy
│   │   │   ├── currency/      # Deterministic FX normalization service
│   │   │   ├── employees/     # Paginated directory, transactional salary updates
│   │   │   └── analytics/     # Cached SQL aggregations (org payroll, regions, bands)
│   │   ├── main.ts            # Helmet, CORS, Swagger, ValidationPipe
│   │   └── app.module.ts      # TypeORM, Throttler, CacheModule configuration
│   └── test/                  # Integration tests (RBAC, Auth, Transactions)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.tsx             # Sticky 1-click demo role switcher
    │   │   ├── AnalyticsDashboard.tsx # Recharts visualizations & payroll burn KPIs
    │   │   ├── EmployeeTable.tsx      # 10k TanStack Table with search & facet filters
    │   │   ├── SalaryRevisionModal.tsx# Transactional revision modal with live USD preview
    │   │   └── AuditDrawer.tsx        # Chronological revision history timeline
    │   ├── services/api.ts            # Typed client API with Bearer token storage
    │   └── lib/utils.ts               # Intl.NumberFormat minor unit formatter
    └── vite.config.ts                 # Proxy configuration to backend:3000
```

---

## 📋 Documentation Reference Links

* [One-Page PRD & Non-Goals](docs/01-one-page-requirements.md)
* [System Architecture & ADRs](docs/02-architecture-and-adr.md)
* [AI Collaboration & Workflow Log](docs/03-ai-workflow-log.md)

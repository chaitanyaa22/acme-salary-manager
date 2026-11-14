# ACME Global Compensation & Salary Management — Backend API

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2012-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest%20(105%20tests)-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-cyan)](https://oxc.rs/)

The backend service for ACME's Global Compensation & Salary Management platform. Built with **NestJS 12**, **TypeORM**, and **PostgreSQL 16**, it manages compensation intelligence for **10,000+ employees** across 5 global operating countries (United States, India, United Kingdom, Germany, Singapore) with strict monetary precision, dynamic exchange rates, atomic transactional audits, and declarative role-based access control (RBAC).

---

## 🏛️ Architectural Foundations & ADR Highlights

Detailed architectural justifications are maintained in [`docs/02-architecture-and-adr.md`](../docs/02-architecture-and-adr.md):

* **[ADR-01: Monetary Precision via Integer Minor Units](../docs/02-architecture-and-adr.md#adr-01-monetary-precision-via-integer-minor-units)**  
  All base salaries are stored as PostgreSQL `BIGINT` in the smallest currency subunit (cents, paise, pence) via TypeORM's `ColumnNumericTransformer`. This eliminates IEEE 754 floating-point rounding drift and string-concatenation math errors.
* **[ADR-02: Deterministic Baseline FX Normalization](../docs/02-architecture-and-adr.md#adr-02-deterministic-baseline-fx-rate-normalization-at-writeseed-time)**  
  Local salaries (`INR`, `GBP`, `EUR`, `SGD`) are normalized to USD at write/seed time into `base_salary_usd_minor`. Multi-million record aggregations (`SUM()`, `AVG()`) run natively in PostgreSQL SQL in `< 20ms`.
* **[ADR-03: 10,000-Row Query Performance & Caching](../docs/02-architecture-and-adr.md#adr-03-10000-row-query-performance--caching-strategy)**  
  Indexed with composite B-trees on `(country, department, level)` and `(base_salary_usd_minor)`. Analytics endpoints employ an in-memory TTL cache with automatic invalidation upon mutations.
* **[ADR-04: Transactional Audit Trail for Salary Revisions](../docs/02-architecture-and-adr.md#adr-04-transactional-audit-trail-for-salary-revisions)**  
  Salary revisions run inside TypeORM atomic transactions (`DataSource.transaction`), guaranteeing that employee salary updates and immutable historical records in `salary_history` commit or roll back together.
* **[ADR-05: Declarative Role-Based Access Control (RBAC)](../docs/02-architecture-and-adr.md#adr-05-role-based-access-control-rbac)**  
  Endpoints are secured using `@Roles(Role.HR_ADMIN)` paired with `JwtAuthGuard` and `RolesGuard`. Non-privileged users (`HR_VIEWER`) receive immediate HTTP 403 Forbidden responses on modification attempts.
* **[ADR-06: Employee Lifecycle Management](../docs/02-architecture-and-adr.md#adr-06-employee-lifecycle-management-onboarding--soft-deletion)**  
  Supports onboarding (`POST /api/employees`) and soft-deletion offboarding (`DELETE /api/employees/:id`) setting `is_active = false`. Inactive employees are excluded from active headcount, directory listings, and compensation calculations while preserving audit histories.
* **[ADR-07: Dynamic Database-Driven Exchange Rates](../docs/02-architecture-and-adr.md#adr-07-dynamic-database-driven-exchange-rates--extensible-currencies)**  
  Exchange rates are stored dynamically in the `exchange_rates` table and cached in-memory with sub-millisecond lookups. When an HR Admin updates a currency's FX rate, active employee USD salaries for that currency are batch-recalculated across thousands of rows via a composite index `(currency, is_active)` in `< 30ms`.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | NestJS 12 (Express platform) | Modular enterprise architecture, DI container, robust pipeline |
| **Language** | TypeScript 5 (Strict Mode) | Strong type-safety across DTOs, entities, and services |
| **Database** | PostgreSQL 16 | Relational persistence, JSONB capabilities, B-tree composite indexing |
| **ORM** | TypeORM | Entity definitions, transactional entity manager, SQL query builder |
| **Auth** | Passport-JWT & bcrypt | Stateless token authentication, role extraction, credential hashing |
| **Documentation** | Swagger / OpenAPI (`@nestjs/swagger`) | Interactive API contracts & Swagger UI at `/api/docs` |
| **Testing** | Vitest 4 + Supertest | Blazing fast parallel execution (~105 tests in ~2 seconds) |
| **Linting** | Oxlint + Prettier | High-performance AST linting and unified code formatting |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `>= 20.x`
* **Docker & Docker Compose**: (or a local running PostgreSQL 16 instance)

### 1. Environment Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port the NestJS server listens on |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `acme_user` | Database user |
| `DB_PASSWORD` | `acme_password` | Database password |
| `DB_NAME` | `acme_salaries` | Database name |
| `DB_LOGGING` | `false` | Enable SQL query logging in development |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for frontend client requests |
| `JWT_SECRET` | `super-secret-acme-jwt-...` | Secret key used to sign and verify JWT tokens |
| `JWT_EXPIRATION` | `1d` | JWT token validity duration |

### 2. Start PostgreSQL
From the project root:

```bash
docker compose up -d
```

### 3. Install Dependencies & Seed Database
The seeding script drops existing tables, creates schemas, synchronizes dynamic exchange rates, inserts test users, and batch-inserts **10,000 deterministic employee records** in ~2 seconds:

```bash
npm install
npm run seed
```

### 4. Run the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The server starts at `http://localhost:3000`.  
The API is served with the `/api` global prefix.  
Interactive OpenAPI documentation is live at **`http://localhost:3000/api/docs`**.

---

## 🔑 Pre-seeded Reviewer Accounts

The database seeder creates two pre-configured user accounts for testing:

| Role | Email | Password | Allowed Operations |
| :--- | :--- | :--- | :--- |
| **`HR_ADMIN`** | `admin@acme.com` | `admin123` | Full access: View all data, revise salaries, onboard & offboard employees, manage FX rates |
| **`HR_VIEWER`** | `viewer@acme.com` | `viewer123` | Read-only: Search directory, view analytics, inspect salary history; all mutations return `403 Forbidden` |

---

## 📡 API Endpoints Reference

All endpoints (except `/api/auth/login`) require a valid Bearer JWT header: `Authorization: Bearer <token>`.

### Authentication
* `POST /api/auth/login` — Authenticate credentials and receive a JWT token.
* `GET /api/auth/me` — Inspect profile and assigned role of current token holder.

### Employee Directory & Management
* `GET /api/employees` — Paginated directory search (`page`, `limit`, `search`, `country`, `department`, `currency`, `level`, `sortBy`, `sortOrder`).
* `GET /api/employees/:id` — Retrieve full employee profile.
* `POST /api/employees` — *(HR_ADMIN only)* Onboard a new employee with initial salary.
* `DELETE /api/employees/:id` — *(HR_ADMIN only)* Soft-deactivate an employee (`is_active = false`).
* `POST /api/employees/:id/salary-revisions` — *(HR_ADMIN only)* Atomically revise salary and record audit history.
* `GET /api/employees/:id/history` — Fetch historical salary revision audit logs.

### Dynamic Currency & FX Rate Management
* `GET /api/currencies` — List all supported currencies and current exchange rates to USD.
* `POST /api/currencies` — *(HR_ADMIN only)* Register a new currency with baseline FX rate.
* `PATCH /api/currencies/:code` — *(HR_ADMIN only)* Update rate to USD; batch-recalculates USD base salaries for all active employees.

### Compensation Analytics
* `GET /api/analytics/summary` — Global overview: Total headcount, total payroll (minor/major), average salary (minor/major).
* `GET /api/analytics/by-country` — Country-level compensation summary normalized to USD.
* `GET /api/analytics/by-department` — Department-level compensation summary normalized to USD.

---

## 🧪 Testing & Verification

The backend is backed by an automated test suite executed with Vitest:

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with test coverage report
npm run test:cov

# Run End-to-End (E2E) suite
npm run test:e2e
```

### Key Test Coverage Highlights
* **Precision & Currency Conversion** (`currency.service.spec.ts`): 22 unit tests validating 1:1 USD preservation, foreign currency conversions, precision preservation, and edge cases.
* **Numeric Deserialization** (`column-numeric.transformer.spec.ts`): 9 tests ensuring PostgreSQL `BIGINT` numeric strings reliably parse to numbers.
* **Role-Based Access Control** (`rbac-and-salary.integration.spec.ts`): Integration tests verifying that `HR_ADMIN` updates succeed while `HR_VIEWER` receives `403 Forbidden`.
* **Atomic Transactions & Rollback** (`transaction-and-currency.integration.spec.ts`): Validates database rollback guarantees on revision failures.

---

## 📁 Project Directory Structure

```text
backend/
├── src/
│   ├── app.module.ts              # Root NestJS module wiring
│   ├── main.ts                    # Bootstrap entry point, Swagger, validation pipes
│   ├── common/                    # Shared infrastructure
│   │   ├── decorators/            # @CurrentUser(), @Roles()
│   │   ├── filters/               # Global HttpExceptionFilter
│   │   ├── guards/                # JwtAuthGuard, RolesGuard
│   │   └── transformers/          # ColumnNumericTransformer (BigInt handling)
│   ├── database/
│   │   ├── database.module.ts     # TypeORM connection configuration
│   │   ├── entities/              # Employee, SalaryHistory, ExchangeRate, User
│   │   └── seeders/               # 10,000-row batch seeder
│   └── modules/
│       ├── analytics/             # Real-time aggregations & in-memory cache
│       ├── auth/                  # Authentication, JWT strategy, login endpoint
│       ├── currency/              # FX rate management & USD recalculation engine
│       └── employees/             # Employee directory, onboarding, soft-delete, revisions
├── test/                          # Integration and RBAC test suites
├── vitest.config.ts               # Unit & integration test configuration
└── tsconfig.json                  # Strict TypeScript compiler options
```

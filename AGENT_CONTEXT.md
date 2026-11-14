# Project Context: ACME Global Compensation & Salary Management

## Assessment Context
This is a take-home engineering assessment for Incubyte (Software Craftsperson - Node/React/TypeScript).
Evaluation criteria: clean architecture, pragmatic engineering judgment, incremental Git commits, fast deterministic unit/integration tests, and intentional AI collaboration.

## Tech Stack & Constraints
- **Monorepo:** Single Git repo (`backend/` = NestJS + TypeORM + PostgreSQL, `frontend/` = React + Vite + Tailwind CSS + shadcn/ui + TanStack Table + Recharts).
- **Database:** PostgreSQL 16 (via `docker-compose.yml` locally; Neon/Supabase in prod).
- **Already Completed:**
  - `docs/01-one-page-requirements.md` (PRD & non-goals)
  - `docs/02-architecture-and-adr.md` (Architecture & ADRs)
  - `docker-compose.yml` & NestJS scaffold (`main.ts` with ValidationPipe/Swagger/Helmet, `app.module.ts` with TypeORM/Throttler/Cache).

## Non-Negotiable Architecture Rules (ADRs)
1. **Monetary Precision (ADR-01):** Store ALL salary amounts as `BIGINT` in minor units (cents/paise). Never use floating-point numbers for money calculations. Format to major units only in the UI.
2. **Multi-Currency Normalization (ADR-02):** Support `USD`, `INR`, `GBP`, `EUR`, `SGD`. Store both `base_salary_minor` (local) and `base_salary_usd_minor` (computed at write/seed time using a deterministic `CurrencyService`) so PostgreSQL `SUM()`/`AVG()` queries run natively in SQL.
3. **10,000-Row Performance (ADR-03):** Use composite B-tree indexes on `(country, department, level)` and `(base_salary_usd_minor)`, enforce server-side pagination (`page`, `limit <= 100`), and cache `/analytics/*` endpoints via NestJS `CacheModule` (invalidating on salary mutations).
4. **Transactional Audit Trail (ADR-04):** Every salary update must execute inside a TypeORM transaction (`DataSource.transaction`) that updates `employees` and inserts an immutable record into `salary_history`.
5. **RBAC:** Support two roles (`HR_ADMIN` = read/write, `HR_VIEWER` = read-only) enforced via NestJS `JwtAuthGuard` and `RolesGuard`, with one-click demo login buttons on the frontend.

## Remaining Incremental Commit Plan
1. `feat(domain): add User, Employee, SalaryHistory entities and CurrencyService`
2. `feat(auth): implement JWT authentication and RBAC guards (HR_ADMIN, HR_VIEWER)`
3. `feat(seed): add deterministic batch seeder for 10,000 global employees and demo users`
4. `feat(api): implement paginated employee directory, transactional salary updates, and cached analytics endpoints`
5. `test(backend): add fast deterministic Jest unit and integration tests for currency math, transactions, and RBAC`
6. `feat(frontend): build React + shadcn/ui dashboard with analytics charts, 10k employee table, salary revision modal, and audit drawer`
7. `docs: add AI workflow log (docs/03-ai-workflow-log.md) and production deployment README`

## Technical Guardrails & Conventions

1. **PostgreSQL `BIGINT` String Serialization (TypeORM Gotcha):**
   - The `pg` driver returns `BIGINT` columns as JavaScript `string`s by default to prevent precision loss (`Number.MAX_SAFE_INTEGER`).
   - Either use a TypeORM `ValueTransformer` (`to: (val) => val, from: (val) => Number(val)`—safe up to $90 trillion in cents) OR serialize `BIGINT` fields cleanly in response DTOs so arithmetic never accidentally concatenates strings (`"500000" + "100000" = "500000100000"`).

2. **Standardized API Response & Error Contract:**
   - Paginated list endpoints must return `{ data: T[], meta: { total: number, page: number, limit: number, totalPages: number } }`.
   - Use a global `HttpExceptionFilter` so all 4xx/5xx errors return a consistent JSON shape: `{ statusCode, message, error, timestamp, path }`.

3. **Frontend Component & UX Guardrails:**
   - Scaffold `frontend/` with Vite (`npm create vite@latest frontend -- --template react-ts`), Tailwind CSS, `shadcn/ui`, `@tanstack/react-table`, `recharts`, and `lucide-react`.
   - Include a **sticky top banner or login card with one-click demo logins** (`Admin: admin@acme.com / admin123` and `Viewer: viewer@acme.com / viewer123`) so reviewers can test RBAC in 5 seconds.
   - Format all minor-unit salaries using `Intl.NumberFormat` according to the employee's `currency` code (`USD`, `INR`, `GBP`, `EUR`, `SGD`).

4. **Strict Git Hygiene:**
   - Do **not** bundle multiple features into a single giant commit.
   - Run `npm test` and `npm run build` before every commit to verify zero TypeScript or test regressions.
   - Never commit `.env` files.
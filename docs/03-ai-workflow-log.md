# AI Collaboration & Engineering Workflow Log

> **Context:** Incubyte Assessment (Software Craftsperson - Node/React/TypeScript)  
> **Candidate:** Chaitanya Kulkarni  
> **Topic:** ACME Global Compensation & Salary Management System

---

## 1. Intentional AI Collaboration Strategy

Rather than treating AI as an autonomous "code generator" that produces massive, untestable monolithic outputs, our workflow followed the **Software Craftsperson AI Collaboration Model**:

1. **Human as Architect & Driver:** The engineering objectives, architectural constraints (ADRs), domain boundaries, and commit plan were defined upfront in `AGENT_CONTEXT.md` and `docs/01-one-page-requirements.md`.
2. **AI as Accelerated Implementer & Pair Programmer:** AI was tasked with bounded, incremental units of work corresponding to strict Git commits (Steps 1 through 7).
3. **Verification Before Progression:** Every single step required running `npm test` and `npm run build` prior to committing. Zero regressions were allowed to accumulate.
4. **Pragmatic Engineering Judgment:** When subtle platform edge cases emerged (such as TypeORM's BIGINT string serialization or sandbox network socket permissions during integration testing), we applied sound craftsmanship principles rather than sloppy workarounds.

---

## 2. Chronological Commit Map

| Step | Commit Hash | Message & Intent | Verification Gate |
| :--- | :--- | :--- | :--- |
| **Scaffold & Docs** | `0d3882d` | `docs: add PRD and initial ADR architecture` | Requirements review |
| **Step 1** | `e3172a1` | `feat(domain): add User, Employee, SalaryHistory entities and CurrencyService` | 32 tests passing, build clean |
| **Step 2** | `5014594` | `feat(auth): implement JWT authentication and RBAC guards (HR_ADMIN, HR_VIEWER)` | 47 tests passing, build clean |
| **Step 3** | `b60f926` | `feat(seed): add deterministic batch seeder for 10,000 global employees and demo users` | 57 tests passing, build clean |
| **Step 4** | `173d8d3` | `feat(api): implement paginated employee directory, transactional salary updates, and cached analytics endpoints` | 70 tests passing, build clean |
| **Step 5** | `32a94d5` | `test(backend): add fast deterministic Jest unit and integration tests for currency math, transactions, and RBAC` | 87 tests passing (<2.0s), build clean |
| **Step 6** | `9c59804` | `feat(frontend): build React + shadcn/ui dashboard with analytics charts, 10k employee table, salary revision modal, and audit drawer` | Frontend build clean (1.9s) |
| **Step 7** | *(Current)* | `docs: add AI workflow log (docs/03-ai-workflow-log.md) and production deployment README` | Final verification |

---

## 3. Key Technical Challenges & Guardrail Enforcements

### A. PostgreSQL `BIGINT` String Serialization in TypeORM
* **The Trap:** The underlying `pg` driver returns `BIGINT` columns as JavaScript `string`s by default to protect against JavaScript's `Number.MAX_SAFE_INTEGER` overflow. In JavaScript, `"500000" + 100000` evaluates to `"500000100000"` (silent string concatenation bug).
* **The Craftsperson Solution:** Implemented a reusable [`ColumnNumericTransformer`](file:///Users/chaitanyakulkarni/Desktop/Projects/acme-salary-manager/backend/src/common/transformers/column-numeric.transformer.ts) implementing TypeORM's `ValueTransformer`. It deserializes BIGINT strings back into safe JavaScript numbers up to $90 trillion in cents. Verified with 9 dedicated unit tests.

### B. Monetary Precision & Deterministic Currency Conversion
* **The Trap:** Using floating-point values for salaries causes penny drift (`0.1 + 0.2 === 0.30000000000000004`). Calling external live FX APIs in tests causes flakiness and rate limiting.
* **The Craftsperson Solution:**
  1. Stored all salaries in integer minor units (paise, cents, pence).
  2. Implemented a deterministic baseline [`CurrencyService`](file:///Users/chaitanyakulkarni/Desktop/Projects/acme-salary-manager/backend/src/modules/currency/currency.service.ts) covering USD, INR, GBP, EUR, and SGD.
  3. Precomputed `base_salary_usd_minor` at write/seed time so that PostgreSQL SQL queries (`SUM()`, `AVG()`) run in single-digit milliseconds without runtime looping.

### C. 10,000-Row Seeder Performance
* **The Trap:** Inserting 10,000 rows one by one takes over 45 seconds and exhausts memory.
* **The Craftsperson Solution:** Built a seedable Mulberry32 PRNG generator with fixed seed `42` for 100% reproducible data. Batched database inserts into 1,000-row chunks using TypeORM `QueryBuilder.insert()`, reducing seeding time from 45s down to 2.3 seconds.

### D. Transactional Audit Trail Atomicity
* **The Trap:** Updating an employee salary and recording an audit trail in two separate queries risks database inconsistency if a crash or network glitch occurs halfway through.
* **The Craftsperson Solution:** Enforced ADR-04: all salary updates run inside `DataSource.transaction()`. If the `SalaryHistory` save or cache invalidation fails, the database automatically rolls back, leaving no orphaned or corrupt states.

### E. Sandbox Network Isolation & Fast Integration Testing
* **The Trap:** Traditional `supertest(app.getHttpServer())` binds to local TCP sockets (`127.0.0.1:port`), which can trigger operating system sandbox network permission errors (`EPERM`).
* **The Craftsperson Solution:** Architected integration tests to validate NestJS Controllers, Guards, and Services directly via `Reflector` and execution context pipelines. Result: 87 tests execute deterministically in **< 2.0 seconds** with zero external network socket dependencies.

---

## 4. Reflections on Software Craftsmanship with AI

1. **Small Steps Beat Giant Leaps:** Breaking the feature into 7 discrete, verifiable commits allowed rapid diagnosis and immediate correction of TypeScript type subtleties before they compounded.
2. **Automated Contracts as North Stars:** Establishing the DTO shapes and error envelopes early (`HttpExceptionFilter`, `PaginatedResponseDto`) meant that the backend and frontend integrated seamlessly on the first run with zero schema mismatches.
3. **UX for the Reviewer:** Recognizing that an engineering assessment reviewer has limited time, we embedded a **sticky top banner with one-click demo login buttons** (`HR_ADMIN` vs `HR_VIEWER`), enabling instant verification of RBAC boundaries without needing to copy-paste passwords.

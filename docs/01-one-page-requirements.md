# ACME Global Compensation & Salary Management — One-Page PRD

## 1. Problem & Goal
ACME manages compensation for **10,000 employees across 5 countries** (India, United States, United Kingdom, Germany, Singapore) using fragmented spreadsheets. Manual updates introduce version conflicts, currency conversion errors, and zero auditability.

**Goal:** Build a web-based compensation management system that gives ACME's HR Manager a single source of truth to view, filter, and update employee salaries safely while answering org-wide pay questions in real time.

## 2. Target Persona & Core Questions Answered
**Persona:** HR Manager (and read-only Finance/Leadership stakeholders).

The system must immediately answer:
1. **Total Payroll Burn:** What is our total annual payroll commitment (normalized to USD and broken down by local currency)?
2. **Pay Distribution:** How does compensation vary across countries, departments, and job levels (L1–L6)?
3. **Audit & Change Tracking:** When was an employee's salary last adjusted, by how much, and why?

## 3. Scope (MVP Features)
* **Employee Compensation Directory:** Fast server-side search (by name/email/employee ID), multi-facet filtering (country, department, level), sorting, and pagination across 10,000 records.
* **Transactional Salary Revisions:** Update an employee's base salary with an effective date and reason, atomically recording an immutable `SalaryHistory` audit entry.
* **Multi-Currency Normalization:** Store salaries in local currency (`INR`, `USD`, `GBP`, `EUR`, `SGD`) alongside a normalized USD equivalent for accurate cross-border analytics.
* **Org Analytics Dashboard:** Real-time aggregations showing total headcount, total normalized payroll, average compensation by country/department, and level-band distributions.
* **Role-Based Access Control (RBAC):**
  * `HR_ADMIN`: Full read/write access (can adjust salaries and add employees).
  * `HR_VIEWER`: Read-only access to directory and analytics (cannot mutate salary data).

## 4. Deliberately Out-of-Scope (Non-Goals & Reasoning)
| Excluded Feature | Reasoning |
| :--- | :--- |
| **Country-Specific Tax & Statutory Deductions** (TDS, 401k, NI) | Tax rules vary drastically by jurisdiction and change annually; specialized EOR/payroll disbursement engines (Deel, ADP) own compliance. This tool focuses on *compensation intelligence*, not bank disbursement. |
| **Live External FX Rate Webhooks** | Integrating paid third-party FX APIs introduces external network fragility and rate-limit failures. Deterministic, versioned FX conversion rates stored in the system provide consistent analytical reporting. |
| **Self-Service Employee Portal & SSO** | The target user is the HR Manager. Adding employee logins and OAuth/SAML flows adds surface area without serving the core persona. JWT auth with pre-configured role accounts cleanly demonstrates access boundaries. |
| **Bulk CSV Import/Export Wizard** | Replaced by a deterministic 10,000-employee database seeder to ensure immediate out-of-the-box evaluation at scale. |

## 5. Success Criteria
* **Performance:** Filtered queries and analytics aggregations over 10,000 rows execute in **< 100ms**.
* **Financial Integrity:** Zero floating-point rounding errors in salary calculations or aggregations.
* **Maintainability:** Modular NestJS architecture with deterministic unit and integration tests covering core domain rules.
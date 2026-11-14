# ACME Global Compensation & Salary Management — Frontend Client

[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Radix UI](https://img.shields.io/badge/Primitives-Radix%20UI-161618?logo=radix-ui&logoColor=white)](https://www.radix-ui.com/)
[![TanStack Table](https://img.shields.io/badge/Data%20Grid-TanStack%20Table%20v8-FF4154)](https://tanstack.com/table)

The modern, responsive web application for ACME's Global Compensation & Salary Management platform. Built with **React 18**, **Vite 6**, **TypeScript**, and **Tailwind CSS**, it empowers HR and Finance leadership to explore global payroll intelligence, filter 10,000+ employee records with sub-second latency, onboard talent, execute atomic salary revisions, and maintain full audit compliance.

---

## 🚀 Key Features & Reviewer UX

### 1. 1-Click Role Switcher (Instant Reviewer Evaluation)
A persistent banner at the top of the interface provides instant one-click switching between pre-configured demo personas without typing credentials:
* **`HR_ADMIN`** (`admin@acme.com`): Full write privileges — Onboard employees, adjust salaries, soft-deactivate records, and manage FX exchange rates.
* **`HR_VIEWER`** (`viewer@acme.com`): Read-only mode — Search directory, view analytics, and inspect audit histories; all mutation buttons are disabled or hidden.

### 2. Real-Time Compensation Analytics
* **Executive Summary KPIs**: Live metrics displaying Active Headcount, Total Payroll Burn (in USD minor/major units), and Company-wide Average Salary.
* **Interactive Visualizations (Recharts)**:
  * **Payroll Burn by Country**: Responsive bar chart comparing total normalized USD payroll across operating jurisdictions.
  * **Department Headcount Breakdown**: Visual distribution of talent across Engineering, Sales, Product, Marketing, and Operations.

### 3. High-Performance Employee Directory (`EmployeeTable`)
* **Debounced Server-Side Search**: Instant querying across employee names, email addresses, and job titles.
* **Multi-Faceted Filtering**: Filter in real-time by Country, Department, Level, and Currency.
* **Adaptive Grid Sizing**: Table height dynamically adjusts to match exact row counts, eliminating awkward blank whitespace.
* **Sortable Headers & Dynamic Skeletons**: Interactive column sorting with clean loading skeletons.

### 4. Employee Lifecycle Management
* **Onboard Employee Modal (`AddEmployeeModal`)**: Clean entry modal with automatic form reset upon completion, currency selection, and live local-to-USD conversion calculation.
* **Salary Revision Modal (`SalaryRevisionModal`)**: Atomic salary adjustment modal showing previous salary, new proposed salary, percentage change indicator, and required audit reason note.
* **Accessible Deactivation Modal (`DeactivateEmployeeModal`)**: Custom Radix-powered confirmation dialog replacing browser native `window.confirm`.
* **Audit History Drawer (`AuditDrawer`)**: Slide-over timeline drawer displaying immutable historical salary changes, before/after values, percentage deltas, timestamp, and changing user.
* **Currency Rates Manager (`CurrencyRatesModal`)**: Dedicated modal for `HR_ADMIN` users to inspect and adjust baseline exchange rates to USD.

---

## 🛠️ Technology Stack & Libraries

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | React 18 | Functional components, Hooks, Concurrent UI rendering |
| **Build Tool** | Vite 6 | Lightning-fast development server & optimized production rollup |
| **Language** | TypeScript 5 (Strict) | End-to-end type safety matching backend API contracts |
| **Styling** | Tailwind CSS 3 | Utility-first, responsive, and maintainable styling |
| **UI Primitives** | Radix UI | Accessible headless dialogs, dropdowns, and tooltips |
| **Table Engine** | TanStack Table v8 | Powerful headless table state, sorting, and pagination |
| **Visualizations** | Recharts 2 | Responsive SVG charts (BarChart, PieChart, Tooltips) |
| **Icons** | Lucide React | Consistent, lightweight SVG icons |

---

## 📦 Getting Started

### Prerequisites
* **Node.js**: `>= 20.x`
* **Backend API**: The NestJS backend server running on `http://localhost:3000` (see [`backend/README.md`](../backend/README.md))

### 1. Environment Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration:
```env
VITE_API_URL=http://localhost:3000/api
```

### 2. Installation & Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application will be accessible at **`http://localhost:5173`**.

### 3. Production Build & Verification

```bash
# Typecheck and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Structure

```text
frontend/
├── index.html                     # HTML5 entry template
├── vite.config.ts                 # Vite bundler configuration & proxy settings
├── tailwind.config.js             # Tailwind CSS theme and color tokens
├── src/
│   ├── main.tsx                   # React root mounting point
│   ├── App.tsx                    # Root component (Auth state, modals, drawer)
│   ├── index.css                  # Global styles & Tailwind directives
│   ├── components/                # React UI components
│   │   ├── Header.tsx             # Brand header with 1-click demo role switcher
│   │   ├── LoginForm.tsx          # Credentials fallback login screen
│   │   ├── AnalyticsDashboard.tsx # Summary KPI cards & Recharts graphs
│   │   ├── EmployeeTable.tsx      # TanStack data table, filter bar & pagination
│   │   ├── AddEmployeeModal.tsx   # Employee onboarding modal with live FX preview
│   │   ├── SalaryRevisionModal.tsx# Salary revision modal with delta computation
│   │   ├── DeactivateEmployeeModal.tsx # Accessible soft-delete confirmation dialog
│   │   ├── CurrencyRatesModal.tsx # Real-time exchange rate management
│   │   └── AuditDrawer.tsx        # Slide-over revision audit trail timeline
│   ├── services/
│   │   └── api.ts                 # Typed fetch client with Bearer token interceptor
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces (Employee, Currency, etc.)
│   └── lib/
│       └── utils.ts               # Currency formatting helpers (Intl) & clsx merge
└── tsconfig.json                  # TypeScript compiler options
```

---

## 💰 Monetary Precision & Formatting

In alignment with **[ADR-01](../docs/02-architecture-and-adr.md#adr-01-monetary-precision-via-integer-minor-units)**:
* All financial figures from the API are received and stored as integers in **minor currency units** (e.g., `5000000` cents = `$50,000.00`).
* The helper function `formatCurrency(amountMinor, currency)` in [`src/lib/utils.ts`](src/lib/utils.ts) utilizes the standard browser `Intl.NumberFormat` API to format currency values accurately:
  * USD: `$150,000.00`
  * INR: `₹7,500,000.00`
  * GBP: `£95,000.00`
  * EUR: `€110,000.00`
  * SGD: `S$130,000.00`
* Live USD conversions calculate baseline values in real-time during salary entry using current exchange rates without floating-point compound errors.

---

## 🔒 Client-Side Role Enforcement (RBAC)

The UI dynamically adapts to the authenticated user's permissions:

| UI Element | `HR_ADMIN` | `HR_VIEWER` |
| :--- | :--- | :--- |
| **"+ Onboard Employee" Button** | Visible & clickable | Hidden |
| **"Currency Rates" Button** | Visible & clickable | Hidden |
| **Table "Revise Salary" Action** | Active dropdown option | Disabled / Hidden |
| **Table "Deactivate" Action** | Active dropdown option | Disabled / Hidden |
| **Audit Drawer Access** | Full view access | Full view access |
| **Analytics Dashboard** | Full view access | Full view access |

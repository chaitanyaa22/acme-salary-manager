export type UserRole = 'HR_ADMIN' | 'HR_VIEWER';

export type CurrencyCode = 'USD' | 'INR' | 'GBP' | 'EUR' | 'SGD';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface SalaryHistory {
  id: string;
  employeeId: string;
  previousSalaryMinor: number;
  newSalaryMinor: number;
  previousSalaryUsdMinor: number;
  newSalaryUsdMinor: number;
  currency: CurrencyCode;
  effectiveDate: string;
  reason: string;
  changedBy?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  department: string;
  level: string;
  jobTitle: string;
  currency: CurrencyCode;
  baseSalaryMinor: number;
  baseSalaryUsdMinor: number;
  hireDate: string;
  isActive: boolean;
  salaryHistories?: SalaryHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CurrencyBreakdown {
  currency: CurrencyCode;
  headcount: number;
  totalMinor: number;
  totalMajor: number;
  avgMinor: number;
  avgMajor: number;
}

export interface AnalyticsSummary {
  totalHeadcount: number;
  totalPayrollUsdMinor: number;
  totalPayrollUsdMajor: number;
  avgSalaryUsdMinor: number;
  avgSalaryUsdMajor: number;
  currencyBreakdown: CurrencyBreakdown[];
}

export interface CountryAnalytics {
  country: string;
  currency: CurrencyCode;
  headcount: number;
  totalUsdMinor: number;
  totalUsdMajor: number;
  avgUsdMinor: number;
  avgUsdMajor: number;
}

export interface DepartmentAnalytics {
  department: string;
  headcount: number;
  totalUsdMinor: number;
  totalUsdMajor: number;
  avgUsdMinor: number;
  avgUsdMajor: number;
}

export interface LevelAnalytics {
  level: string;
  headcount: number;
  totalUsdMinor: number;
  totalUsdMajor: number;
  avgUsdMinor: number;
  avgUsdMajor: number;
  minUsdMinor: number;
  minUsdMajor: number;
  maxUsdMinor: number;
  maxUsdMajor: number;
}

export interface QueryEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  department?: string;
  level?: string;
  currency?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

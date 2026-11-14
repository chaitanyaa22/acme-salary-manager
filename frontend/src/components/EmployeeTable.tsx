import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Employee, UserRole, QueryEmployeesParams, PaginationMeta, ExchangeRate } from '../types';
import { formatCurrency } from '../lib/utils';
import { DeactivateEmployeeModal } from './DeactivateEmployeeModal';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  History,
  Lock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  UserPlus,
  UserMinus,
  Coins,
} from 'lucide-react';

interface EmployeeTableProps {
  data: Employee[];
  meta: PaginationMeta;
  params: QueryEmployeesParams;
  onParamsChange: (newParams: Partial<QueryEmployeesParams>) => void;
  onReviseSalary: (employee: Employee) => void;
  onViewHistory: (employee: Employee) => void;
  onOpenAddEmployee?: () => void;
  onDeactivateEmployee?: (employee: Employee) => Promise<void> | void;
  onOpenCurrencies?: () => void;
  currencies?: ExchangeRate[];
  isLoading: boolean;
  userRole?: UserRole;
}

const COUNTRIES = ['United States', 'India', 'United Kingdom', 'Germany', 'Singapore'] as const;
const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
] as const;
const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;

/**
 * High-fidelity Skeleton Row with matching column widths, heights, and alignments.
 * Eliminates layout shifts (CLS) when switching filters or paginating.
 */
const SkeletonRow: React.FC<{ index: number }> = React.memo(({ index }) => {
  // Stagger opacity slightly for a natural wave animation
  const delayClass = index % 2 === 0 ? 'opacity-90' : 'opacity-70';

  return (
    <tr className={`border-b border-slate-100 animate-pulse ${delayClass}`}>
      {/* 1. ID */}
      <td className="py-3 px-4">
        <div className="h-4 w-16 bg-slate-200/90 rounded" />
      </td>

      {/* 2. Employee Name & Job Title */}
      <td className="py-3 px-4">
        <div className="h-4 w-28 bg-slate-200/90 rounded mb-1" />
        <div className="h-3 w-40 bg-slate-100 rounded" />
      </td>

      {/* 3. Location */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </td>

      {/* 4. Department */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="h-4 w-24 bg-slate-100 rounded" />
      </td>

      {/* 5. Level Badge */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="h-5 w-8 bg-slate-200/80 rounded" />
      </td>

      {/* 6. Local Salary */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="h-4 w-20 bg-slate-200/80 rounded ml-auto" />
      </td>

      {/* 7. Normalized USD */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="h-4 w-20 bg-slate-200/90 rounded ml-auto" />
      </td>

      {/* 8. Actions (Revise, Audit, Offboard Buttons) */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          <div className="h-6 w-14 bg-slate-100 rounded" />
          <div className="h-6 w-14 bg-slate-100 rounded" />
          <div className="h-6 w-14 bg-slate-100 rounded" />
        </div>
      </td>
    </tr>
  );
});
SkeletonRow.displayName = 'SkeletonRow';

/**
 * Memoized Row Component preventing re-renders of unaffected rows.
 */
interface EmployeeTableRowProps {
  employee: Employee;
  isAdmin: boolean;
  onReviseSalary: (employee: Employee) => void;
  onViewHistory: (employee: Employee) => void;
  onDeactivateEmployee?: (employee: Employee) => void;
}

const EmployeeTableRow = React.memo<EmployeeTableRowProps>(({
  employee,
  isAdmin,
  onReviseSalary,
  onViewHistory,
  onDeactivateEmployee,
}) => {
  return (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
      {/* ID */}
      <td className="py-3 px-4 font-mono font-medium text-blue-600">
        {employee.employeeId}
      </td>

      {/* Name & Title */}
      <td className="py-3 px-4">
        <div className="font-semibold text-slate-900">
          {employee.firstName} {employee.lastName}
        </div>
        <div className="text-[11px] text-slate-500 truncate max-w-xs">
          {employee.jobTitle}
        </div>
      </td>

      {/* Country */}
      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
        {employee.country}
      </td>

      {/* Department */}
      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
        {employee.department}
      </td>

      {/* Level Badge */}
      <td className="py-3 px-4 whitespace-nowrap">
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          {employee.level}
        </span>
      </td>

      {/* Local Salary (Minor formatted to Major) */}
      <td className="py-3 px-4 text-right font-medium text-slate-900 whitespace-nowrap">
        {formatCurrency(employee.baseSalaryMinor, employee.currency)}
      </td>

      {/* Normalized USD (Minor formatted to Major) */}
      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
        {formatCurrency(employee.baseSalaryUsdMinor, 'USD')}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          {/* Revise Salary Button */}
          <button
            onClick={() => onReviseSalary(employee)}
            title={
              isAdmin
                ? 'Adjust employee compensation'
                : 'Requires HR_ADMIN role (Viewer is read-only)'
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              isAdmin
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isAdmin ? <Edit3 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Revise</span>
          </button>

          {/* Audit History Button */}
          <button
            onClick={() => onViewHistory(employee)}
            title="View compensation revision audit trail"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit</span>
          </button>

          {/* Offboard / Deactivate Button (HR_ADMIN only) */}
          {isAdmin && onDeactivateEmployee && (
            <button
              onClick={() => onDeactivateEmployee(employee)}
              title="Offboard / deactivate employee"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <UserMinus className="w-3.5 h-3.5" />
              <span>Offboard</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});
EmployeeTableRow.displayName = 'EmployeeTableRow';

export const EmployeeTable: React.FC<EmployeeTableProps> = React.memo(({
  data,
  meta,
  params,
  onParamsChange,
  onReviseSalary,
  onViewHistory,
  onOpenAddEmployee,
  onDeactivateEmployee,
  onOpenCurrencies,
  currencies,
  isLoading,
  userRole = 'HR_VIEWER',
}) => {
  const [searchInput, setSearchInput] = useState<string>(params.search || '');
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<Employee | null>(null);
  const isAdmin = userRole === 'HR_ADMIN';

  const availableCurrencies = useMemo(() => {
    if (currencies && currencies.length > 0) {
      return currencies.filter((c) => c.isActive).map((c) => c.code);
    }
    return ['USD', 'INR', 'GBP', 'EUR', 'SGD'];
  }, [currencies]);

  // Synchronize local input if search query is reset externally
  useEffect(() => {
    setSearchInput(params.search || '');
  }, [params.search]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onParamsChange({ search: searchInput.trim() || undefined, page: 1 });
  }, [searchInput, onParamsChange]);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    onParamsChange({
      search: undefined,
      country: undefined,
      department: undefined,
      level: undefined,
      currency: undefined,
      page: 1,
    });
  }, [onParamsChange]);

  const handleSort = useCallback((field: string) => {
    if (params.sortBy === field) {
      onParamsChange({
        sortOrder: params.sortOrder === 'ASC' ? 'DESC' : 'ASC',
        page: 1,
      });
    } else {
      onParamsChange({
        sortBy: field,
        sortOrder: 'ASC',
        page: 1,
      });
    }
  }, [params.sortBy, params.sortOrder, onParamsChange]);

  const renderSortIcon = useCallback((field: string) => {
    if (params.sortBy !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return params.sortOrder === 'DESC' ? (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    );
  }, [params.sortBy, params.sortOrder]);

  // Determine skeleton row count: dynamically matches current rendered rows or page limit to prevent empty white space
  const skeletonCount = useMemo(() => {
    if (data.length > 0) {
      return Math.min(data.length, params.limit || 20);
    }
    return Math.min(params.limit || 20, 5);
  }, [data.length, params.limit]);

  const hasActiveFilters = Boolean(
    params.country || params.department || params.level || params.currency || params.search
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or employee ID (e.g. ACM-00042)..."
              className="w-full pl-9 pr-20 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            {/* Quick Clear Filter Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Filters</span>
              </button>
            )}

            {/* Currency Rates Button */}
            {onOpenCurrencies && (
              <button
                onClick={onOpenCurrencies}
                disabled={isLoading}
                title="Manage corporate FX rates & currencies"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Currency Rates</span>
              </button>
            )}

            {/* Onboard New Employee Button (HR_ADMIN only) */}
            {isAdmin && onOpenAddEmployee && (
              <button
                onClick={onOpenAddEmployee}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Employee</span>
              </button>
            )}
          </div>
        </div>

        {/* Facet Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-semibold uppercase text-[10px] mr-1">
            <Filter className="w-3 h-3" />
            <span>Filters:</span>
          </div>

          {/* Country */}
          <select
            value={params.country || ''}
            onChange={(e) => onParamsChange({ country: e.target.value || undefined, page: 1 })}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Countries</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Department */}
          <select
            value={params.department || ''}
            onChange={(e) => onParamsChange({ department: e.target.value || undefined, page: 1 })}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Level */}
          <select
            value={params.level || ''}
            onChange={(e) => onParamsChange({ level: e.target.value || undefined, page: 1 })}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Currency */}
          <select
            value={params.currency || ''}
            onChange={(e) => onParamsChange({ currency: e.target.value || undefined, page: 1 })}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Currencies</option>
            {availableCurrencies.map((cur) => (
              <option key={cur} value={cur}>{cur}</option>
            ))}
          </select>

          <span className="ml-auto text-xs font-semibold text-slate-500">
            {isLoading ? (
              <span className="inline-block w-16 h-4 bg-slate-200 animate-pulse rounded" />
            ) : (
              `${meta.total?.toLocaleString() ?? 0} matches`
            )}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
            <tr>
              <th
                onClick={() => handleSort('employeeId')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 group transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>ID</span>
                  {renderSortIcon('employeeId')}
                </div>
              </th>
              <th
                onClick={() => handleSort('firstName')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 group transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Employee</span>
                  {renderSortIcon('firstName')}
                </div>
              </th>
              <th
                onClick={() => handleSort('country')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 group transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Location</span>
                  {renderSortIcon('country')}
                </div>
              </th>
              <th
                onClick={() => handleSort('department')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 group transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Department</span>
                  {renderSortIcon('department')}
                </div>
              </th>
              <th
                onClick={() => handleSort('level')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 group transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Level</span>
                  {renderSortIcon('level')}
                </div>
              </th>
              <th
                onClick={() => handleSort('baseSalaryMinor')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 group text-right transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Local Salary</span>
                  {renderSortIcon('baseSalaryMinor')}
                </div>
              </th>
              <th
                onClick={() => handleSort('baseSalaryUsdMinor')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 group text-right transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Normalized USD</span>
                  {renderSortIcon('baseSalaryUsdMinor')}
                </div>
              </th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: skeletonCount }).map((_, i) => (
                <SkeletonRow key={`skeleton-${i}`} index={i} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <p className="font-semibold text-slate-600">No employees found</p>
                  <p className="text-xs mt-1">Try broadening your search or resetting filters.</p>
                </td>
              </tr>
            ) : (
              data.map((employee) => (
                <EmployeeTableRow
                  key={employee.id}
                  employee={employee}
                  isAdmin={isAdmin}
                  onReviseSalary={onReviseSalary}
                  onViewHistory={onViewHistory}
                  onDeactivateEmployee={isAdmin && onDeactivateEmployee ? setEmployeeToDeactivate : undefined}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span>Rows per page:</span>
          <select
            value={params.limit || 20}
            onChange={(e) => onParamsChange({ limit: parseInt(e.target.value, 10), page: 1 })}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-400 ml-2">
            Showing {((meta.page - 1) * meta.limit) + (data.length > 0 ? 1 : 0)} -{' '}
            {((meta.page - 1) * meta.limit) + data.length} of {meta.total.toLocaleString()} records
          </span>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 mr-2">
            Page {meta.page} of {meta.totalPages || 1}
          </span>
          <button
            onClick={() => onParamsChange({ page: meta.page - 1 })}
            disabled={meta.page <= 1 || isLoading}
            className="p-1.5 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onParamsChange({ page: meta.page + 1 })}
            disabled={meta.page >= meta.totalPages || isLoading}
            className="p-1.5 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offboard Deactivation Confirmation Modal (HR_ADMIN only) */}
      <DeactivateEmployeeModal
        employee={employeeToDeactivate}
        isOpen={!!employeeToDeactivate}
        onClose={() => setEmployeeToDeactivate(null)}
        onConfirm={async (emp) => {
          if (onDeactivateEmployee) {
            await onDeactivateEmployee(emp);
          }
        }}
        userRole={userRole}
      />
    </div>
  );
});
EmployeeTable.displayName = 'EmployeeTable';
